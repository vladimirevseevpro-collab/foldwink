#!/usr/bin/env node
// Local pre-pass for plan A: find puzzles where a known overlap pair
// (animals by sex/age, near-synonyms) appears split across different groups.
//
// Output: reports/puzzle_audit/candidates.json — list of suspect puzzles
// to hand to codex exec for verification.

import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const PAIRS = JSON.parse(
  readFileSync(join(ROOT, "reports/puzzle_audit/overlap_pairs.json"), "utf8"),
);

const POOLS = [
  { lang: "en", dir: join(ROOT, "puzzles/pool") },
  { lang: "de", dir: join(ROOT, "puzzles/de/pool") },
  { lang: "ru", dir: join(ROOT, "puzzles/ru/pool") },
];

const norm = (s) => s.trim().toLowerCase().replace(/ё/g, "е");

const findings = [];

for (const { lang, dir } of POOLS) {
  const files = readdirSync(dir).filter((f) => f.endsWith(".json"));
  const langPairs = PAIRS[lang] ?? [];

  for (const file of files) {
    const path = join(dir, file);
    let puzzle;
    try {
      puzzle = JSON.parse(readFileSync(path, "utf8"));
    } catch {
      continue;
    }
    if (!Array.isArray(puzzle.groups)) continue;

    const itemLocations = new Map();
    for (const group of puzzle.groups) {
      for (const item of group.items ?? []) {
        itemLocations.set(norm(item), {
          raw: item,
          groupId: group.id,
          groupLabel: group.label,
        });
      }
    }

    for (const { pair, reason } of langPairs) {
      const [a, b] = pair.map(norm);
      const locA = itemLocations.get(a);
      const locB = itemLocations.get(b);
      if (!locA || !locB) continue;
      if (locA.groupId === locB.groupId) continue;

      findings.push({
        lang,
        puzzleId: puzzle.id,
        title: puzzle.title,
        difficulty: puzzle.difficulty,
        pair: [locA.raw, locB.raw],
        reason,
        splitAcross: [
          { item: locA.raw, group: locA.groupLabel },
          { item: locB.raw, group: locB.groupLabel },
        ],
        file: path.replace(ROOT + "\\", "").replace(/\\/g, "/"),
      });
    }
  }
}

findings.sort((a, b) =>
  a.lang === b.lang ? a.puzzleId.localeCompare(b.puzzleId) : a.lang.localeCompare(b.lang),
);

const out = join(ROOT, "reports/puzzle_audit/candidates.json");
writeFileSync(
  out,
  JSON.stringify(
    { generatedAt: new Date().toISOString(), count: findings.length, findings },
    null,
    2,
  ),
);

console.log(`Scanned ${POOLS.length} pools.`);
console.log(`Found ${findings.length} cross-group overlap candidate(s).`);
console.log(`Wrote ${out}`);
if (findings.length > 0) {
  console.log("\nPreview:");
  for (const f of findings.slice(0, 15)) {
    console.log(
      `  [${f.lang}] ${f.puzzleId} (${f.difficulty}): ${f.pair[0]} in "${f.splitAcross[0].group}" vs ${f.pair[1]} in "${f.splitAcross[1].group}" — ${f.reason}`,
    );
  }
  if (findings.length > 15) console.log(`  ... and ${findings.length - 15} more`);
}
