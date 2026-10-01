import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export const POOLS = [
  { language: "en", dir: join(ROOT, "puzzles", "pool") },
  { language: "ru", dir: join(ROOT, "puzzles", "ru", "pool") },
  { language: "de", dir: join(ROOT, "puzzles", "de", "pool") },
];

/**
 * A group normalizes to the frozenset of its lowercased, trimmed item strings.
 */
export function normalizeGroupKey(items) {
  return [...new Set(items.map((item) => String(item).trim().toLowerCase()))]
    .sort()
    .join("\u0001");
}

export function readPool(dir) {
  return readdirSync(dir)
    .filter((file) => file.endsWith(".json"))
    .map((file) => {
      const raw = JSON.parse(readFileSync(join(dir, file), "utf8"));
      return { file, id: raw.id, difficulty: raw.difficulty, raw };
    })
    .sort((left, right) => (left.id < right.id ? -1 : left.id > right.id ? 1 : 0));
}

/**
 * Process puzzles in ascending id order. A puzzle is a DUPLICATE when at least
 * 3 of its 4 normalized groups already occurred in an EARLIER puzzle.
 */
export function analyzePool(puzzles) {
  const groupPuzzles = new Map();
  const duplicates = [];
  const unique = [];
  for (const puzzle of puzzles) {
    const keys = puzzle.raw.groups.map((group) => normalizeGroupKey(group.items));
    let reused = 0;
    for (const key of keys) if (groupPuzzles.has(key)) reused += 1;
    const isDuplicate = reused >= 3;
    if (isDuplicate) duplicates.push({ ...puzzle, reused });
    else unique.push(puzzle);
    for (const key of keys) {
      const seen = groupPuzzles.get(key) ?? new Set();
      seen.add(puzzle.id);
      groupPuzzles.set(key, seen);
    }
  }
  let maxReuse = 0;
  for (const seen of groupPuzzles.values()) maxReuse = Math.max(maxReuse, seen.size);
  return { total: puzzles.length, unique: unique.length, duplicates, maxReuse, groupPuzzles };
}

export function analyzeCorpus() {
  return POOLS.map((pool) => ({
    language: pool.language,
    dir: pool.dir,
    ...analyzePool(readPool(pool.dir)),
  }));
}

function main() {
  const reportOnly = process.argv.includes("--report");
  const results = analyzeCorpus();
  let failed = false;
  for (const result of results) {
    console.log(`\n[${result.language}] total=${result.total} unique=${result.unique} duplicates=${result.duplicates.length} maxGroupReuse=${result.maxReuse}`);
    if (result.duplicates.length > 0) {
      failed = true;
      const sample = result.duplicates.slice(0, 5).map((p) => `${p.id}(${p.reused}/4)`);
      console.log(`  duplicate sample: ${sample.join(", ")}${result.duplicates.length > 5 ? ", ..." : ""}`);
    }
    if (result.maxReuse > 3) {
      failed = true;
      console.log(`  WARNING: a single group appears in ${result.maxReuse} puzzles (limit 3)`);
    }
  }
  if (reportOnly) {
    console.log("\nReport only — no exit failure.");
    return;
  }
  if (failed) {
    console.error("\nCorpus uniqueness FAILED: duplicates or excessive group reuse detected.");
    process.exit(1);
  }
  console.log("\nCorpus uniqueness OK.");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
