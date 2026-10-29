#!/usr/bin/env node
/**
 * W7 pilot identity contract: the frozen web pilot tree, its live deploy and
 * browser evidence, and the operator tooling must all name the same build.
 *
 * The pilot is pinned by its own manifest (`pilot/<version>.manifest.json`),
 * not by `dist/` or package.json, so main may move on while a cohort runs.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";

import {
  WEB_PILOT_SCHEMA,
  compareTree,
  currentPilotManifestPath,
  evidenceToken,
  snapshotTree,
} from "./lib/web-pilot.mjs";

const root = process.cwd();
const manifestPath = path.resolve(
  process.env.FOLDWINK_PILOT_MANIFEST ?? (await currentPilotManifestPath(root)),
);

const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};
const json = async (file) => JSON.parse(await readFile(file, "utf8"));

// Read only the active `const BUILD = {...}` tuple, so a comment or another
// object elsewhere in the file can never satisfy the contract.
function readBuild(source, label) {
  const block = /const BUILD = (?:Object\.freeze\()?\{([^}]*)\}/u.exec(source)?.[1];
  if (block === undefined) {
    failures.push(`${label} has no BUILD tuple`);
    return {};
  }
  return Object.fromEntries(
    [...block.matchAll(/^\s*(\w+):\s*"([^"]*)",?\s*$/gmu)].map((match) => [match[1], match[2]]),
  );
}

const manifest = await json(manifestPath);
const token = evidenceToken(manifest.version);
const stagingPath = path.resolve(
  process.env.FOLDWINK_STAGING_EVIDENCE ??
    `docs/reports/assets/FOLDWINK_W7_WEB_PILOT_STAGING_V${token}.json`,
);
const deployPath = path.resolve(
  process.env.FOLDWINK_DEPLOY_EVIDENCE ??
    `docs/reports/assets/FOLDWINK_W7_WEB_PILOT_DEPLOY_V${token}.json`,
);
const staging = await json(stagingPath);
const deploy = await json(deployPath);
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

check(manifest.schema === WEB_PILOT_SCHEMA, `manifest schema is not ${WEB_PILOT_SCHEMA}`);
check(manifest.versions?.app === manifest.version, "manifest app version differs from its pilot");
check(manifest.source?.clean === true, "pilot was not frozen from a clean commit");
check(
  /packageMetadata\.version/u.test(appVersionSource),
  "src/appVersion.ts must derive the runtime version from package.json",
);
check(
  /ANALYTICS_APP_VERSION\s*=\s*APP_VERSION/u.test(eventSource),
  "analytics/research app version must use APP_VERSION",
);

for (const failure of compareTree(manifest.tree, await snapshotTree(path.join(root, manifest.path))))
  check(false, `committed pilot tree: ${failure}`);

const expectedArtifact = {
  version: manifest.version,
  treeSha256: manifest.tree.treeSha256,
  files: manifest.tree.files,
  bytes: manifest.tree.bytes,
};
check(
  JSON.stringify(staging.artifact) === JSON.stringify(expectedArtifact),
  "staging artifact identity differs from manifest",
);
check(staging.playableUrl === manifest.url, "staging playable URL differs from manifest");

const profiles = new Set(
  (staging.results ?? []).map((result) => `${result.language}:${result.viewport}`),
);
for (const required of ["en:1440x900@100%", "de:1024x768@100%", "ru:390x844@100%"])
  check(profiles.has(required), `staging result missing ${required}`);
for (const result of staging.results ?? []) {
  check(result.publicStatus === 200, `${result.language} main app status is not 200`);
  check(result.playableStatus === 200, `${result.language} pilot status is not 200`);
  check(result.consoleErrors === 0, `${result.language} staging has console errors`);
  check(
    result.serviceWorkerScope === manifest.url,
    `${result.language} pilot is not controlled by its own service worker scope`,
  );
  check(
    result.researchExportVersion === manifest.versions.app,
    `${result.language} live export version differs from manifest`,
  );
}

check(deploy.matches === true, "deployed pilot verification is not a match");
check(deploy.url === manifest.url, "deployed pilot URL differs from manifest");
check(deploy.actual?.treeSha256 === manifest.tree.treeSha256, "deployed tree SHA-256 differs");
check(deploy.actual?.files === manifest.tree.files, "deployed file count differs");
check(deploy.actual?.bytes === manifest.tree.bytes, "deployed byte count differs");

const expectedBuild = {
  app: manifest.versions.app,
  content: manifest.versions.content,
  daily: manifest.versions.dailySchedules.join("+"),
  events: manifest.versions.eventSchema,
  privacy: manifest.versions.privacyPolicy,
  balance: manifest.versions.balancePolicy,
  channel: manifest.channel,
  treeSha256: manifest.tree.treeSha256,
};
for (const [label, build] of [
  ["operator form", readBuild(formSource, "operator form")],
  ["observation template", observationTemplate.build],
  ["observation validator", readBuild(observationSource, "observation validator")],
]) {
  check(
    JSON.stringify(build) === JSON.stringify(expectedBuild),
    `${label} build tuple differs from frozen evidence`,
  );
}

if (failures.length > 0) {
  console.error("Foldwink pilot identity contract: FAIL");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Foldwink pilot identity contract: PASS");
console.log(`- pilot: ${manifest.version} from ${manifest.source.commit}`);
console.log(`- served at: ${manifest.url}`);
console.log(`- tree: ${manifest.tree.treeSha256}`);
console.log("- committed tree, live deploy, EN/DE/RU browser runs and operator tooling agree");
