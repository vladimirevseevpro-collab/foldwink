/**
 * Shared identity helpers for frozen web pilots.
 *
 * A pilot is an immutable copy of one clean build, committed under
 * `pilot/<version>/` with its manifest at `pilot/<version>.manifest.json`.
 * The Pages deploy serves it at `<site>/pilot/<version>/` beside the moving
 * main app, so a research cohort keeps one exact build while main moves on.
 */
import { createHash } from "node:crypto";
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

export const PILOT_ROOT = "pilot";
export const PILOT_SITE_URL = "https://vladimirevseevpro-collab.github.io/foldwink/";
export const WEB_PILOT_SCHEMA = "foldwink-web-pilot-manifest-v1";

export const sha256 = (value) => createHash("sha256").update(value).digest("hex");

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(fullPath)));
    else if (entry.isFile()) files.push(fullPath);
    else throw new Error(`${fullPath}: pilot trees may contain regular files only`);
  }
  return files;
}

/** Same tree hash as the W7/W8 manifests: sorted `<sha256>  <path>\n` lines. */
export function treeHash(entries) {
  return sha256(entries.map((entry) => `${entry.sha256}  ${entry.path}\n`).join(""));
}

export async function snapshotTree(directory) {
  const entries = await Promise.all(
    (await walk(directory)).sort().map(async (file) => ({
      path: path.relative(directory, file).split(path.sep).join("/"),
      bytes: (await stat(file)).size,
      sha256: sha256(await readFile(file)),
    })),
  );
  entries.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  return {
    files: entries.length,
    bytes: entries.reduce((sum, entry) => sum + entry.bytes, 0),
    treeSha256: treeHash(entries),
    entries,
  };
}

/** Exact-match a tree snapshot against a manifest; returns human-readable failures. */
export function compareTree(manifestTree, actual) {
  const failures = [];
  const expected = new Map(manifestTree.entries.map((entry) => [entry.path, entry]));
  const seen = new Set();
  for (const entry of actual.entries) {
    seen.add(entry.path);
    const want = expected.get(entry.path);
    if (!want) failures.push(`unexpected file ${entry.path}`);
    else if (want.sha256 !== entry.sha256 || want.bytes !== entry.bytes)
      failures.push(`content differs for ${entry.path}`);
  }
  for (const entry of manifestTree.entries)
    if (!seen.has(entry.path)) failures.push(`missing file ${entry.path}`);
  if (treeHash(manifestTree.entries) !== manifestTree.treeSha256)
    failures.push("manifest entries do not hash to the manifest tree SHA-256");
  if (actual.treeSha256 !== manifestTree.treeSha256) failures.push("tree SHA-256 differs");
  return failures;
}

function compareVersions(a, b) {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i += 1) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

/** All frozen pilot manifests, oldest version first. */
export async function listPilotManifests(root = process.cwd()) {
  const directory = path.join(root, PILOT_ROOT);
  const names = await readdir(directory).catch((error) => {
    if (error.code === "ENOENT") return [];
    throw error;
  });
  return names
    .filter((name) => /^\d+\.\d+\.\d+\.manifest\.json$/u.test(name))
    .map((name) => name.slice(0, -".manifest.json".length))
    .sort(compareVersions)
    .map((version) => path.join(directory, `${version}.manifest.json`));
}

/** The pilot the W7 operator tooling is pinned to: the newest frozen one. */
export async function currentPilotManifestPath(root = process.cwd()) {
  const manifests = await listPilotManifests(root);
  if (manifests.length === 0) throw new Error(`no frozen pilot under ${PILOT_ROOT}/`);
  return manifests.at(-1);
}

export const evidenceToken = (version) => version.replace(/\D/gu, "");
