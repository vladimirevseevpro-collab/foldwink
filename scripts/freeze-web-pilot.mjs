#!/usr/bin/env node
/**
 * Freeze the current clean build as an immutable web pilot.
 *
 * Run as `npm run pilot:freeze`, which builds first. Copies `dist/` to
 * `pilot/<version>/` and writes `pilot/<version>.manifest.json`. Refuses a
 * dirty worktree, so the manifest's commit alone reproduces the tree
 * (`npm run release:verify-rebuild -- --capture <commit>`).
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { cp, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { URL } from "node:url";

import {
  PILOT_ROOT,
  PILOT_SITE_URL,
  WEB_PILOT_SCHEMA,
  sha256,
  snapshotTree,
} from "./lib/web-pilot.mjs";

const root = process.cwd();
const packageJson = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
const version = packageJson.version;
const distDir = path.join(root, "dist");
const target = path.join(root, PILOT_ROOT, version);
const manifestPath = path.join(root, PILOT_ROOT, `${version}.manifest.json`);
const frozenOn = new Date().toISOString().slice(0, 10);

function git(args) {
  const result = spawnSync("git", args, { cwd: root, encoding: "utf8", shell: false });
  if (result.status !== 0) throw new Error(`git ${args.join(" ")} failed: ${result.stderr}`);
  return result.stdout.trim();
}

function extract(source, pattern, label) {
  const match = pattern.exec(source);
  if (!match) throw new Error(`Could not resolve ${label}`);
  return match[1];
}

if (existsSync(target) || existsSync(manifestPath)) {
  throw new Error(`pilot ${version} is already frozen; bump the version for a new pilot`);
}
if (!existsSync(path.join(distDir, "index.html"))) {
  throw new Error("dist/index.html is missing - run `npm run pilot:freeze`, which builds first");
}
// The build regenerates tracked runtime content and notices, so a clean tree
// here also proves the build did not drift from the commit.
const status = git(["status", "--porcelain=v1", "--untracked-files=all"]);
if (status !== "") throw new Error(`worktree must be clean to freeze a pilot:\n${status}`);

const eventSource = await readFile(path.join(root, "src/analytics/eventLog.ts"), "utf8");
const balanceSource = await readFile(path.join(root, "src/game/config/balance.ts"), "utf8");
const runtimeManifest = JSON.parse(
  await readFile(path.join(root, "public/runtime-content/v1/manifest.en.json"), "utf8"),
);

// The pilot keeps every published Daily schedule; the cohort only meets the
// ones still running on the freeze date, and none after the last one ends.
const schedules = [];
for (const file of (await readdir(path.join(root, "puzzles/manifests"))).sort()) {
  if (!/^daily\.en\..+\.json$/u.test(file)) continue;
  const manifest = JSON.parse(await readFile(path.join(root, "puzzles/manifests", file), "utf8"));
  const lastDate = manifest.entries.map((entry) => entry.date).sort().at(-1);
  schedules.push({ version: manifest.scheduleVersion, lastDate });
}
const dailyHorizonEnd = schedules.map((schedule) => schedule.lastDate).sort().at(-1);
const dailySchedules = schedules
  .filter((schedule) => schedule.lastDate >= frozenOn)
  .map((schedule) => schedule.version);
if (dailySchedules.length === 0) throw new Error(`no Daily schedule runs past ${frozenOn}`);

const tree = await snapshotTree(distDir);
const publicPath = `${PILOT_ROOT}/${version}/`;
const npmVersion =
  /^npm\/([^\s]+)/u.exec(process.env.npm_config_user_agent ?? "")?.[1] ?? "unknown";
const manifest = {
  schema: WEB_PILOT_SCHEMA,
  version,
  frozenOn,
  path: `${PILOT_ROOT}/${version}`,
  publicPath,
  url: new URL(publicPath, PILOT_SITE_URL).href,
  channel: `pages:pilot-${version}`,
  source: {
    branch: git(["branch", "--show-current"]),
    commit: git(["rev-parse", "HEAD"]),
    clean: true,
    packageLockSha256: sha256(await readFile(path.join(root, "package-lock.json"))),
  },
  runtime: { node: process.version, npm: npmVersion },
  versions: {
    app: version,
    content: runtimeManifest.contentVersion,
    dailySchedules,
    dailyHorizonEnd,
    eventSchema: extract(eventSource, /ANALYTICS_EVENT_SCHEMA_VERSION\s*=\s*"([^"]+)"/u, "event schema"),
    privacyPolicy: extract(eventSource, /ANALYTICS_POLICY_VERSION\s*=\s*"([^"]+)"/u, "privacy policy"),
    balancePolicy: extract(balanceSource, /version:\s*"([^"]+)"/u, "balance policy"),
    languages: ["en", "ru", "de"],
  },
  tree,
};

await cp(distDir, target, { recursive: true, errorOnExist: true, force: false });
const copied = await snapshotTree(target);
if (copied.treeSha256 !== tree.treeSha256) throw new Error("copied pilot tree differs from dist");
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

console.log(`Froze pilot ${version} from ${manifest.source.commit}`);
console.log(`- tree: ${tree.files} files, ${tree.bytes} bytes, ${tree.treeSha256}`);
console.log(`- Daily: ${dailySchedules.join(" + ")} (horizon ${dailyHorizonEnd})`);
console.log(`- serves at ${manifest.url} after the next Pages deploy`);
