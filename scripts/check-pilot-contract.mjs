#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const manifestPath = path.resolve(
  process.env.FOLDWINK_PILOT_MANIFEST ??
    "docs/reports/assets/FOLDWINK_W7_PILOT_BUILD_CANDIDATE_V084.manifest.json",
);
const stagingPath = path.resolve(
  process.env.FOLDWINK_STAGING_EVIDENCE ??
    "docs/reports/assets/FOLDWINK_W7_ITCH_STAGING_VERIFICATION.json",
);
const pilotChannelPath = path.resolve(
  process.env.FOLDWINK_PILOT_CHANNEL_EVIDENCE ??
    "docs/reports/assets/FOLDWINK_W7_ITCH_CHANNEL_VERIFICATION_V084.json",
);
const downloadChannelPath = path.resolve(
  process.env.FOLDWINK_DOWNLOAD_CHANNEL_EVIDENCE ??
    "docs/reports/assets/FOLDWINK_W7_ITCH_DOWNLOAD_CHANNEL_VERIFICATION_V084.json",
);

const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};
const json = async (file) => JSON.parse(await readFile(file, "utf8"));
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(fullPath)));
    else if (entry.isFile()) files.push(fullPath);
  }
  return files;
}

function readQuoted(source, key) {
  const match = new RegExp(`${key}:\\s*["']([^"']+)["']`, "u").exec(source);
  return match?.[1];
}

const packageMetadata = await json(path.join(root, "package.json"));
const manifest = await json(manifestPath);
const staging = await json(stagingPath);
const pilotChannel = await json(pilotChannelPath);
const downloadChannel = await json(downloadChannelPath);
const observationTemplate = await json(
  path.join(root, "docs/research/templates/foldwink-w7-observation.example.json"),
);
const appVersionSource = await readFile(path.join(root, "src/appVersion.ts"), "utf8");
const eventSource = await readFile(path.join(root, "src/analytics/eventLog.ts"), "utf8");
const formSource = await readFile(
  path.join(root, "docs/research/FOLDWINK_W7_OPERATOR_FORM.html"),
  "utf8",
);
const observationSource = await readFile(
  path.join(root, "scripts/summarize-pilot-observations.mjs"),
  "utf8",
);

check(
  /packageMetadata\.version/u.test(appVersionSource),
  "src/appVersion.ts must derive the runtime version from package.json",
);
check(
  /ANALYTICS_APP_VERSION\s*=\s*APP_VERSION/u.test(eventSource),
  "analytics/research app version must use APP_VERSION",
);
check(
  manifest.versions?.app === packageMetadata.version,
  "manifest app version differs from package",
);

const artifactPath = path.resolve(root, manifest.artifact?.path ?? "");
const artifactBytes = await readFile(artifactPath);
check(
  artifactBytes.length === manifest.artifact?.bytes,
  "artifact byte count differs from manifest",
);
check(
  sha256(artifactBytes) === manifest.artifact?.sha256,
  "artifact SHA-256 differs from manifest",
);

const distDir = path.join(root, "dist");
const distFiles = (await walk(distDir)).sort();
const distEntries = await Promise.all(
  distFiles.map(async (file) => {
    const bytes = await readFile(file);
    return {
      path: path.relative(distDir, file).split(path.sep).join("/"),
      bytes: (await stat(file)).size,
      sha256: sha256(bytes),
    };
  }),
);
const treeHash = sha256(
  distEntries.map((entry) => `${entry.sha256}  ${entry.path}\n`).join(""),
);
check(distEntries.length === manifest.dist?.files, "dist file count differs from manifest");
check(
  distEntries.reduce((sum, entry) => sum + entry.bytes, 0) === manifest.dist?.bytes,
  "dist byte count differs from manifest",
);
check(treeHash === manifest.dist?.treeSha256, "dist tree SHA-256 differs from manifest");

