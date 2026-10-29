#!/usr/bin/env node
/**
 * Fetch a deployed web pilot file by file and prove it matches its manifest.
 *
 * Usage: npm run pilot:verify-deploy [-- <manifest.json>]
 * Writes docs/reports/assets/FOLDWINK_W7_WEB_PILOT_DEPLOY_V<token>.json and
 * exits non-zero on any mismatch. FOLDWINK_PILOT_URL overrides the served URL.
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { URL } from "node:url";

import {
  compareTree,
  currentPilotManifestPath,
  evidenceToken,
  sha256,
  treeHash,
} from "./lib/web-pilot.mjs";

const manifestPath = path.resolve(process.argv[2] ?? (await currentPilotManifestPath()));
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const url = process.env.FOLDWINK_PILOT_URL ?? manifest.url;
const output = path.resolve(
  `docs/reports/assets/FOLDWINK_W7_WEB_PILOT_DEPLOY_V${evidenceToken(manifest.version)}.json`,
);

// Pages' CDN can answer 5xx for a few seconds right after a deploy; retry
// those and network errors, never a 4xx or a wrong body.
async function fetchWithRetry(target) {
  for (let attempt = 1; ; attempt += 1) {
    try {
      const response = await fetch(target, { cache: "no-store" });
      if (response.status < 500 || attempt === 4) return response;
    } catch (error) {
      if (attempt === 4) throw error;
    }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 2_000 * 2 ** (attempt - 1)));
  }
}

const entries = [];
const fetchFailures = [];
for (const entry of manifest.tree.entries) {
  const response = await fetchWithRetry(new URL(entry.path, url));
  if (!response.ok) {
    fetchFailures.push(`${entry.path} returned ${response.status}`);
    continue;
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  entries.push({ path: entry.path, bytes: bytes.length, sha256: sha256(bytes) });
}
const actual = {
  files: entries.length,
  bytes: entries.reduce((sum, entry) => sum + entry.bytes, 0),
  treeSha256: treeHash(entries),
  entries,
};
const mismatches = [...fetchFailures, ...compareTree(manifest.tree, actual)];

const record = {
  schema: "foldwink-web-pilot-deploy-verification-v1",
  verifiedAt: new Date().toISOString(),
  url,
  version: manifest.version,
  channel: manifest.channel,
  expected: {
    files: manifest.tree.files,
    bytes: manifest.tree.bytes,
    treeSha256: manifest.tree.treeSha256,
  },
  actual: { files: actual.files, bytes: actual.bytes, treeSha256: actual.treeSha256 },
  mismatches,
  matches: mismatches.length === 0,
};
await writeFile(output, `${JSON.stringify(record, null, 2)}\n`, "utf8");

if (!record.matches) {
  console.error(`Web pilot ${manifest.version} at ${url}: MISMATCH`);
  for (const mismatch of mismatches.slice(0, 20)) console.error(`- ${mismatch}`);
  process.exit(1);
}
console.log(`Web pilot ${manifest.version} at ${url}: all ${actual.files} files match`);
console.log(`- tree ${actual.treeSha256}; evidence ${path.relative(process.cwd(), output)}`);
