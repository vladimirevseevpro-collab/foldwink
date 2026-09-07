#!/usr/bin/env node
// Phase B — GPT fairness audit across all puzzles via codex CLI.
//
// For each (language, tier) tuple, runs one codex exec call that hands the
// LLM every puzzle in that tier and asks it to flag fairness issues. The
// LLM output is constrained by a JSON schema so we can aggregate results
// cleanly.
//
// Calls are serial to respect ChatGPT session limits. The script is
// idempotent: each batch writes its own file under
// reports/puzzle_audit/phase_b_raw/<lang>-<tier>.json, and skips batches
// that already exist unless --force is passed.
//
// Usage:
//   node scripts/phase-b-gpt-audit.mjs                # all batches
//   node scripts/phase-b-gpt-audit.mjs --lang=ru      # one language
//   node scripts/phase-b-gpt-audit.mjs --tier=easy    # one tier
//   node scripts/phase-b-gpt-audit.mjs --force        # overwrite
//   node scripts/phase-b-gpt-audit.mjs --dry-run      # show batches only

import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();

const POOLS = [
  { lang: "en", dir: join(ROOT, "puzzles/pool") },
  { lang: "de", dir: join(ROOT, "puzzles/de/pool") },
  { lang: "ru", dir: join(ROOT, "puzzles/ru/pool") },
];
const TIERS = ["easy", "medium", "hard"];

const args = new Map(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    return m ? [m[1], m[2] ?? "true"] : [a, "true"];
  }),
);
const ONLY_LANG = args.get("lang");
const ONLY_TIER = args.get("tier");
const FORCE = args.get("force") === "true";
const DRY = args.get("dry-run") === "true";
const MAX_PER_BATCH = parseInt(args.get("batch-size") ?? "60", 10);

const OUT_DIR = join(ROOT, "reports/puzzle_audit/phase_b_raw");
mkdirSync(OUT_DIR, { recursive: true });
const SCHEMA_PATH = join(OUT_DIR, "_schema.json");
const PROMPT_TMP = join(OUT_DIR, "_last-prompt.md");

// OpenAI structured-output mode demands that `required` lists EVERY property
// in each object and that optional fields be declared nullable. So we mark
// items/groups/suggestedFix as "string or null" and include them in required.
const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["findings"],
  properties: {
    findings: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "puzzleId",
          "type",
          "severity",
          "explanation",
          "items",
          "groups",
          "suggestedFix",
        ],
        properties: {
          puzzleId: { type: "string" },
          type: {
            type: "string",
            enum: [
              "AMBIGUOUS_ITEM",
              "LABEL_OVERLAP",
              "SAME_SPECIES_SPLIT",
              "OBSCURE",
              "WRONG_TIER",
              "FACTUAL_ERROR",
              "TRIVIAL",
              "REDUNDANT_ITEMS",
              "CULTURAL_MISFIT",
              "OTHER",
            ],
          },
          severity: { type: "string", enum: ["high", "medium", "low"] },
          explanation: { type: "string" },
          items: {
            anyOf: [{ type: "array", items: { type: "string" } }, { type: "null" }],
          },
          groups: {
            anyOf: [{ type: "array", items: { type: "string" } }, { type: "null" }],
          },
          suggestedFix: {
            anyOf: [{ type: "string" }, { type: "null" }],
          },
        },
      },
    },
  },
};
writeFileSync(SCHEMA_PATH, JSON.stringify(SCHEMA, null, 2));

function loadPool({ lang: _lang, dir }) {
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort();
  const out = [];
  for (const f of files) {
    try {
      const p = JSON.parse(readFileSync(join(dir, f), "utf8"));
      if (p.groups && p.groups.length === 4) out.push(p);
    } catch {}
  }
  return out;
}

function formatPuzzle(p) {
  const lines = [`### ${p.id} (${p.difficulty})  title: ${p.title}`];
  for (const g of p.groups) {
    lines.push(`- ${g.label}: ${g.items.join(", ")}`);
  }
  return lines.join("\n");
}