const expectedArtifact = {
  version: manifest.versions.app,
  zipSha256: manifest.artifact.sha256,
  treeSha256: manifest.dist.treeSha256,
  files: manifest.dist.files,
  bytes: manifest.dist.bytes,
};
check(
  JSON.stringify(staging.artifact) === JSON.stringify(expectedArtifact),
  "staging artifact identity differs from manifest",
);
check(
  staging.playableUrl?.includes(`${staging.itch?.uploadId}-${staging.itch?.buildId}`),
  "staging playable URL does not contain its upload/build identity",
);

const profiles = new Set(
  (staging.results ?? []).map((result) => `${result.language}:${result.viewport}`),
);
for (const required of ["en:1440x900@100%", "de:1024x768@100%", "ru:390x844@100%"])
  check(profiles.has(required), `staging result missing ${required}`);
for (const result of staging.results ?? []) {
  check(result.publicStatus === 200, `${result.language} public status is not 200`);
  check(result.playableStatus === 200, `${result.language} playable status is not 200`);
  check(result.consoleErrors === 0, `${result.language} staging has console errors`);
  check(
    result.researchExportVersion === packageMetadata.version,
    `${result.language} live export version differs from package`,
  );
}

for (const [label, evidence] of [
  ["pilot", pilotChannel],
  ["download", downloadChannel],
]) {
  check(evidence.matches === true, `${label} channel verification is not a match`);
  check(
    evidence.sourceArtifactSha256 === manifest.artifact.sha256,
    `${label} channel artifact SHA-256 differs from manifest`,
  );
  check(
    evidence.actual?.treeSha256 === manifest.dist.treeSha256,
    `${label} channel tree SHA-256 differs from manifest`,
  );
  check(evidence.actual?.files === manifest.dist.files, `${label} channel file count differs`);
  check(evidence.actual?.bytes === manifest.dist.bytes, `${label} channel byte count differs`);
}

const formBuild = {
  app: readQuoted(formSource, "app"),
  content: readQuoted(formSource, "content"),
  daily: readQuoted(formSource, "daily"),
  events: readQuoted(formSource, "events"),
  privacy: readQuoted(formSource, "privacy"),
  balance: readQuoted(formSource, "balance"),
  itchUpload: readQuoted(formSource, "itchUpload"),
  itchBuild: readQuoted(formSource, "itchBuild"),
  artifactSha256: readQuoted(formSource, "artifactSha256"),
  treeSha256: readQuoted(formSource, "treeSha256"),
};
const expectedBuild = {
  app: manifest.versions.app,
  content: manifest.versions.content,
  daily: manifest.versions.dailySchedule,
  events: manifest.versions.eventSchema,
  privacy: manifest.versions.privacyPolicy,
  balance: manifest.versions.balancePolicy,
  itchUpload: `#${staging.itch.uploadId}`,
  itchBuild: `#${staging.itch.buildId}`,
  artifactSha256: manifest.artifact.sha256,
  treeSha256: manifest.dist.treeSha256,
};
check(
  JSON.stringify(formBuild) === JSON.stringify(expectedBuild),
  "operator form build tuple differs from frozen evidence",
);
check(
  JSON.stringify(observationTemplate.build) === JSON.stringify(expectedBuild),
  "observation template build tuple differs from frozen evidence",
);
check(
  /app:\s*packageMetadata\.version/u.test(observationSource),
  "observation validator app version must derive from package.json",
);
for (const key of [
  "content",
  "daily",
  "events",
  "privacy",
  "balance",
  "itchUpload",
  "itchBuild",
  "artifactSha256",
  "treeSha256",
]) {
  check(
    readQuoted(observationSource, key) === expectedBuild[key],
    `observation validator ${key} differs from frozen evidence`,
  );
}

if (failures.length > 0) {
  console.error("Foldwink pilot identity contract: FAIL");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Foldwink pilot identity contract: PASS");
console.log(`- app: ${packageMetadata.version}`);
console.log(`- playable build: #${staging.itch.buildId}`);
console.log(`- artifact: ${manifest.artifact.sha256}`);
console.log(`- dist tree: ${manifest.dist.treeSha256}`);
console.log("- EN/DE/RU live export versions and both fetched channels match");
