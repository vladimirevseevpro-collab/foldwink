#!/usr/bin/env node
// Heuristic difficulty scoring pass.
// Computes a 0–100 score per puzzle inside its tier (easy/medium/hard) and
// writes it back into `meta.difficultyScore`. Used by loader `*_RAMPED` pools
// to present puzzles in easy→hard order within standard-mode progression.
//
// Factors (within-tier ordering, not absolute):
//   1. Category abstraction     (0–35) — single-word vs multi-word labels,
//                                         wordplay flag, punctuation clues.
//   2. Cross-group lex overlap  (0–35) — trigram Jaccard between items
//                                         across groups. More overlap = the
//                                         groups feel closer = harder.
//   3. Item rarity proxy        (0–30) — item length + rare-char fraction.
//
// Usage:
//   node scripts/score-puzzles.mjs              # all pools
//   node scripts/score-puzzles.mjs --pool=ru    # just one
//   node scripts/score-puzzles.mjs --dry-run    # print without writing

import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

const POOLS = [
  { lang: "en", dir: join(ROOT, "puzzles/pool") },
  { lang: "de", dir: join(ROOT, "puzzles/de/pool") },
  { lang: "ru", dir: join(ROOT, "puzzles/ru/pool") },
];

const args = new Set(process.argv.slice(2));
const DRY = args.has("--dry-run");
const onlyPool = [...args].find((a) => a.startsWith("--pool="))?.split("=")[1];

const RARE_CHARS = {
  en: /[qxzj]/gi,
  de: /[äöüßqxy]/gi,
  ru: /[ъьёщэюф]/gi,
};

function labelAbstractionScore(label, meta) {
  const words = label.trim().split(/\s+/).length;
  let s = 0;
  if (words === 1) s += 0;
  else if (words === 2) s += 10;
  else if (words === 3) s += 18;
  else s += 24;
  if (/["'`_]/.test(label) || /___/.test(label)) s += 6;
  if (meta?.categoryType === "wordplay" || meta?.wordplay === true) s = Math.max(s, 30);
  if (meta?.categoryType === "classification") s = Math.min(s, 16);
  return Math.min(35, s);
}

function trigrams(text) {
  const t = text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
  const out = new Set();
  if (t.length < 3) {
    if (t.length > 0) out.add(t);
    return out;
  }
  for (let i = 0; i <= t.length - 3; i++) out.add(t.slice(i, i + 3));
  return out;
}

function jaccard(a, b) {
  if (a.size === 0 && b.size === 0) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

function crossGroupOverlapScore(groups) {
  const grams = groups.map((g) => {
    const set = new Set();
    for (const item of g.items) for (const tg of trigrams(item)) set.add(tg);
    return set;
  });
  const pairs = [];
  for (let i = 0; i < grams.length; i++) {
    for (let j = i + 1; j < grams.length; j++) pairs.push(jaccard(grams[i], grams[j]));
  }
  const avg = pairs.reduce((s, v) => s + v, 0) / pairs.length;
  return Math.min(35, Math.round((avg / 0.08) * 35));
}

function itemRarityScore(groups, lang) {
  const items = groups.flatMap((g) => g.items);
  const avgLen = items.reduce((s, it) => s + it.length, 0) / items.length;
  let lenScore;
  if (avgLen >= 9) lenScore = 18;
  else if (avgLen >= 7) lenScore = 12;
  else if (avgLen >= 5) lenScore = 6;
  else lenScore = 2;

  const rareRe = RARE_CHARS[lang] ?? /(?!)/g;
  let rareHits = 0;
  let totalChars = 0;
  for (const it of items) {
    totalChars += it.length;
    const m = it.match(rareRe);
    if (m) rareHits += m.length;
  }
  const rareRatio = totalChars === 0 ? 0 : rareHits / totalChars;
  const rareScore = Math.min(12, Math.round(rareRatio * 100));

  return Math.min(30, lenScore + rareScore);
}

function scorePuzzle(puzzle, lang) {
  const abstraction =
    puzzle.groups.reduce((s, g) => s + labelAbstractionScore(g.label, puzzle.meta), 0) /
    puzzle.groups.length;
  const overlap = crossGroupOverlapScore(puzzle.groups);
  const rarity = itemRarityScore(puzzle.groups, lang);
  const total = Math.round(abstraction + overlap + rarity);
  return {
    score: Math.max(0, Math.min(100, total)),
    breakdown: {
      abstraction: Math.round(abstraction),
      overlap,
      rarity,
    },
  };
}

function processPool({ lang, dir }) {
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort();
  let updated = 0;
  const perTier = { easy: [], medium: [], hard: [] };

  for (const file of files) {
    const path = join(dir, file);
    let puzzle;
    try {
      puzzle = JSON.parse(readFileSync(path, "utf8"));
    } catch (err) {
      console.warn(`[${lang}] skip ${file}: ${err.message}`);
      continue;
    }
    if (!puzzle.groups || puzzle.groups.length !== 4) continue;
    const { score, breakdown } = scorePuzzle(puzzle, lang);
    const meta = { ...(puzzle.meta ?? {}) };
    const prev = meta.difficultyScore;
    meta.difficultyScore = score;
    puzzle.meta = meta;

    if (!DRY && prev !== score) {
      writeFileSync(path, JSON.stringify(puzzle, null, 2) + "\n");
      updated += 1;
    }

    const tier = puzzle.difficulty ?? "easy";
    if (perTier[tier]) {
      perTier[tier].push({ id: puzzle.id, score, breakdown });
    }
  }

  for (const tier of Object.keys(perTier)) {
    perTier[tier].sort((a, b) => a.score - b.score);
  }

  return { lang, files: files.length, updated, perTier };
}

const targets = onlyPool ? POOLS.filter((p) => p.lang === onlyPool) : POOLS;
if (targets.length === 0) {
  console.error(`Unknown --pool=${onlyPool}. Valid: en, de, ru.`);
  process.exit(1);
}

console.log(DRY ? "[dry-run]" : "[write mode]");
for (const pool of targets) {
  const { lang, files, updated, perTier } = processPool(pool);
  console.log(`\n[${lang}] scanned ${files} puzzles, wrote ${updated} updates.`);
  for (const tier of ["easy", "medium", "hard"]) {
    const list = perTier[tier];
    if (list.length === 0) continue;
    const min = list[0];
    const max = list[list.length - 1];
    const median = list[Math.floor(list.length / 2)];
    console.log(
      `  ${tier.padEnd(6)} n=${String(list.length).padStart(3)} ` +
        `min=${min.score} (${min.id}) ` +
        `median=${median.score} ` +
        `max=${max.score} (${max.id})`,
    );
  }
}