function buildPrompt(lang, tier, puzzles, batchIndex, batchTotal) {
  const langName = { en: "English", de: "German", ru: "Russian" }[lang];
  const tierNotes = {
    easy: "concrete, everyday categories; labels should be single-concept.",
    medium:
      "may include wordplay, shared prefix/suffix, or thematic links; must still be solvable without specialist knowledge.",
    hard: "may include abstract or niche categories; fairness still required — ambiguity is the failure mode.",
  };
  return `# Foldwink fairness audit — ${langName} / ${tier} (batch ${batchIndex + 1}/${batchTotal})

You are an editorial reviewer for the Foldwink 4×4 grouping puzzle.
Each puzzle has 16 items in 4 groups of 4. The player selects 4 items and
submits them; correct → group solved; 4 mistakes → loss. Fairness means:
**every item must unambiguously belong to exactly one of the 4 listed
categories**, and the 4 categories together must not semantically overlap.

Tier expectation for ${tier}: ${tierNotes[tier] ?? ""}

## Your task

Review every puzzle below and flag any fairness issue you find. Be strict
but fair — do NOT flag parallel-sibling labels (e.g. "Chess Terms" vs
"Poker Terms") as overlap; they are deliberately parallel and OK.

## Issue types

- AMBIGUOUS_ITEM: an item could reasonably belong to two of the listed
  categories.
- LABEL_OVERLAP: two category labels describe conceptually nested or
  overlapping domains (e.g. "домашний скот" vs "мелкий скот" — small
  livestock is a subset of domestic livestock).
- SAME_SPECIES_SPLIT: items are the same species/identity split by
  sex/age (овца/баран, курица/петух, Henne/Hahn).
- OBSCURE: item is too obscure for the tier.
- WRONG_TIER: puzzle's difficulty is badly mis-calibrated.
- FACTUAL_ERROR: item placed in a category where it doesn't belong.
- TRIVIAL: category is keyword-match with an item (e.g. category
  "Red things" containing item "Red Apple").
- REDUNDANT_ITEMS: two items are synonyms or near-duplicates.
- CULTURAL_MISFIT: item is culturally foreign to the pool language in a
  way that confuses the target audience.
- OTHER: anything else worth editorial attention.

Severity:
- high: unfair; puzzle should not ship as-is.
- medium: sub-optimal; reviewer should consider a fix.
- low: nit; noted but not blocking.

Output JSON matching the provided schema. Empty \`findings\` array if
there are no issues.

## Puzzles

${puzzles.map(formatPuzzle).join("\n\n")}
`;
}

function runCodex(prompt, outSchemaPath, outLastMsgPath) {
  writeFileSync(PROMPT_TMP, prompt);
  // On Windows `codex` is a .cmd shim — spawn needs shell:true to resolve
  // the PATHEXT. Pass the prompt via stdin (the `-` positional arg is
  // codex's explicit "read from stdin" sentinel) so we don't blow the
  // Windows command-line length limit with 60-puzzle prompts.
  const result = spawnSync(
    "codex",
    [
      "exec",
      "--sandbox",
      "read-only",
      "--skip-git-repo-check",
      "--output-schema",
      `"${outSchemaPath}"`,
      "-o",
      `"${outLastMsgPath}"`,
      "-",
    ],
    {
      encoding: "utf8",
      input: prompt,
      shell: true,
      maxBuffer: 64 * 1024 * 1024,
    },
  );
  return result;
}

