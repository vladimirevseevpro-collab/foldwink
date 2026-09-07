/**
 * Delete medium-difficulty puzzles flagged as trivial keyword-match.
 * Rationale: at medium difficulty players expect conceptual grouping;
 * word-match groups make medium feel like toddler-tier. Keep easy-level
 * word-match as entry point to the mechanic.
 *
 * Usage: node scripts/delete-trivial-medium.mjs [dir]
 */
import fs from "node:fs";
import path from "node:path";

const dir = process.argv[2] ?? "puzzles/ru/pool";
const DIR = path.resolve(dir);
const isRu = dir.includes("ru");

const STOPWORDS_RU = new Set([
  "и",
  "в",
  "на",
  "с",
  "по",
  "для",
  "от",
  "из",
  "как",
  "что",
  "это",
  "или",
  "но",
  "же",
  "ли",
  "не",
  "то",
  "та",
  "те",
  "со",
  "до",
  "за",
  "о",
  "об",
  "при",
  "под",
  "над",
  "без",
  "все",
  "их",
  "них",
  "его",
  "её",
  "название",
  "виды",
  "типы",
  "список",
  "слова",
  "фразы",
  "слово",
  "фраза",
  "часть",
  "части",
  "группа",
  "категория",
]);
const STOPWORDS_DE = new Set([
  "der",
  "die",
  "das",
  "und",
  "in",
  "mit",
  "bei",
  "auf",
  "von",
  "zu",
  "zum",
  "zur",
  "für",
  "aus",
  "an",
  "am",
  "um",
  "als",
  "auch",
  "wie",
  "was",
  "wer",
  "oder",
  "ein",
  "eine",
  "einen",
  "einer",
  "eines",
]);

function labelWords(label) {
  const stop = isRu ? STOPWORDS_RU : STOPWORDS_DE;
  return label
    .toLowerCase()
    .replace(/[^\wа-яёöäüß]+/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !stop.has(w));
}
function stem(word) {
  return word.length <= 4 ? word : word.slice(0, Math.min(5, word.length - 1));
}

const files = fs
  .readdirSync(DIR)
  .filter((f) => f.endsWith(".json"))
  .sort();
const toDelete = [];

for (const f of files) {
  const raw = JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8"));
  // Previously limited to medium; now sweeps all difficulties.
  let triviality = 0;
  for (const g of raw.groups ?? []) {
    const words = labelWords(g.label);
    for (const w of words) {
      const s = stem(w);
      if (s.length < 3) continue;
      const hits = g.items.filter((it) => it.toLowerCase().includes(s)).length;
      if (hits >= 3) {
        triviality += 1;
        break;
      }
    }
  }
  if (triviality >= 1) {
    toDelete.push({ file: f, title: raw.title, trivialGroups: triviality });
  }
}

console.log(`Deleting ${toDelete.length} trivial medium puzzles from ${dir}:\n`);
for (const d of toDelete) {
  console.log(
    `  - ${d.file} "${d.title}" (${d.trivialGroups} trivial group${d.trivialGroups > 1 ? "s" : ""})`,
  );
  fs.unlinkSync(path.join(DIR, d.file));
}
console.log(`\nDone. ${toDelete.length} files removed.`);
