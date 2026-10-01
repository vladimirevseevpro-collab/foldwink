import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import {
  analyzePool,
  normalizeGroupKey,
  POOLS,
  readPool,
  ROOT,
} from "./check-corpus-uniqueness.mjs";

const RETIRED_ROOT = join(ROOT, "puzzles", "_retired", "dup-quarantine");
const ID_PATTERN = /\b((?:puzzle|hard|ru|de)-\d+)\b/g;

function collectIdsFromText(text, into) {
  let match;
  ID_PATTERN.lastIndex = 0;
  while ((match = ID_PATTERN.exec(text)) !== null) into.add(match[1]);
}

function walkFiles(directory, extensions, visit) {
  if (!existsSync(directory)) return;
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const full = join(directory, entry.name);
    if (entry.isDirectory()) walkFiles(full, extensions, visit);
    else if (extensions.some((extension) => entry.name.endsWith(extension))) visit(full);
  }
}

export function collectReferencedIds() {
  const ids = new Set();
  const manifestsDir = join(ROOT, "puzzles", "manifests");
  if (existsSync(manifestsDir)) {
    for (const file of readdirSync(manifestsDir)) {
      if (file.endsWith(".json"))
        collectIdsFromText(readFileSync(join(manifestsDir, file), "utf8"), ids);
    }
  }
  const extensions = [".ts", ".tsx", ".mjs", ".cjs", ".js"];
  walkFiles(join(ROOT, "src"), extensions, (file) =>
    collectIdsFromText(readFileSync(file, "utf8"), ids),
  );
  walkFiles(join(ROOT, "tests"), extensions, (file) =>
    collectIdsFromText(readFileSync(file, "utf8"), ids),
  );
  return ids;
}

function tierCounts(puzzles) {
  const counts = { easy: 0, medium: 0, hard: 0 };
  for (const puzzle of puzzles) counts[puzzle.difficulty] = (counts[puzzle.difficulty] ?? 0) + 1;
  return counts;
}

/**
 * Select puzzles to quarantine:
 *  1. Definition duplicates (>=3 of 4 normalized groups already seen earlier).
 *  2. Safety pass: the checker also rejects any group that occurs in more than
 *     3 surviving puzzles, so remove the latest non-referenced occurrences of
 *     over-reused groups until every group stays within the cap.
 * Referenced puzzles are never selected.
 */
export function selectQuarantine(puzzles, referenced) {
  const { duplicates } = analyzePool(puzzles);
  const keptReferenced = [];
  const removedIds = new Set();
  for (const puzzle of duplicates) {
    if (referenced.has(puzzle.id)) keptReferenced.push(puzzle);
    else removedIds.add(puzzle.id);
  }

  const byId = new Map(puzzles.map((puzzle) => [puzzle.id, puzzle]));
  for (;;) {
    const survivors = puzzles.filter((puzzle) => !removedIds.has(puzzle.id));
    const members = new Map();
    for (const puzzle of survivors) {
      for (const group of puzzle.raw.groups) {
        const key = normalizeGroupKey(group.items);
        const list = members.get(key) ?? [];
        list.push(puzzle.id);
        members.set(key, list);
      }
    }
    const candidates = new Set();
    for (const ids of members.values()) {
      if (ids.length <= 3) continue;
      const removable = ids.filter((id) => !referenced.has(id));
      if (removable.length === 0) continue;
      candidates.add(removable[removable.length - 1]);
    }
    if (candidates.size === 0) break;
    let chosen = null;
    for (const id of candidates) if (chosen === null || id > chosen) chosen = id;
    removedIds.add(chosen);
  }

  return {
    removed: [...removedIds].map((id) => byId.get(id)),
    keptReferenced,
  };
}

function main() {
  const dryRun = process.argv.includes("--dry-run");
  const referenced = collectReferencedIds();
  const summary = [];
  for (const pool of POOLS) {
    const puzzles = readPool(pool.dir);
    const { removed, keptReferenced } = selectQuarantine(puzzles, referenced);
    for (const puzzle of removed) {
      const source = join(pool.dir, puzzle.file);
      const targetDir = join(RETIRED_ROOT, pool.language);
      const target = join(targetDir, puzzle.file);
      if (!dryRun) {
        mkdirSync(targetDir, { recursive: true });
        if (existsSync(target)) rmSync(target);
        renameSync(source, target);
      }
    }
    const remaining = puzzles.filter((puzzle) => !removed.some((item) => item.id === puzzle.id));
    summary.push({
      language: pool.language,
      total: puzzles.length,
      moved: removed.length,
      keptReferenced,
      before: tierCounts(puzzles),
      after: tierCounts(remaining),
    });
  }

  for (const item of summary) {
    console.log(
      `[${item.language}] total=${item.total} ${dryRun ? "would-move" : "moved"}=${item.moved} kept-referenced=${item.keptReferenced.length} remaining=${item.total - item.moved}`,
    );
    console.log(
      `  tiers before easy=${item.before.easy} medium=${item.before.medium} hard=${item.before.hard} -> after easy=${item.after.easy} medium=${item.after.medium} hard=${item.after.hard}`,
    );
    for (const puzzle of item.keptReferenced) {
      console.log(`  KEEP (referenced duplicate): ${puzzle.id} (reused ${puzzle.reused}/4) [${puzzle.file}]`);
    }
  }
  console.log(dryRun ? "\nDry run only — no files were moved." : "\nQuarantine complete.");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
