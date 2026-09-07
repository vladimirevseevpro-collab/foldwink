#!/usr/bin/env node
// Phase E blend — aggregate GPT perceived-difficulty ratings from
// phase_e_raw/*.json, blend with the S1 heuristic score already stored in
// meta.difficultyScore, and write the combined result to meta.editorialRank.
//
// Blend: editorialRank = round(0.4 * S1 + 0.6 * GPT).
// GPT is weighted higher because it judges actual player experience —
// cultural familiarity, false-trail strength, etc — that the heuristic
// can't see.
//
// If a puzzle has no GPT rating (e.g. batch failed), editorialRank falls
// back to the S1 score so the ramp still works.
//
// Output: modifies puzzle JSONs in place.

import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const PHASE_E_DIR = join(ROOT, "reports/puzzle_audit/phase_e_raw");
const POOLS = [
  { lang: "en", dir: join(ROOT, "puzzles/pool") },
  { lang: "de", dir: join(ROOT, "puzzles/de/pool") },
  { lang: "ru", dir: join(ROOT, "puzzles/ru/pool") },
];

// Load all GPT ratings.
const ratingById = new Map();
const rationales = new Map();
try {
  const files = readdirSync(PHASE_E_DIR).filter((f) =>
    /^[a-z]{2}-(easy|medium|hard)-b\d+\.json$/.test(f),
  );
  for (const f of files) {
    const batch = JSON.parse(readFileSync(join(PHASE_E_DIR, f), "utf8"));
    for (const r of batch.ratings ?? []) {
      ratingById.set(r.puzzleId, r.difficulty);
      rationales.set(r.puzzleId, r.rationale);
    }
  }
} catch (err) {
  console.error(
    `No phase_e_raw data yet (${err.message}); run scripts/phase-e-gpt-ranking.mjs first.`,
  );
  process.exit(1);
}
console.log(`Loaded GPT ratings for ${ratingById.size} puzzles.`);

let updated = 0;
let fallback = 0;

for (const { dir } of POOLS) {
  const files = readdirSync(dir).filter((f) => f.endsWith(".json"));
  for (const f of files) {
    const path = join(dir, f);
    let puzzle;
    try {
      puzzle = JSON.parse(readFileSync(path, "utf8"));
    } catch {
      continue;
    }
    const s1 = puzzle.meta?.difficultyScore ?? 50;
    const gpt = ratingById.get(puzzle.id);
    const editorialRank = gpt !== undefined ? Math.round(0.4 * s1 + 0.6 * gpt) : s1;
    const meta = { ...(puzzle.meta ?? {}) };
    meta.editorialRank = editorialRank;
    if (gpt !== undefined) {
      meta.gptDifficulty = gpt;
      if (rationales.get(puzzle.id)) meta.gptRationale = rationales.get(puzzle.id);
    } else {
      fallback += 1;
    }
    puzzle.meta = meta;
    writeFileSync(path, JSON.stringify(puzzle, null, 2) + "\n");
    updated += 1;
  }
}

console.log(`Updated ${updated} puzzles. ${fallback} used S1 fallback (no GPT rating).`);
