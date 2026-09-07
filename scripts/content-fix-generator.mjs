#!/usr/bin/env node
// Content fairness pass — generate concrete JSON patches for
// FACTUAL_ERROR / LABEL_OVERLAP / SAME_SPECIES_SPLIT findings in
// MERGED_AUDIT_REPORT.json via codex CLI, then apply safe ones.
//
// For each finding, we feed GPT the current puzzle state + the
// finding's explanation + suggestedFix and ask for a minimal JSON patch:
//   { puzzleId, patches: [{ groupId, field: 'label' | 'items', oldValue,
//     newValue, itemIndex? }] }
// We only apply patches that preserve the 4×4 structure (four groups of
// four items, no duplicates).
//
// Usage:
//   node scripts/content-fix-generator.mjs --type=FACTUAL_ERROR [--lang=ru]
//                                         [--limit=50] [--dry-run] [--apply]

import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const ARGS = new Map(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    return m ? [m[1], m[2] ?? "true"] : [a, "true"];
  }),
);
const TYPE = ARGS.get("type") ?? "FACTUAL_ERROR";
const ONLY_LANG = ARGS.get("lang");
const LIMIT = parseInt(ARGS.get("limit") ?? "9999", 10);
const DRY = ARGS.get("dry-run") === "true";
const APPLY = ARGS.get("apply") === "true";
const BATCH_SIZE = 15;

const POOLS = {
  en: join(ROOT, "puzzles/pool"),
  de: join(ROOT, "puzzles/de/pool"),
  ru: join(ROOT, "puzzles/ru/pool"),
};

const OUT_DIR = join(ROOT, "reports/puzzle_audit/content_patches");
mkdirSync(OUT_DIR, { recursive: true });

function loadPuzzle(lang, id) {
  const dir = POOLS[lang];
  for (const f of readdirSync(dir)) {
    if (!f.endsWith(".json")) continue;
    try {
      const p = JSON.parse(readFileSync(join(dir, f), "utf8"));
      if (p.id === id) return { puzzle: p, path: join(dir, f) };
    } catch {}
  }
  return null;
}

const merged = JSON.parse(
  readFileSync(join(ROOT, "reports/puzzle_audit/MERGED_AUDIT_REPORT.json"), "utf8"),
);

const findings = merged.buckets.HIGH_REVIEW.filter(
  (it) => it.type === TYPE && (!ONLY_LANG || it.lang === ONLY_LANG),
).slice(0, LIMIT);
console.log(`${TYPE} / ${ONLY_LANG ?? "all"}: ${findings.length} findings to process`);

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["decisions"],
  properties: {
    decisions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["puzzleId", "action", "patches", "rationale"],
        properties: {
          puzzleId: { type: "string" },
          action: {
            type: "string",
            enum: ["patch", "skip-subjective", "skip-would-break-structure"],
          },
          rationale: { type: "string" },
          patches: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["groupId", "field", "oldValue", "newValue", "itemIndex"],
              properties: {
                groupId: { type: "string" },
                field: { type: "string", enum: ["label", "item"] },
                oldValue: { type: "string" },
                newValue: { type: "string" },
                itemIndex: {
                  anyOf: [{ type: "integer", minimum: 0, maximum: 3 }, { type: "null" }],
                },
              },
            },
          },
        },
      },
    },
  },
};
const SCHEMA_PATH = join(OUT_DIR, "_schema.json");
writeFileSync(SCHEMA_PATH, JSON.stringify(SCHEMA, null, 2));

function formatFinding(f) {
  const loaded = loadPuzzle(f.lang, f.puzzleId);
  if (!loaded) return null;
  const { puzzle } = loaded;
  const groups = puzzle.groups
    .map((g) => `  - ${g.id} | ${g.label}: ${g.items.join(", ")}`)
    .join("\n");
  return `### ${puzzle.id} (${puzzle.difficulty}, ${f.lang})
Current puzzle:
${groups}

GPT flag: ${f.type} / ${f.severity}
Explanation: ${f.explanation}
Suggested direction: ${f.suggestedFix || "(none)"}
`;
}

