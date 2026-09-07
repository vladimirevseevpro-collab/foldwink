#!/usr/bin/env node
/**
 * Foldwink — itch.io release via butler.
 *
 * Runs `pack:itch` to produce a fresh versioned zip in itch.io/export/,
 * then pushes it to the chosen itch channel via butler.
 *
 * Because butler keeps the channel URL stable across releases, returning
 * players' localStorage (stats, progress, daily history) survives updates.
 *
 * Usage:
 *   ITCH_TARGET=sunlike78/foldwink npm run release:butler
 *
 * Flags:
 *   --channel=<name>   Defaults to "html"
 *   --target=<u/game>  Overrides ITCH_TARGET / .itch-target
 *   --skip-pack        Skip rebuilding the zip (use latest existing)
 */
import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const version = pkg.version;

const localButlerCandidates = [
  join(root, "itch.io", "tools", "butler", "butler.exe"),
  join(root, "itch.io", "tools", "butler", "butler"),
];
const localButler = localButlerCandidates.find(existsSync) ?? null;
const butlerCmd = localButler ?? "butler";

const args = new Map(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    return m ? [m[1], m[2] ?? "true"] : [a, "true"];
  }),
);

const target =
  args.get("target") ??
  process.env.ITCH_TARGET ??
  (existsSync(join(root, ".itch-target"))
    ? readFileSync(join(root, ".itch-target"), "utf8").trim()
    : null);

if (!target || !/^[^/]+\/[^/]+$/.test(target)) {
  console.error(
    [
      "ITCH_TARGET is missing or malformed.",
      "",
      "Set it once, either:",
      '  • create `.itch-target` in repo root with "user/game" (gitignored)',
      '  • or set env var: setx ITCH_TARGET "user/game"   (Windows)',
      "  • or pass --target=user/game",
    ].join("\n"),
  );
  process.exit(1);
}

const channel = args.get("channel") ?? "html";
const skipPack = args.get("skip-pack") === "true";

function run(cmd, argv, opts = {}) {
  const r = spawnSync(cmd, argv, { stdio: "inherit", shell: true, ...opts });
  if (r.status !== 0) {
    process.exit(r.status ?? 1);
  }
}

const butlerCheck = spawnSync(butlerCmd, ["-V"], { shell: true, stdio: "ignore" });
if (butlerCheck.status !== 0) {
  console.error(
    [
      "butler CLI not found.",
      "",
      "Either install it globally (https://itch.io/docs/butler/installing.html)",
      "or unzip butler-windows-amd64.zip into itch.io/tools/butler/.",
      "Then run `butler login` once before `npm run release:butler`.",
    ].join("\n"),
  );
  process.exit(1);
}

if (!skipPack) {
  console.log("→ pack:itch");
  run("npm", ["run", "pack:itch"]);
}

const exportDir = join(root, "itch.io", "export");
const zips = readdirSync(exportDir)
  .filter((f) => f.startsWith(`foldwink-itch-upload-v${version}-`) && f.endsWith(".zip"))
  .map((f) => {
    const path = join(exportDir, f);
    return { name: f, path, mtime: statSync(path).mtimeMs };
  })
  // Sort by modification time, newest first. Name-sort is wrong because
  // pack-itch.mjs produces "...-YYYY-MM-DD.zip" then "...-YYYY-MM-DD-rN.zip"
  // for same-day re-packs, and "." sorts AFTER "-" in ASCII — so the
  // first-of-the-day zip wins a descending name-sort even after -r3 arrives.
  .sort((a, b) => b.mtime - a.mtime);

if (zips.length === 0) {
  console.error(`No zip for v${version} found in ${exportDir}.`);
  process.exit(1);
}

const zip = zips[0];
const channelSpec = `${target}:${channel}`;

console.log(`→ butler push ${zip.name} ${channelSpec} (userversion=${version})`);
run(butlerCmd, ["push", `"${zip.path}"`, channelSpec, `--userversion=${version}`]);

console.log(`\n✓ pushed v${version} to ${channelSpec}`);
console.log(`  returning players keep their localStorage — channel URL is stable.`);
