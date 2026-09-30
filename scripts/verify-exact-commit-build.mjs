#!/usr/bin/env node

import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import {
  mkdtemp,
  readFile,
  readdir,
  realpath,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { prepareFreshWorkspaceOutput } from "./release-path-safety.mjs";

const root = process.cwd();
const args = process.argv.slice(2);
const captureIndex = args.indexOf("--capture");
const outputIndex = args.indexOf("--output");
const captureMode = captureIndex !== -1;
const recordArg = args.find((arg, index) => {
  if (arg.startsWith("--")) return false;
  if (captureIndex !== -1 && index === captureIndex + 1) return false;
  if (outputIndex !== -1 && index === outputIndex + 1) return false;
  return true;
});
const npmCli = process.env.npm_execpath;

if (!npmCli) {
  throw new Error("Run this verifier through npm so npm_execpath is pinned and observable");
}

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const toPosix = (value) => value.split(path.sep).join("/");
const isInside = (file, directory) => {
  const relative = path.relative(directory, file);
  return relative !== "" && !relative.startsWith("..") && !path.isAbsolute(relative);
};

async function walkRegularFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walkRegularFiles(fullPath)));
    else if (entry.isFile()) files.push(fullPath);
    else throw new Error(`Non-regular build output is not allowed: ${fullPath}`);
  }
  return files;
}

async function snapshotTree(directory) {
  const files = (await walkRegularFiles(directory)).sort();
  const entries = await Promise.all(
    files.map(async (file) => {
      const bytes = await readFile(file);
      return {
        path: toPosix(path.relative(directory, file)),
        bytes: bytes.length,
        sha256: sha256(bytes),
      };
    }),
  );
  entries.sort((left, right) => left.path.localeCompare(right.path));
  const treeMaterial = entries.map((entry) => `${entry.sha256}  ${entry.path}\n`).join("");
  return {
    files: entries.length,
    bytes: entries.reduce((sum, entry) => sum + entry.bytes, 0),
    treeSha256: sha256(treeMaterial),
    entries,
  };
}

function compareEntries(expected, actual) {
  const expectedByPath = new Map(expected.map((entry) => [entry.path, entry]));
  const actualByPath = new Map(actual.map((entry) => [entry.path, entry]));
  const allPaths = [...new Set([...expectedByPath.keys(), ...actualByPath.keys()])].sort();
  return allPaths
    .filter((entryPath) => {
      const left = expectedByPath.get(entryPath);
      const right = actualByPath.get(entryPath);
      return !left || !right || left.bytes !== right.bytes || left.sha256 !== right.sha256;
    })
    .map((entryPath) => ({
      path: entryPath,
      expected: expectedByPath.get(entryPath) ?? null,
      rebuilt: actualByPath.get(entryPath) ?? null,
    }));
}

async function run(command, commandArgs, cwd, log) {
  const rendered = [command, ...commandArgs].join(" ");
  log.push(`\n$ ${rendered}\n`);
  return new Promise((resolve, reject) => {
    const child = spawn(command, commandArgs, {
      cwd,
      env: { ...process.env, CI: "true" },
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
    });
    child.stdout.on("data", (chunk) => {
      const value = String(chunk);
      log.push(value);
      process.stdout.write(value);
    });
    child.stderr.on("data", (chunk) => {
      const value = String(chunk);
      log.push(value);
      process.stderr.write(value);
    });
    child.once("error", reject);
    child.once("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${rendered} exited with code ${code}`));
    });
  });
}

async function runText(command, commandArgs, cwd, log) {
  const chunks = [];
  const rendered = [command, ...commandArgs].join(" ");
  log.push(`\n$ ${rendered}\n`);
  await new Promise((resolve, reject) => {
    const child = spawn(command, commandArgs, {
      cwd,
      env: process.env,
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
    });
    child.stdout.on("data", (chunk) => chunks.push(chunk));
    child.stderr.on("data", (chunk) => log.push(String(chunk)));
    child.once("error", reject);
    child.once("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${rendered} exited with code ${code}`));
    });
  });
  const value = Buffer.concat(chunks).toString("utf8").trim();
  log.push(`${value}\n`);
  return value;
}

let releaseId = null;
let expected = null;
let commit;
let branch = null;
let recordPath = null;
let manifestPath = null;