function buildPrompt(batch) {
  return `# Foldwink content fairness patching

You are producing MINIMAL, CONCRETE JSON patches for Foldwink puzzles that
have a flagged factual/fairness issue. Each puzzle has exactly 4 groups of
4 items. Your patches must preserve this structure — no duplicates, no
changes to groupIds, no structural reshuffles.

For each puzzle below, decide one of:
- \`action: "patch"\` — you have a concrete fix. Provide 1–4 patches. Each
  patch either renames a group's **label** (field="label") or replaces a
  single **item** in a group (field="item", itemIndex=0..3 pointing to
  the item's position in that group's items array). oldValue must match
  the current value **exactly** (including casing, punctuation, diacritics).
  newValue must be culturally/linguistically appropriate for the
  puzzle's language and tier.
- \`action: "skip-subjective"\` — the flag is a matter of taste, not a
  clear factual error (example: GPT says something is "too obscure" but
  it's really tier-appropriate).
- \`action: "skip-would-break-structure"\` — fixing the issue would
  require restructuring the whole puzzle (e.g. three of four items are
  wrong); leave for manual editorial.

Rules:
- Do NOT rename a group label if only one item is wrong — replace the
  item.
- Do NOT change language (en puzzles stay English, de stays German, ru
  stays Russian).
- Do NOT introduce any item that already exists in another group of the
  same puzzle.
- Do NOT change difficulty-appropriate register (easy stays accessible,
  no obscure terms).
- Do NOT propose any red-line violation (no FOMO copy, etc.).
- \`itemIndex\` MUST be non-null when field is "item" and MUST be null
  when field is "label".

## Puzzles (${batch.length})

${batch.map(formatFinding).filter(Boolean).join("\n")}

Return JSON matching the provided schema.
`;
}

