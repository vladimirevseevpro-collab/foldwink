#!/usr/bin/env node
/**
 * check-daily-horizon.mjs
 *
 * Fails when the published Daily calendar is close to running out. It reads
 * every checked-in `puzzles/manifests/daily.<lang>.<date>.json`, computes the
 * last covered date per language and reports how many days remain from today.
 *
 * Usage:
 *   node scripts/check-daily-horizon.mjs
 *   node scripts/check-daily-horizon.mjs --min-days 14
 */

import { readdir, readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const LANGUAGES = ["en", "ru", "de"];
const DEFAULT_MIN_DAYS = 14;
const DAY_MS = 86_400_000;

function localIsoDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function daysBetween(fromIso, toIso) {
  return Math.floor(
    (Date.parse(`${toIso}T00:00:00Z`) - Date.parse(`${fromIso}T00:00:00Z`)) / DAY_MS,
  );
}

export async function checkDailyHorizon(options = {}) {
  const root = options.root ?? resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const today = options.today ?? localIsoDate();
  const minDays = options.minDays ?? DEFAULT_MIN_DAYS;
  const manifestDir = join(root, "puzzles", "manifests");
  const files = (await readdir(manifestDir)).filter((file) => file.endsWith(".json"));

  const languages = [];
  const failures = [];
  for (const language of LANGUAGES) {
    const prefix = `daily.${language}.`;
    const owned = files.filter((file) => file.startsWith(prefix));
    if (owned.length === 0) {
      languages.push({ language, lastDate: null, daysRemaining: null });
      failures.push(`${language}: no daily manifests published`);
      continue;
    }
    let lastDate = null;
    for (const file of owned) {
      const manifest = JSON.parse(await readFile(join(manifestDir, file), "utf8"));
      if (!Array.isArray(manifest.entries)) {
        failures.push(`${language}: ${file} has no entries`);
        continue;
      }
      for (const entry of manifest.entries) {
        if (typeof entry.date !== "string") continue;
        if (lastDate === null || entry.date > lastDate) lastDate = entry.date;
      }
    }
    const daysRemaining = lastDate === null ? null : daysBetween(today, lastDate);
    languages.push({ language, lastDate, daysRemaining });
    if (daysRemaining === null || daysRemaining < minDays) {
      failures.push(
        `${language}: horizon ends ${lastDate ?? "never"} (${daysRemaining ?? "n/a"} days from ${today}, need ${minDays})`,
      );
    }
  }

  return { ok: failures.length === 0, today, minDays, languages, failures };
}

export function formatHorizon(result) {
  return result.languages
    .map(
      ({ language, lastDate, daysRemaining }) =>
        `${language}: last ${lastDate ?? "n/a"} (${daysRemaining ?? "n/a"} days remaining)`,
    )
    .join("; ");
}

async function main() {
  const argIndex = process.argv.indexOf("--min-days");
  const minDays = argIndex >= 0 ? Number(process.argv[argIndex + 1]) : DEFAULT_MIN_DAYS;
  if (!Number.isInteger(minDays) || minDays < 0) {
    console.error(`Invalid --min-days value: ${process.argv[argIndex + 1]}`);
    process.exit(2);
  }
  const result = await checkDailyHorizon({ minDays });
  console.log(`Daily horizon from ${result.today} (minimum ${minDays} days):`);
  for (const { language, lastDate, daysRemaining } of result.languages) {
    console.log(`- ${language}: last ${lastDate ?? "n/a"}, ${daysRemaining ?? "n/a"} days remaining`);
  }
  if (!result.ok) {
    console.error(`\nFAIL: ${result.failures.join("; ")}`);
    process.exit(1);
  }
  console.log("\nOK: every language covers the minimum horizon.");
}

const invokedDirectly =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {
  await main();
}
