/**
 * Detect "trivial keyword-match" puzzles — where the group label names a
 * word that appears verbatim (or as an obvious stem) inside each item.
 * Such puzzles require zero thinking: the player just picks tiles that
 * contain the word. They violate the design spirit of a grouping puzzle.
 *
 * Detection: for each group, take the label's content words (length ≥ 3,
 * after removing punctuation). For each such word, stem it to 3-5 chars.
 * Count how many of the 4 items contain that stem (case-insensitive). If
 * ≥ 3 items contain the same label-stem, flag the group as trivial.
 *
 * Usage: node scripts/detect-trivial-puzzles.mjs [dir]
 */
import fs from "node:fs";
import path from "node:path";

const dir = process.argv[2] ?? "puzzles/ru/pool";
const DIR = path.resolve(dir);

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
  "та",
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
  "них",
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
  "eines",
]);

function labelWords(label, isRu) {
  const stop = isRu ? STOPWORDS_RU : STOPWORDS_DE;
  return label
    .toLowerCase()
    .replace(/[^\wа-яёöäüß]+/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !stop.has(w));
}

function stem(word) {
  // crude stemming — first 4-5 chars cover "голов-а/у/ы", "рук-и/е/ой" etc.
  if (word.length <= 4) return word;
  return word.slice(0, Math.min(5, word.length - 1));
}

function normalized(item) {
  return item.toLowerCase();
}

function itemContainsStem(item, s) {
  return normalized(item).includes(s);
}

const files = fs
  .readdirSync(DIR)
  .filter((f) => f.endsWith(".json"))
  .sort();
const flagged = [];
const isRu = dir.includes("ru");

for (const f of files) {
  const raw = JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8"));
  for (const g of raw.groups ?? []) {
    const words = labelWords(g.label, isRu);
    for (const w of words) {
      const s = stem(w);
      if (s.length < 3) continue;
      const hits = g.items.filter((it) => itemContainsStem(it, s)).length;
      if (hits >= 3) {
        flagged.push({
          file: f,
          title: raw.title,
          difficulty: raw.difficulty,
          group: g.label,
          stem: s,
          hits,
          items: g.items,
        });
        break;
      }
    }
  }
}

console.log(`Scanned ${files.length} files in ${dir}. Flagged: ${flagged.length}\n`);
for (const f of flagged) {
  console.log(
    `[${f.difficulty.padEnd(6)}] ${f.file}  "${f.title}" / "${f.group}"  (stem="${f.stem}", ${f.hits}/4)`,
  );
  for (const it of f.items) console.log(`    · ${it}`);
  console.log();
}

console.log(`\nTotal flagged groups: ${flagged.length}`);