// ChatGPT Plus caps codex exec at ~20 calls per rolling window, then
// returns "You've hit your usage limit" in the stdout pre-lastMsg
// content. When we see that, wait for the window to reset and retry
// the same batch.
function detectQuotaExhaustion(res) {
  const blob = (res.stdout ?? "") + (res.stderr ?? "");
  return /hit your usage limit|usage limit|Upgrade to Pro/i.test(blob);
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function runCodexWithRetry(prompt, outSchemaPath, outLastMsgPath, label) {
  const QUOTA_SLEEP_MIN = 65; // codex says "try again at X:05"; give 5 min buffer
  for (let attempt = 1; attempt <= 12; attempt++) {
    const res = runCodex(prompt, outSchemaPath, outLastMsgPath);
    if (res.status === 0) return res;
    if (detectQuotaExhaustion(res)) {
      console.warn(
        `${label}: QUOTA HIT on attempt ${attempt}; sleeping ${QUOTA_SLEEP_MIN} min before retry...`,
      );
      await sleep(QUOTA_SLEEP_MIN * 60 * 1000);
      continue;
    }
    // Non-quota failure — shorter backoff, likely transient network.
    if (attempt < 4) {
      console.warn(`${label}: transient failure (status ${res.status}); retrying in 30s`);
      await sleep(30_000);
      continue;
    }
    return res;
  }
  return { status: 1, stderr: "retry limit reached", stdout: "" };
}

function batchPuzzles(puzzles, size) {
  const out = [];
  for (let i = 0; i < puzzles.length; i += size) out.push(puzzles.slice(i, i + size));
  return out;
}

let total = 0;
let done = 0;
let skipped = 0;
let failed = 0;

for (const pool of POOLS) {
  if (ONLY_LANG && pool.lang !== ONLY_LANG) continue;
  const all = loadPool(pool);
  for (const tier of TIERS) {
    if (ONLY_TIER && tier !== ONLY_TIER) continue;
    const puzzles = all.filter((p) => p.difficulty === tier);
    if (puzzles.length === 0) continue;
    const batches = batchPuzzles(puzzles, MAX_PER_BATCH);
    for (let i = 0; i < batches.length; i++) {
      total += 1;
      const outFile = join(
        OUT_DIR,
        `${pool.lang}-${tier}-b${String(i + 1).padStart(2, "0")}.json`,
      );
      const lastMsgFile = outFile.replace(/\.json$/, ".txt");
      const exists = existsSync(outFile);
      const label = `[${pool.lang}/${tier}] batch ${i + 1}/${batches.length} (${batches[i].length} puzzles)`;
      if (exists && !FORCE) {
        console.log(`${label}: skip (exists)`);
        skipped += 1;
        continue;
      }
      if (DRY) {
        console.log(`${label}: would run`);
        continue;
      }
      console.log(`${label}: running codex...`);
      const prompt = buildPrompt(pool.lang, tier, batches[i], i, batches.length);
      const t0 = Date.now();
      const res = await runCodexWithRetry(prompt, SCHEMA_PATH, lastMsgFile, label);
      const elapsed = Math.round((Date.now() - t0) / 1000);
      if (res.status !== 0) {
        console.error(
          `${label}: codex FAILED after ${elapsed}s (status ${res.status}):\n${res.stderr?.slice(0, 500)}`,
        );
        failed += 1;
        continue;
      }
      let payload;
      try {
        const raw = readFileSync(lastMsgFile, "utf8").trim();
        const firstBrace = raw.indexOf("{");
        const lastBrace = raw.lastIndexOf("}");
        const jsonSlice = firstBrace >= 0 ? raw.slice(firstBrace, lastBrace + 1) : raw;
        payload = JSON.parse(jsonSlice);
      } catch (err) {
        console.error(
          `${label}: unable to parse codex output (${err.message}); raw kept at ${lastMsgFile}`,
        );
        failed += 1;
        continue;
      }
      writeFileSync(
        outFile,
        JSON.stringify(
          {
            lang: pool.lang,
            tier,
            batchIndex: i,
            batchTotal: batches.length,
            puzzleIds: batches[i].map((p) => p.id),
            elapsedSec: elapsed,
            findings: payload.findings ?? [],
          },
          null,
          2,
        ),
      );
      console.log(`${label}: OK in ${elapsed}s — ${payload.findings?.length ?? 0} findings`);
      done += 1;
    }
  }
}

console.log(`\nPhase B done. batches=${total} ran=${done} skipped=${skipped} failed=${failed}`);
