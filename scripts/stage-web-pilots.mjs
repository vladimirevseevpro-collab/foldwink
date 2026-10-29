#!/usr/bin/env node
/**
 * Copy every frozen web pilot into a built site before the Pages upload.
 *
 * Usage: node scripts/stage-web-pilots.mjs <siteDir>
 *
 * A published pilot URL must keep serving the same bytes for its whole cohort:
 * - each `pilot/<version>/` tree must match its manifest byte for byte;
 * - once committed, a pilot's tree and manifest may never change or disappear
 *   (git history is the reference, so CI must check out full history).
 * A changed build needs a new version and therefore a new path.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { cp, readFile } from "node:fs/promises";
import path from "node:path";

import { PILOT_ROOT, compareTree, listPilotManifests, snapshotTree } from "./lib/web-pilot.mjs";

const root = process.cwd();
const siteDir = path.resolve(process.argv[2] ?? "dist");
if (!existsSync(path.join(siteDir, "index.html"))) {
  throw new Error(`${siteDir} has no index.html - build the site first`);
}

function git(args) {
  const result = spawnSync("git", args, { cwd: root, encoding: "utf8", shell: false });
  if (result.status !== 0) throw new Error(`git ${args.join(" ")} failed: ${result.stderr}`);
  return result.stdout.trim();
}

// A shallow clone grafts its oldest commit as a root that "adds" every file,
// which would make any rewritten pilot look freshly published.
if (git(["rev-parse", "--is-shallow-repository"]) !== "false") {
  throw new Error("pilot immutability needs full git history (checkout with fetch-depth: 0)");
}
const published = [
  ...new Set(
    git(["log", "--diff-filter=A", "--format=", "--name-only", "--", `${PILOT_ROOT}/*.manifest.json`])
      .split(/\r?\n/u)
      .filter((file) => /^pilot\/\d+\.\d+\.\d+\.manifest\.json$/u.test(file)),
  ),
];
for (const manifestFile of published) {
  if (!existsSync(path.join(root, manifestFile))) {
    throw new Error(`published pilot ${manifestFile} was deleted; its cohort URL would break`);
  }
  const firstAdded = git(["log", "--diff-filter=A", "--reverse", "--format=%H", "--", manifestFile])
    .split(/\r?\n/u)[0];
  const treeDir = `${manifestFile.slice(0, -".manifest.json".length)}/`;
  const changed = git(["diff", "--name-only", firstAdded, "HEAD", "--", manifestFile, treeDir]);
  if (changed !== "") {
    throw new Error(`published pilot changed after ${firstAdded.slice(0, 12)}:\n${changed}`);
  }
}

const manifests = await listPilotManifests(root);
for (const manifestPath of manifests) {
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const source = path.join(root, manifest.path);
  const failures = compareTree(manifest.tree, await snapshotTree(source));
  if (failures.length > 0) {
    throw new Error(`pilot ${manifest.version} drifted from its manifest:\n- ${failures.join("\n- ")}`);
  }
  const target = path.join(siteDir, manifest.publicPath);
  if (existsSync(target)) throw new Error(`${target} already exists in the built site`);
  await cp(source, target, { recursive: true, errorOnExist: true, force: false });
  console.log(`Staged pilot ${manifest.version} at ${manifest.publicPath} (${manifest.tree.treeSha256})`);
}
if (manifests.length === 0) console.log("No frozen pilots to stage.");