if (captureMode) {
  commit = args[captureIndex + 1];
  if (!/^[0-9a-f]{40}$/u.test(commit ?? "")) {
    throw new Error("--capture requires a full 40-character commit SHA");
  }
} else {
  recordPath = path.resolve(
    recordArg ?? "docs/release-evidence/W8_RELEASE_ACCEPTANCE.json",
  );
  const record = JSON.parse(await readFile(recordPath, "utf8"));
  releaseId = record.releaseId;
  commit = record.candidate?.commit;
  branch = record.candidate?.branch ?? null;
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/u.test(releaseId ?? "")) {
    throw new Error("Acceptance record releaseId is missing or unsafe");
  }
  if (!/^[0-9a-f]{40}$/u.test(commit ?? "")) {
    throw new Error("Acceptance record must contain a full candidate commit SHA");
  }
  manifestPath = path.resolve(root, record.candidate?.artifactManifest ?? "");
  const evidenceRoot = path.resolve(root, "docs/release-evidence", releaseId);
  if (!isInside(recordPath, evidenceRoot) || !isInside(manifestPath, evidenceRoot)) {
    throw new Error("Acceptance record and artifact manifest must stay inside their release directory");
  }
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  if (manifest.schema !== "foldwink-pilot-artifact-manifest-v1") {
    throw new Error("Unsupported candidate artifact manifest schema");
  }
  expected = {
    appVersion: record.candidate?.appVersion,
    lockSha256: record.candidate?.lockAtCommitSha256,
    artifactSha256: record.candidate?.artifactSha256,
    distTreeSha256: record.candidate?.distTreeSha256,
    distEntries: manifest.dist?.entries,
  };
  if (!Array.isArray(expected.distEntries) || expected.distEntries.length === 0) {
    throw new Error("Candidate manifest has no dist entries");
  }
}

const defaultOutput = captureMode
  ? path.resolve(root, "tmp-debug", `exact-commit-capture-${commit.slice(0, 12)}.json`)
  : path.resolve(
      root,
      "docs/release-evidence",
      releaseId,
      "BLD-01",
      "exact-commit-rebuild.json",
    );
const outputPath = path.resolve(
  outputIndex === -1 ? defaultOutput : (args[outputIndex + 1] ?? ""),
);
if (!isInside(outputPath, root)) throw new Error("Receipt output must stay inside the workspace");
const logPath = outputPath.replace(/\.json$/u, ".log");
if (logPath === outputPath) throw new Error("Receipt output must end in .json");

await prepareFreshWorkspaceOutput(root, outputPath, "Receipt output");
await prepareFreshWorkspaceOutput(root, logPath, "Rebuild log output");

const log = [];
const startedAt = new Date().toISOString();
const temporaryBase = await mkdtemp(path.join(tmpdir(), "foldwink-rebuild-"));
const temporaryCheckout = path.join(temporaryBase, "checkout");
let worktreeAdded = false;
let cleanupSucceeded = false;
let failure = null;
let rebuilt = null;
let source = null;

