import { createHash } from "node:crypto";
import { readFile, readdir, stat, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";

const root = process.cwd();
const distDir = path.join(root, "dist");
const packageJson = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
const releaseDate = new Date().toISOString().slice(0, 10);
const versionToken = packageJson.version.replace(/\D/gu, "");
const artifact = path.resolve(
  process.argv[2] ??
    `itch.io/export/foldwink-itch-upload-v${packageJson.version}-${releaseDate}.zip`,
);
const output = path.resolve(
  process.argv[3] ??
    `docs/reports/assets/FOLDWINK_W7_PILOT_BUILD_CANDIDATE_V${versionToken}.manifest.json`,
);

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(fullPath)));
    else if (entry.isFile()) files.push(fullPath);
  }
  return files;
}

function sha256Buffer(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function sha256File(file) {
  return sha256Buffer(await readFile(file));
}

function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, encoding: "utf8", shell: false });
  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(" ")} failed: ${result.error?.message ?? result.stderr}`,
    );
  }
  return result.stdout.trim();
}

function runBuffer(command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: null,
    shell: false,
    maxBuffer: 64 * 1024 * 1024,
  });
  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(" ")} failed: ${result.error?.message ?? String(result.stderr)}`,
    );
  }
  return result.stdout;
}

function extract(source, pattern, label) {
  const match = pattern.exec(source);
  if (!match) throw new Error(`Could not resolve ${label}`);
  return match[1];
}

const runtimeManifest = JSON.parse(
  await readFile(path.join(root, "public/runtime-content/v1/manifest.en.json"), "utf8"),
);
const dailyManifest = JSON.parse(
  await readFile(path.join(root, "puzzles/manifests/daily.en.2026-09-14.json"), "utf8"),
);
const eventSource = await readFile(path.join(root, "src/analytics/eventLog.ts"), "utf8");
const balanceSource = await readFile(path.join(root, "src/game/config/balance.ts"), "utf8");

const distFiles = (await walk(distDir)).sort();
const files = await Promise.all(
  distFiles.map(async (file) => ({
    path: path.relative(distDir, file).split(path.sep).join("/"),
    bytes: (await stat(file)).size,
    sha256: await sha256File(file),
  })),
);
const treeMaterial = files.map((file) => `${file.sha256}  ${file.path}\n`).join("");
const artifactInfo = await stat(artifact);
const artifactSignature = (await readFile(artifact)).subarray(0, 4).toString("hex");
if (path.extname(artifact).toLowerCase() !== ".zip") throw new Error("Artifact must be a .zip file");
if (!["504b0304", "504b0506", "504b0708"].includes(artifactSignature)) {
  throw new Error("Artifact does not have a ZIP signature");
}
const zipPaths = run("tar", ["-tf", artifact]).split(/\r?\n/u).filter(Boolean);
const zipDetails = run("tar", ["-tvf", artifact]).split(/\r?\n/u).filter(Boolean);
if (zipDetails.length !== zipPaths.length || zipDetails.some((entry) => !entry.startsWith("-"))) {
  throw new Error("ZIP must contain regular files only");
}
const unsafePaths = zipPaths.filter(
  (entry) =>
    entry.startsWith("/") ||
    /^[a-zA-Z]:/u.test(entry) ||
    entry.includes("\\") ||
    entry.split("/").includes("..") ||
    entry.endsWith("/"),
);
if (unsafePaths.length > 0) throw new Error(`Unsafe ZIP paths: ${unsafePaths.join(", ")}`);
if (new Set(zipPaths).size !== zipPaths.length) throw new Error("ZIP contains duplicate paths");
if (!zipPaths.includes("index.html")) throw new Error("ZIP does not contain index.html");
const sortedZipPaths = [...zipPaths].sort();
const sortedDistPaths = files.map((file) => file.path);
if (JSON.stringify(sortedZipPaths) !== JSON.stringify(sortedDistPaths)) {
  const missing = sortedDistPaths.filter((entry) => !zipPaths.includes(entry));
  const extra = sortedZipPaths.filter((entry) => !sortedDistPaths.includes(entry));
  throw new Error(
    `ZIP/dist path mismatch; missing=[${missing.join(", ")}], extra=[${extra.join(", ")}]`,
  );
}
for (const file of files) {
  const archivedBytes = runBuffer("tar", ["-xOf", artifact, "--", file.path]);
  if (archivedBytes.length !== file.bytes) {
    throw new Error(`ZIP/dist byte mismatch for ${file.path}`);
  }
  if (sha256Buffer(archivedBytes) !== file.sha256) {
    throw new Error(`ZIP/dist SHA-256 mismatch for ${file.path}`);
  }
}

const gitStatus = run("git", ["status", "--porcelain=v1", "-z"]);
const npmVersion =
  /^npm\/([^\s]+)/u.exec(process.env.npm_config_user_agent ?? "")?.[1] ?? "unknown";
const manifest = {
  schema: "foldwink-pilot-artifact-manifest-v1",
  status: "local-candidate-not-participant-ready",
  artifact: {
    path: path.relative(root, artifact).split(path.sep).join("/"),
    bytes: artifactInfo.size,
    sha256: await sha256File(artifact),
    zipEntries: zipPaths.length,
    relativePathsOnly: true,
  },
  dist: {
    files: files.length,
    bytes: files.reduce((sum, file) => sum + file.bytes, 0),
    treeSha256: sha256Buffer(treeMaterial),
    entries: files,
  },
  source: {
    branch: run("git", ["branch", "--show-current"]),
    baseCommit: run("git", ["rev-parse", "HEAD"]),
    clean: gitStatus.length === 0,
    statusSha256: sha256Buffer(gitStatus),
    packageLockSha256: await sha256File(path.join(root, "package-lock.json")),
    packageLockAtCommitSha256: sha256Buffer(
      runBuffer("git", ["show", "HEAD:package-lock.json"]),
    ),
  },
  runtime: {
    node: process.version,
    npm: npmVersion,
  },
  versions: {
    app: packageJson.version,
    content: runtimeManifest.contentVersion,
    dailySchedule: dailyManifest.scheduleVersion,
    eventSchema: extract(
      eventSource,
      /ANALYTICS_EVENT_SCHEMA_VERSION\s*=\s*"([^"]+)"/u,
      "event schema",
    ),
    privacyPolicy: extract(
      eventSource,
      /ANALYTICS_POLICY_VERSION\s*=\s*"([^"]+)"/u,
      "privacy policy",
    ),
    balancePolicy: extract(balanceSource, /version:\s*"([^"]+)"/u, "balance policy"),
    languages: ["en", "ru", "de"],
  },
  staging: null,
  participantReady: false,
  missingExternalEvidence: [
    "reviewed source commit or accepted dirty-source limitation",
    "HTTPS staging URL and deployment time",
    "downloaded staging artifact hash match",
    "physical iOS/Android/external-browser smoke",
    "consented external roster and real participant sessions",
    "complete D1/D7 windows",
  ],
};

await writeFile(output, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(`Wrote ${output}`);
console.log(`artifact sha256 ${manifest.artifact.sha256}`);
console.log(`dist tree sha256 ${manifest.dist.treeSha256}`);