function runCodex(prompt, outPath) {
  const lastMsg = outPath.replace(/\.json$/, ".txt");
  const res = spawnSync(
    "codex",
    [
      "exec",
      "--sandbox",
      "read-only",
      "--skip-git-repo-check",
      "--output-schema",
      `"${SCHEMA_PATH}"`,
      "-o",
      `"${lastMsg}"`,
      "-",
    ],
    {
      encoding: "utf8",
      input: prompt,
      shell: true,
      maxBuffer: 64 * 1024 * 1024,
    },
  );
  return { res, lastMsg };
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function validatePatches(puzzle, decision) {
  if (decision.action !== "patch") return { ok: true };
  const groupsByIdCopy = puzzle.groups.map((g) => ({ ...g, items: [...g.items] }));
  for (const p of decision.patches) {
    const g = groupsByIdCopy.find((x) => x.id === p.groupId);
    if (!g) return { ok: false, reason: `unknown groupId ${p.groupId}` };
    if (p.field === "label") {
      if (g.label !== p.oldValue) {
        return {
          ok: false,
          reason: `label mismatch in ${p.groupId}: expected "${p.oldValue}" got "${g.label}"`,
        };
      }
      g.label = p.newValue;
    } else if (p.field === "item") {
      if (p.itemIndex == null || p.itemIndex < 0 || p.itemIndex > 3) {
        return { ok: false, reason: `bad itemIndex in ${p.groupId}` };
      }
      if (g.items[p.itemIndex] !== p.oldValue) {
        return {
          ok: false,
          reason: `item[${p.itemIndex}] mismatch in ${p.groupId}: expected "${p.oldValue}" got "${g.items[p.itemIndex]}"`,
        };
      }
      g.items[p.itemIndex] = p.newValue;
    }
  }
  // Check no duplicates across groups.
  const seen = new Map();
  for (const g of groupsByIdCopy) {
    for (const item of g.items) {
      const norm = item.toLowerCase().trim().replace(/ё/g, "е");
      if (seen.has(norm) && seen.get(norm) !== g.id) {
        return { ok: false, reason: `duplicate item "${item}" after patch` };
      }
      seen.set(norm, g.id);
    }
  }
  return { ok: true, patched: groupsByIdCopy };
}

const allDecisions = [];
const batches = [];
for (let i = 0; i < findings.length; i += BATCH_SIZE) {
  batches.push(findings.slice(i, i + BATCH_SIZE));
}
console.log(`Split into ${batches.length} batches of ≤${BATCH_SIZE}`);

for (let i = 0; i < batches.length; i++) {
  const batch = batches[i];
  const outFile = join(
    OUT_DIR,
    `${TYPE}-${ONLY_LANG ?? "all"}-b${String(i + 1).padStart(2, "0")}.json`,
  );
  if (existsSync(outFile) && !ARGS.get("force")) {
    console.log(`batch ${i + 1}/${batches.length}: skip (exists)`);
    allDecisions.push(...JSON.parse(readFileSync(outFile, "utf8")).decisions);
    continue;
  }
  if (DRY) {
    console.log(`batch ${i + 1}/${batches.length}: would run (${batch.length} items)`);
    continue;
  }
  console.log(`batch ${i + 1}/${batches.length}: running codex (${batch.length} items)`);
  const prompt = buildPrompt(batch);
  const t0 = Date.now();
  let payload;
  for (let attempt = 1; attempt <= 6; attempt++) {
    const { res, lastMsg } = runCodex(prompt, outFile);
    const blob = (res.stdout ?? "") + (res.stderr ?? "");
    if (/hit your usage limit|Upgrade to Pro/i.test(blob)) {
      console.log(`  quota hit on attempt ${attempt}; sleep 65 min`);
      await sleep(65 * 60 * 1000);
      continue;
    }
    if (res.status !== 0) {
      console.log(`  failed status=${res.status}; sleep 30s`);
      await sleep(30_000);
      continue;
    }
    const raw = readFileSync(lastMsg, "utf8");
    const first = raw.indexOf("{");
    const last = raw.lastIndexOf("}");
    try {
      payload = JSON.parse(first >= 0 ? raw.slice(first, last + 1) : raw);
      break;
    } catch (err) {
      console.log(`  parse failed: ${err.message}`);
      break;
    }
  }
  if (!payload) {
    console.log(`  batch ${i + 1} giving up`);
    continue;
  }
  const elapsed = Math.round((Date.now() - t0) / 1000);
  console.log(`  OK in ${elapsed}s — ${(payload.decisions ?? []).length} decisions`);
  writeFileSync(
    outFile,
    JSON.stringify({ batchIndex: i, decisions: payload.decisions }, null, 2),
  );
  allDecisions.push(...(payload.decisions ?? []));
}

// Apply phase.
let applied = 0;
let rejected = 0;
let skipped = 0;
for (const decision of allDecisions) {
  if (decision.action !== "patch") {
    skipped += 1;
    continue;
  }
  // Find the puzzle.
  let found = null;
  for (const lang of Object.keys(POOLS)) {
    const loaded = loadPuzzle(lang, decision.puzzleId);
    if (loaded) {
      found = { lang, ...loaded };
      break;
    }
  }
  if (!found) {
    console.warn(`SKIP (not found): ${decision.puzzleId}`);
    rejected += 1;
    continue;
  }
  const check = validatePatches(found.puzzle, decision);
  if (!check.ok) {
    console.warn(`REJECT ${decision.puzzleId}: ${check.reason}`);
    rejected += 1;
    continue;
  }
  const patchedGroups = check.patched.map((g) => ({
    id: g.id,
    label: g.label,
    items: g.items,
  }));
  const patched = { ...found.puzzle, groups: patchedGroups };
  if (APPLY) {
    writeFileSync(found.path, JSON.stringify(patched, null, 2) + "\n");
  }
  applied += 1;
}

console.log(`\nApplied: ${applied} / rejected: ${rejected} / skipped: ${skipped}`);
if (!APPLY) {
  console.log("(dry-run by default — pass --apply to write files)");
}
