#!/usr/bin/env node
/**
 * build-daily-calendar.mjs
 *
 * Extends the published Daily horizon with one new 60-day schedule per
 * language, starting the day after the last published Daily (or at
 * --start=YYYY-MM-DD). Published schedules are immutable inputs and are never
 * rewritten. New manifests follow the checked-in filename convention:
 *
 *   puzzles/manifests/daily.<lang>.<startDate>.json
 *   scheduleVersion: daily-<startDate>-<endDate>-v1
 *
 * Selection is deterministic and offline:
 *   - only active-pool boards that are not duplicates are eligible, where a
 *     duplicate is a board with at least 3 of its 4 groups already present in
 *     an earlier board by ascending id (groups are item sets, case-insensitive);
 *   - boards already used by any existing Daily schedule or starter manifest
 *     are never reused;
 *   - Medium boards need a revealHint on every group (no Tabs label fallback);
 *   - the weekday tier rhythm of the existing schedule is mirrored per
 *     language, so RU/DE never receive a Hard slot they do not own;
 *   - a group label may not repeat inside any 7-day window, including the
 *     last days of the previously published schedule.
 *
 * Usage:
 *   node scripts/build-daily-calendar.mjs --dry-run
 *   node scripts/build-daily-calendar.mjs [--start=YYYY-MM-DD]
 */

import { readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST_DIR = join(ROOT, "puzzles", "manifests");
const LANGUAGES = ["en", "ru", "de"];
const DAYS = 60;
const TIERS = ["easy", "medium", "hard"];
const WEEKDAY_NAMES = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const dryRun = process.argv.includes("--dry-run");
const startArg = process.argv.find((arg) => arg.startsWith("--start="))?.slice("--start=".length);
/** First Daily date of the new schedule; resolved in main(). */
let START_DATE;

const readJson = async (file) => JSON.parse(await readFile(file, "utf8"));
const writeJson = (file, value) => writeFile(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");

function addDays(iso, days) {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function weekday(iso) {
  return new Date(`${iso}T00:00:00Z`).getUTCDay();
}

function daysBetween(fromIso, toIso) {
  return Math.round((Date.parse(`${toIso}T00:00:00Z`) - Date.parse(`${fromIso}T00:00:00Z`)) / 86_400_000);
}

function poolDirectory(language) {
  return language === "en"
    ? join(ROOT, "puzzles", "pool")
    : join(ROOT, "puzzles", language, "pool");
}

function groupKey(group) {
  return group.items
    .map((item) => String(item).trim().toLowerCase())
    .sort()
    .join("|");
}

function labelKey(group) {
  return String(group.label).trim().toLowerCase();
}

async function loadPool(language) {
  const directory = poolDirectory(language);
  const files = (await readdir(directory)).filter((file) => file.endsWith(".json")).sort();
  const pool = [];
  for (const file of files) pool.push(await readJson(join(directory, file)));
  return pool.sort((left, right) => left.id.localeCompare(right.id));
}

/** Boards with >= 3 groups already seen in an earlier board by ascending id. */
function findDuplicates(pool) {
  const seen = new Set();
  const duplicates = new Set();
  for (const puzzle of pool) {
    const keys = puzzle.groups.map(groupKey);
    const overlap = keys.filter((key) => seen.has(key)).length;
    if (overlap >= 3) duplicates.add(puzzle.id);
    for (const key of keys) seen.add(key);
  }
  return duplicates;
}

async function dailyManifestFiles(language) {
  const files = (await readdir(MANIFEST_DIR)).filter(
    (file) =>
      file.startsWith(`daily.${language}.`) &&
      file.endsWith(".json"),
  );
  return files.sort();
}

/** Weekday -> ordered tier rhythm observed in the historical published days. */
function weekdayTierRhythm(historicalEntries, difficultyById) {
  const rhythm = new Map();
  for (const entry of historicalEntries) {
    const tier = difficultyById.get(entry.puzzleId);
    if (!tier) continue;
    const key = weekday(entry.date);
    if (!rhythm.has(key)) rhythm.set(key, []);
    rhythm.get(key).push(tier);
  }
  return rhythm;
}

/** Medium boards need a Foldwink Tab hint on every group, not the full-label fallback. */
function hasFullTabs(puzzle) {
  return puzzle.groups.every((group) => typeof group.revealHint === "string" && group.revealHint.trim());
}

function choosePuzzle({ tier, pool, duplicateIds, usedIds, labelLastUsed, dayIndex }) {
  for (const puzzle of pool) {
    if (puzzle.difficulty !== tier) continue;
    if (duplicateIds.has(puzzle.id) || usedIds.has(puzzle.id)) continue;
    if (tier === "medium" && !hasFullTabs(puzzle)) continue;
    const labels = puzzle.groups.map(labelKey);
    const collides = labels.some((label) => {
      const last = labelLastUsed.get(label);
      return last !== undefined && dayIndex - last < 7;
    });
    if (collides) continue;
    return puzzle;
  }
  return undefined;
}

async function buildLanguage(language) {
  const pool = await loadPool(language);
  const difficultyById = new Map(pool.map((puzzle) => [puzzle.id, puzzle.difficulty]));
  const duplicateIds = findDuplicates(pool);
  const editorial = await readJson(join(MANIFEST_DIR, `editorial.${language}.json`));
  const contentVersion = editorial.catalogVersion;

  const targetFile = `daily.${language}.${START_DATE}.json`;
  const files = await dailyManifestFiles(language);
  const historicalFiles = files.filter((file) => file !== targetFile);

  const usedIds = new Set();
  const historicalEntries = [];
  for (const file of historicalFiles) {
    const manifest = await readJson(join(MANIFEST_DIR, file));
    if (manifest.entries.some((entry) => entry.date < START_DATE)) {
      for (const entry of manifest.entries) {
        if (entry.date < START_DATE) historicalEntries.push(entry);
      }
    }
    for (const entry of manifest.entries) usedIds.add(entry.puzzleId);
  }
  historicalEntries.sort((left, right) => left.date.localeCompare(right.date));

  const starters = await readJson(join(MANIFEST_DIR, `starters.${language}.json`));
  for (const entry of starters.entries) usedIds.add(entry.puzzleRef.puzzleId);

  const rhythm = weekdayTierRhythm(historicalEntries, difficultyById);
  for (const [key, tiers] of rhythm) rhythm.set(key, tiers.filter((tier) => TIERS.includes(tier)));
  if (rhythm.size === 0) throw new Error(`${language}: no historical tier rhythm to mirror`);

  const endDate = addDays(START_DATE, DAYS - 1);
  const scheduleVersion = `daily-${START_DATE}-${endDate}-v1`;
  const entries = [];
  const labelLastUsed = new Map();
  // Seed the 7-day label window with the tail of the previous schedule.
  const poolById = new Map(pool.map((puzzle) => [puzzle.id, puzzle]));
  for (const entry of historicalEntries) {
    const dayIndex = daysBetween(START_DATE, entry.date);
    if (dayIndex < -6) continue;
    for (const group of poolById.get(entry.puzzleId)?.groups ?? []) {
      labelLastUsed.set(labelKey(group), dayIndex);
    }
  }
  const tiersUsed = { easy: 0, medium: 0, hard: 0 };
  const weekdayCursor = new Map();

  for (let index = 0; index < DAYS; index += 1) {
    const date = addDays(START_DATE, index);
    const key = weekday(date);
    const tiers = rhythm.get(key);
    if (!tiers || tiers.length === 0) throw new Error(`${language}: no rhythm for ${date}`);
    const cursor = weekdayCursor.get(key) ?? 0;
    const tier = tiers[cursor % tiers.length];
    weekdayCursor.set(key, cursor + 1);

    const puzzle = choosePuzzle({
      tier,
      pool,
      duplicateIds,
      usedIds,
      labelLastUsed,
      dayIndex: index,
    });
    if (!puzzle) {
      throw new Error(
        `${language}: no eligible ${tier} board for ${date} (${WEEKDAY_NAMES[key]}) under duplicate/usage/label constraints`,
      );
    }

    usedIds.add(puzzle.id);
    tiersUsed[tier] += 1;
    for (const label of puzzle.groups.map(labelKey)) labelLastUsed.set(label, index);

    entries.push({
      entryId: `daily-${language}-${date}-v1`,
      date,
      language,
      puzzleId: puzzle.id,
      lineageId: puzzle.id,
      contentVersion,
      scheduleVersion,
    });
  }

  return { language, scheduleVersion, endDate, entries, pool, tiersUsed };
}

function editorialRecord(language, contentVersion, puzzle) {
  const tier = puzzle.difficulty;
  const topic =
    puzzle.meta?.theme ??
    (Array.isArray(puzzle.tags) && puzzle.tags.length > 0 ? puzzle.tags[0] : "general");
  return {
    puzzleRef: {
      language,
      puzzleId: puzzle.id,
      lineageId: puzzle.id,
      contentVersion,
    },
    publicTier: tier,
    band: "unrated",
    vocabularyFamiliarity:
      tier === "easy" ? "common" : tier === "medium" ? "mixed" : "specialist",
    relationTypes: [tier === "hard" ? "thematic" : tier === "medium" ? "attribute" : "classification"],
    topicTags: [String(topic)],
    anchorGroupId: puzzle.groups[0]?.id ?? null,
    ambiguityRisk: "review",
    tabReview: tier === "medium" ? "pending" : "not-applicable",
    mobileFit: "pending",
    authorReview: null,
    independentReview: null,
    playtest: null,
    status: "unreviewed",
  };
}

/** Last published Daily date; every language must end on the same date. */
async function lastPublishedDate() {
  const lastDates = new Set();
  for (const language of LANGUAGES) {
    let last = "";
    for (const file of await dailyManifestFiles(language)) {
      for (const entry of (await readJson(join(MANIFEST_DIR, file))).entries) {
        if (entry.date > last) last = entry.date;
      }
    }
    lastDates.add(last);
  }
  if (lastDates.size !== 1) {
    throw new Error(`published Daily horizons differ per language: ${[...lastDates].join(", ")}`);
  }
  return [...lastDates][0];
}

async function main() {
  const lastPublished = await lastPublishedDate();
  START_DATE = startArg ?? addDays(lastPublished, 1);
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(START_DATE) || addDays(START_DATE, 0) !== START_DATE) {
    throw new Error(`invalid --start date: ${START_DATE}`);
  }
  // Published schedules are immutable: a new one may not overlap them.
  if (START_DATE <= lastPublished) {
    throw new Error(`--start ${START_DATE} overlaps the published Daily horizon ending ${lastPublished}`);
  }

  const plans = [];
  for (const language of LANGUAGES) plans.push(await buildLanguage(language));

  for (const plan of plans) {
    const { language, scheduleVersion, endDate, entries, pool, tiersUsed } = plan;
    const targetFile = `daily.${language}.${START_DATE}.json`;
    console.log(
      `[${language}] ${scheduleVersion} ${START_DATE}..${endDate} (${entries.length} days) — ` +
        `easy ${tiersUsed.easy}, medium ${tiersUsed.medium}, hard ${tiersUsed.hard}`,
    );
    if (dryRun) {
      for (const entry of entries) {
        console.log(`  ${entry.date} ${entry.puzzleId}`);
      }
      continue;
    }

    const manifest = { language, scheduleVersion, entries };
    await writeJson(join(MANIFEST_DIR, targetFile), manifest);

    const editorialFile = join(MANIFEST_DIR, `editorial.${language}.json`);
    const editorial = await readJson(editorialFile);
    const known = new Set(editorial.records.map((record) => record.puzzleRef.puzzleId));
    const poolById = new Map(pool.map((puzzle) => [puzzle.id, puzzle]));
    let added = 0;
    for (const entry of entries) {
      if (known.has(entry.puzzleId)) continue;
      const puzzle = poolById.get(entry.puzzleId);
      if (!puzzle) throw new Error(`${language}: picked board missing from pool: ${entry.puzzleId}`);
      editorial.records.push(editorialRecord(language, editorial.catalogVersion, puzzle));
      known.add(entry.puzzleId);
      added += 1;
    }
    await writeJson(editorialFile, editorial);
    console.log(`  wrote ${targetFile}; added ${added} unreviewed editorial records`);
  }

  if (dryRun) console.log("\nDry run — no files written.");
}

await main();