try {
  await runText("git", ["cat-file", "-e", `${commit}^{commit}`], root, log);
  await run("git", ["worktree", "add", "--detach", temporaryCheckout, commit], root, log);
  worktreeAdded = true;

  const preBuildStatus = await runText(
    "git",
    ["status", "--porcelain=v1", "--untracked-files=all"],
    temporaryCheckout,
    log,
  );
  if (preBuildStatus !== "") throw new Error("Detached exact-commit worktree is not clean");

  const packageJson = JSON.parse(
    await readFile(path.join(temporaryCheckout, "package.json"), "utf8"),
  );
  const lockBytes = await readFile(path.join(temporaryCheckout, "package-lock.json"));
  const npmVersion = await runText(process.execPath, [npmCli, "--version"], root, log);

  await run(process.execPath, [npmCli, "ci", "--no-audit", "--no-fund"], temporaryCheckout, log);
  await run(process.execPath, [npmCli, "run", "build"], temporaryCheckout, log);

  const postBuildStatus = await runText(
    "git",
    ["status", "--porcelain=v1", "--untracked-files=all"],
    temporaryCheckout,
    log,
  );
  if (postBuildStatus !== "") {
    throw new Error(`Exact-commit build modified tracked/unignored source:\n${postBuildStatus}`);
  }
  source = {
    preBuildClean: true,
    preBuildStatusSha256: sha256(preBuildStatus),
    postBuildClean: true,
    postBuildStatusSha256: sha256(postBuildStatus),
  };

  const dist = await snapshotTree(path.join(temporaryCheckout, "dist"));
  const exportDirectory = path.join(temporaryCheckout, "itch.io", "export");
  const beforeArchives = new Set(
    await readdir(exportDirectory).catch(() => []),
  );
  await run(process.execPath, ["scripts/pack-itch.mjs"], temporaryCheckout, log);
  const afterArchives = await readdir(exportDirectory);
  const newArchives = afterArchives.filter(
    (name) => name.endsWith(".zip") && !beforeArchives.has(name),
  );
  if (newArchives.length !== 1) {
    throw new Error(`Expected one deterministic ZIP, found ${newArchives.length}`);
  }
  const archivePath = path.join(exportDirectory, newArchives[0]);
  const archiveBytes = await readFile(archivePath);
  const archiveStat = await stat(archivePath);

  rebuilt = {
    appVersion: packageJson.version,
    lockSha256: sha256(lockBytes),
    dist,
    artifact: {
      name: newArchives[0],
      bytes: archiveStat.size,
      sha256: sha256(archiveBytes),
    },
    environment: {
      platform: process.platform,
      arch: process.arch,
      node: process.version,
      npm: npmVersion,
      declaredNode: packageJson.engines?.node ?? null,
      declaredNpm: packageJson.engines?.npm ?? null,
      packageManager: packageJson.packageManager ?? null,
    },
  };

  if (expected) {
    const mismatches = compareEntries(expected.distEntries, dist.entries);
    if (rebuilt.appVersion !== expected.appVersion) {
      throw new Error(`App version mismatch: ${rebuilt.appVersion} != ${expected.appVersion}`);
    }
    if (rebuilt.lockSha256 !== expected.lockSha256) {
      throw new Error("Exact-commit package-lock SHA-256 differs from candidate");
    }
    if (dist.treeSha256 !== expected.distTreeSha256 || mismatches.length > 0) {
      throw new Error(
        `Rebuilt dist differs from candidate (${mismatches.length} entry mismatch(es)): ${JSON.stringify(mismatches.slice(0, 20))}`,
      );
    }
    if (rebuilt.artifact.sha256 !== expected.artifactSha256) {
      throw new Error(
        `Rebuilt deterministic ZIP differs from candidate: ${rebuilt.artifact.sha256} != ${expected.artifactSha256}`,
      );
    }
  }
} catch (error) {
  failure = error;
} finally {
  try {
    if (worktreeAdded) {
      await run("git", ["worktree", "remove", "--force", temporaryCheckout], root, log);
      await run("git", ["worktree", "prune"], root, log);
    }
    const resolvedTempRoot = await realpath(tmpdir());
    const resolvedTemporaryBase = await realpath(temporaryBase);
    if (!isInside(resolvedTemporaryBase, resolvedTempRoot)) {
      const unsafeCleanup = new Error("Refusing to remove an unexpected rebuild directory");
      failure ??= unsafeCleanup;
      log.push(`\nCleanup failure: ${unsafeCleanup.message}\n`);
    } else {
      await rm(resolvedTemporaryBase, { recursive: true, force: true });
      cleanupSucceeded = true;
    }
  } catch (cleanupError) {
    failure ??= cleanupError;
    log.push(`\nCleanup failure: ${cleanupError.message}\n`);
  }
}

const finishedAt = new Date().toISOString();
const logPayload = log.join("");
const receipt = {
  schema: "foldwink-exact-commit-rebuild-v1",
  outcome: failure ? "fail" : captureMode ? "capture-only" : "pass",
  releaseId,
  candidate: {
    commit,
    branch,
    record: recordPath ? toPosix(path.relative(root, recordPath)) : null,
    artifactManifest: manifestPath ? toPosix(path.relative(root, manifestPath)) : null,
  },
  startedAt,
  finishedAt,
  commands: ["npm ci --no-audit --no-fund", "npm run build", "node scripts/pack-itch.mjs"],
  expected: expected
    ? {
        appVersion: expected.appVersion,
        lockSha256: expected.lockSha256,
        distTreeSha256: expected.distTreeSha256,
        artifactSha256: expected.artifactSha256,
      }
    : null,
  rebuilt,
  source,
  exactMatch: expected && !failure ? true : captureMode ? null : false,
  temporaryWorktreeRemoved: cleanupSucceeded,
  log: {
    path: toPosix(path.relative(root, logPath)),
    sha256: sha256(logPayload),
  },
  error: failure ? failure.message : null,
};

await writeFile(logPath, logPayload, { encoding: "utf8", flag: "wx" });
await writeFile(outputPath, `${JSON.stringify(receipt, null, 2)}\n`, {
  encoding: "utf8",
  flag: "wx",
});

if (failure) {
  console.error(`Exact-commit rebuild: FAIL — ${failure.message}`);
  console.error(`Receipt: ${outputPath}`);
  process.exit(1);
}

console.log(captureMode ? "Exact-commit rebuild: CAPTURE ONLY" : "Exact-commit rebuild: PASS");
console.log(`- commit: ${commit}`);
console.log(`- dist tree: ${rebuilt.dist.treeSha256}`);
console.log(`- artifact: ${rebuilt.artifact.sha256}`);
console.log(`- receipt: ${outputPath}`);
