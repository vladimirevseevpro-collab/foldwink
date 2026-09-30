#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const channel = process.argv[2] ?? "pilot-2026-09";
const manifestPath = path.resolve(
  process.argv[3] ?? "docs/reports/assets/FOLDWINK_W7_PILOT_BUILD_CANDIDATE.manifest.json",
);
const outputPath = path.resolve(
  process.argv[4] ?? "docs/reports/assets/FOLDWINK_W7_ITCH_CHANNEL_VERIFICATION.json",
);
const targetFile = path.join(root, ".itch-target");
const project = process.env.ITCH_TARGET ?? (existsSync(targetFile) ? (await readFile(targetFile, "utf8")).trim() : "");
const target = `${project}:${channel}`;

if (!/^[a-z0-9._-]+\/[a-z0-9._-]+:[a-z0-9][a-z0-9._-]{0,63}$/iu.test(target)) {
  throw new Error("Expected a safe itch target in user/game:channel form");
}

const butlerCandidates = [
  path.join(root, "itch.io", "tools", "butler", "butler.exe"),
  path.join(root, "itch.io", "tools", "butler", "butler"),
];
const butler = butlerCandidates.find(existsSync) ?? "butler";
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const fetchDir = await mkdtemp(path.join(tmpdir(), "foldwink-butler-verify-"));
const resolvedTemp = path.resolve(tmpdir());
const resolvedFetch = path.resolve(fetchDir);
if (!resolvedFetch.startsWith(`${resolvedTemp}${path.sep}`)) {
  throw new Error(`Refusing to use non-temporary fetch path: ${resolvedFetch}`);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(fullPath)));
    else if (entry.isFile()) files.push(fullPath);
  }
  return files;
}

try {
  const fetched = spawnSync(butler, ["fetch", target, fetchDir], {
    cwd: root,
    encoding: "utf8",
    shell: false,
  });
  if (fetched.status !== 0) {
    throw new Error(`butler fetch failed: ${fetched.error?.message ?? fetched.stderr}`);
  }

  const diskFiles = (await walk(fetchDir)).sort();
  const files = await Promise.all(
    diskFiles.map(async (file) => {
      const bytes = await readFile(file);
      return {
        path: path.relative(fetchDir, file).split(path.sep).join("/"),
        bytes: bytes.length,
        sha256: sha256(bytes),
      };
    }),
  );
  const treeMaterial = files.map((file) => `${file.sha256}  ${file.path}\n`).join("");
  const actual = {
    files: files.length,
    bytes: files.reduce((sum, file) => sum + file.bytes, 0),
    treeSha256: sha256(treeMaterial),
  };
  const expected = {
    files: manifest.dist.files,
    bytes: manifest.dist.bytes,
    treeSha256: manifest.dist.treeSha256,
  };
  const matches =
    actual.files === expected.files &&
    actual.bytes === expected.bytes &&
    actual.treeSha256 === expected.treeSha256;
  const result = {
    schema: "foldwink-butler-channel-verification-v1",
    verifiedAt: new Date().toISOString(),
    target,
    sourceArtifactSha256: manifest.artifact.sha256,
    expected,
    actual,
    matches,
  };

  await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
  console.log(`Wrote ${outputPath}`);
  console.log(`channel tree sha256 ${actual.treeSha256}`);
  console.log(`channel matches frozen dist: ${matches}`);
  if (!matches) process.exitCode = 1;
} finally {
  await rm(resolvedFetch, { recursive: true, force: true });
}
