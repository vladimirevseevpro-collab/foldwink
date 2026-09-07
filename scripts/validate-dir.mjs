/**
 * Validate any puzzle directory.
 * Usage: node scripts/validate-dir.mjs <dir>
 *        node scripts/validate-dir.mjs puzzles/de-drafts
 */
import fs from "node:fs";
import path from "node:path";

const dir = process.argv[2];
if (!dir) {
  console.error("Usage: node scripts/validate-dir.mjs <directory>");
  process.exit(1);
}
const DIR = path.resolve(dir);
if (!fs.existsSync(DIR)) {
  console.error(`Directory not found: ${DIR}`);
  process.exit(1);
}

const MAX_ITEM = 22;
const MAX_HINT = 24;

const errors = [];
const warnings = [];

const files = fs
  .readdirSync(DIR)
  .filter((f) => f.endsWith(".json"))
  .sort();
if (files.length === 0) {
  console.log("No JSON files found in", DIR);
  process.exit(1);
}

const seenIds = new Map();
let easy = 0,
  medium = 0,
  hard = 0,
  ok = 0;
const longItems = [];

for (const f of files) {
  let raw;
  try {
    raw = JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8"));
  } catch (e) {
    errors.push(`[${f}] invalid JSON: ${e.message}`);
    continue;
  }

  if (!raw || typeof raw !== "object") {
    errors.push(`[${f}] not an object`);
    continue;
  }

  const id = raw.id;
  if (typeof id !== "string" || !id) {
    errors.push(`[${f}] missing id`);
    continue;
  }
  if (seenIds.has(id)) {
    errors.push(`[${f}] duplicate id: ${id} (also in ${seenIds.get(id)})`);
  } else seenIds.set(id, f);

  if (typeof raw.title !== "string" || !raw.title) errors.push(`[${f}] missing title`);

  const diff = raw.difficulty;
  if (diff !== "easy" && diff !== "medium" && diff !== "hard") {
    errors.push(`[${f}] invalid difficulty: ${diff}`);
  }

  if (!Array.isArray(raw.groups) || raw.groups.length !== 4) {
    errors.push(
      `[${f}] need 4 groups (got ${Array.isArray(raw.groups) ? raw.groups.length : "none"})`,
    );
    continue;
  }

  const itemsSeen = new Set();
  const groupIds = new Set();
  let puzzleOk = true;

  for (const g of raw.groups) {
    if (!g || typeof g !== "object") {
      errors.push(`[${f}] group not object`);
      puzzleOk = false;
      continue;
    }
    if (!g.id) {
      errors.push(`[${f}] group missing id`);
      puzzleOk = false;
      continue;
    }
    if (groupIds.has(g.id)) {
      errors.push(`[${f}] duplicate group id: ${g.id}`);
    }
    groupIds.add(g.id);

    if (!g.label) errors.push(`[${f}] group ${g.id} missing label`);

    if (!Array.isArray(g.items) || g.items.length !== 4) {
      errors.push(
        `[${f}] group ${g.id} needs 4 items (got ${Array.isArray(g.items) ? g.items.length : "none"})`,
      );
      puzzleOk = false;
      continue;
    }

    for (const item of g.items) {
      if (typeof item !== "string" || !item.trim()) {
        errors.push(`[${f}] group ${g.id} empty item`);
        puzzleOk = false;
        continue;
      }
      const norm = item.trim().toLowerCase();
      if (itemsSeen.has(norm)) {
        errors.push(`[${f}] duplicate item: "${item}"`);
        puzzleOk = false;
      }
      itemsSeen.add(norm);
      if (item.length > MAX_ITEM) {
        errors.push(`[${f}] item too long (${item.length}>${MAX_ITEM}): "${item}"`);
        longItems.push({ f, item });
        puzzleOk = false;
      }
    }

    if (diff === "medium") {
      if (!g.revealHint || typeof g.revealHint !== "string" || !g.revealHint.trim()) {
        errors.push(`[${f}] group ${g.id} missing revealHint (required for medium)`);
        puzzleOk = false;
      } else if (g.revealHint.length > MAX_HINT) {
        warnings.push(
          `[${f}] group ${g.id} revealHint too long (${g.revealHint.length}): "${g.revealHint}"`,
        );
      }
    }
  }

  if (puzzleOk) {
    ok++;
    if (diff === "easy") easy++;
    else if (diff === "medium") medium++;
    else if (diff === "hard") hard++;
  }
}

if (warnings.length > 0) {
  for (const w of warnings) console.warn("WARN", w);
}
if (errors.length > 0) {
  for (const e of errors) console.error("ERROR", e);
}

console.log(
  `\n${dir}: ${files.length} files, ${ok} valid (easy=${easy} medium=${medium} hard=${hard}), ${errors.length} errors, ${warnings.length} warnings.`,
);
if (longItems.length > 0) {
  console.log(`Long items (${longItems.length}):`);
  for (const { f, item } of longItems) console.log(`  ${f}: "${item}" (${item.length})`);
}

process.exit(errors.length > 0 ? 1 : 0);
