#!/usr/bin/env node
// Phase E — GPT perceived-difficulty rating per puzzle.
//
// Rather than ask GPT to return a full ordering of 300+ puzzles (which
// blows context and loses precision mid-list), we ask for an integer
// 1–100 "perceived difficulty" per puzzle inside the given tier. We
// blend this with the S1 heuristic score to produce the final
// editorialRank written to meta.editorialRank.
//
// One (lang, tier) runs as batches of 60 puzzles, same infrastructure
// as Phase B. Files live in reports/puzzle_audit/phase_e_raw/.
//
// Usage:
//   node scripts/phase-e-gpt-ranking.mjs [--lang=ru] [--tier=easy] [--force]

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
const MAX_PER_BATCH = 60;

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

const OUT_DIR = join(ROOT, "reports/puzzle_audit/phase_e_raw");
mkdirSync(OUT_DIR, { recursive: true });
const SCHEMA_PATH = join(OUT_DIR, "_schema.json");

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["ratings"],
  properties: {
    ratings: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["puzzleId", "difficulty", "rationale"],
        properties: {
          puzzleId: { type: "string" },
          difficulty: { type: "integer", minimum: 1, maximum: 100 },
          rationale: { type: "string" },
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
  const lines = [`### ${p.id}  title: ${p.title}`];
  for (const g of p.groups) lines.push(`- ${g.label}: ${g.items.join(", ")}`);
  return lines.join("\n");
}

function buildPrompt(lang, tier, puzzles, batchIndex, batchTotal) {
  const langName = { en: "English", de: "German", ru: "Russian" }[lang];
  const tierNotes = {
    easy: "concrete everyday categories",
    medium: "thematic links or light wordplay",
    hard: "abstract or niche categories",
  };
  return `# Foldwink within-tier difficulty rating — ${langName} / ${tier} (batch ${batchIndex + 1}/${batchTotal})

You are rating how difficult each puzzle feels for a typical player
**within** the ${tier} tier (${tierNotes[tier] ?? ""}). Rate every puzzle
on a 1–100 scale where:

- 1–25: easiest inside this tier (very familiar items, obvious distinct
  categories, no real false trails).
- 26–50: comfortable mid-tier.
- 51–75: noticeably trickier than average for the tier.
- 76–100: hardest for the tier (subtle categories, strong false-trails,
  cultural or linguistic precision required).

Do NOT re-rate relative to other tiers — stay inside this tier's scale.
Ratings should SPREAD across the range; do not cluster everything near 50.

For each puzzle return a one-sentence rationale focused on what drives
the difficulty (abstraction, false trails, obscurity, wordplay, etc.).

Output JSON matching the schema. Include a rating for EVERY puzzle listed.

## Puzzles

${puzzles.map(formatPuzzle).join("\n\n")}
`;
}

function runCodex(prompt, outSchemaPath, outLastMsgPath) {
  return spawnSync(
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
}

function detectQuotaExhaustion(res) {
  const blob = (res.stdout ?? "") + (res.stderr ?? "");
  return /hit your usage limit|usage limit|Upgrade to Pro/i.test(blob);
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function runCodexWithRetry(prompt, outSchemaPath, outLastMsgPath, label) {
  const QUOTA_SLEEP_MIN = 65;
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
      const label = `[${pool.lang}/${tier}] E batch ${i + 1}/${batches.length} (${batches[i].length})`;
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
        const slice = firstBrace >= 0 ? raw.slice(firstBrace, lastBrace + 1) : raw;
        payload = JSON.parse(slice);
      } catch (err) {
        console.error(`${label}: parse failed (${err.message})`);
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
            elapsedSec: elapsed,
            ratings: payload.ratings ?? [],
          },
          null,
          2,
        ),
      );
      console.log(`${label}: OK in ${elapsed}s — ${payload.ratings?.length ?? 0} ratings`);
      done += 1;
    }
  }
}

console.log(`\nPhase E done. batches=${total} ran=${done} skipped=${skipped} failed=${failed}`);
