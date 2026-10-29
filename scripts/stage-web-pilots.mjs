#!/usr/bin/env node
/**
 * Copy every frozen web pilot into a built site before the Pages upload.
 *
 * Usage: node scripts/stage-web-pilots.mjs <siteDir>
 *
 * Each `pilot/<version>/` tree must still match its manifest byte for byte;
 * a drifted tree fails the deploy instead of silently changing a cohort's build.
 */
import { existsSync } from "node:fs";
import { cp, readFile } from "node:fs/promises";
import path from "node:path";

import { compareTree, listPilotManifests, snapshotTree } from "./lib/web-pilot.mjs";

const root = process.cwd();
const siteDir = path.resolve(process.argv[2] ?? "dist");
if (!existsSync(path.join(siteDir, "index.html"))) {
  throw new Error(`${siteDir} has no index.html - build the site first`);
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
