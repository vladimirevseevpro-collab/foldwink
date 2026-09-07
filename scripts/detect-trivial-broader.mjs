/**
 * Broader triviality detector. Complements detect-trivial-puzzles.mjs by
 * looking at the *items themselves*, not the label.
 *
 * Flags a group when:
 *   (a) all 4 items share a common prefix of ≥4 chars (e.g. "Anti-X"×4), OR
 *   (b) all 4 items share a common suffix of ≥4 chars (e.g. "-berg"×4), OR
 *   (c) all 4 items are a single token and share a common 4-char stem
 *       (indicates they are conjugations/forms of one root).
 *
 * Such groups reduce to visual pattern-matching; a decent medium puzzle
 * shouldn't resolve that easily.
 */
import fs from "node:fs";
import path from "node:path";

const dir = process.argv[2] ?? "puzzles/ru/pool";
const DIR = path.resolve(dir);

function commonPrefix(strings) {
  if (strings.length === 0) return "";
  let p = strings[0];
  for (const s of strings.slice(1)) {
    let i = 0;
    while (i < p.length && i < s.length && p[i].toLowerCase() === s[i].toLowerCase()) i++;
    p = p.slice(0, i);
  }
  return p;
}

function commonSuffix(strings) {
  if (strings.length === 0) return "";
  let p = strings[0];
  for (const s of strings.slice(1)) {
    let i = 0;
    while (
      i < p.length &&
      i < s.length &&
      p[p.length - 1 - i].toLowerCase() === s[s.length - 1 - i].toLowerCase()
    )
      i++;
    p = p.slice(p.length - i);
  }
  return p;
}

const files = fs
  .readdirSync(DIR)
  .filter((f) => f.endsWith(".json"))
  .sort();
const flagged = [];

for (const f of files) {
  const raw = JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8"));
  for (const g of raw.groups ?? []) {
    const items = g.items;
    const prefix = commonPrefix(items).trim();
    const suffix = commonSuffix(items).trim();
    if (prefix.length >= 4 && !prefix.includes(" ")) {
      flagged.push({
        file: f,
        title: raw.title,
        group: g.label,
        kind: "prefix",
        token: prefix,
        items,
      });
      continue;
    }
    if (suffix.length >= 4 && !suffix.includes(" ")) {
      flagged.push({
        file: f,
        title: raw.title,
        group: g.label,
        kind: "suffix",
        token: suffix,
        items,
      });
      continue;
    }
    // single-token conjugation check: each item has no spaces, share 4-char stem
    const allSingleToken = items.every((s) => !/\s/.test(s));
    if (allSingleToken) {
      const lowered = items.map((s) => s.toLowerCase());
      const stemPrefix = commonPrefix(lowered);
      if (stemPrefix.length >= 4) {
        flagged.push({
          file: f,
          title: raw.title,
          group: g.label,
          kind: "stem",
          token: stemPrefix,
          items,
        });
      }
    }
  }
}

console.log(`Scanned ${files.length} in ${dir}. Flagged: ${flagged.length}\n`);
for (const f of flagged) {
  console.log(`[${f.kind}] ${f.file}  "${f.title}" / "${f.group}"  (token="${f.token}")`);
  for (const it of f.items) console.log(`    · ${it}`);
  console.log();
}
