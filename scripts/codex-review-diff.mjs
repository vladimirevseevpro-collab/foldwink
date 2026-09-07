#!/usr/bin/env node
// Cross-check a batch of changes with GPT via codex CLI. Reads the current
// `git diff` against HEAD plus a short description of what the batch is
// supposed to accomplish, then asks codex to review for:
//   - correctness (does it do what it claims?)
//   - red-line compliance (CLAUDE.md §143-156)
//   - regressions / subtle bugs
//   - missed edge cases
// Structured JSON output.
//
// Usage:
//   node scripts/codex-review-diff.mjs --goal="brief description" [--out=path]

import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const args = new Map(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    return m ? [m[1], m[2] ?? "true"] : [a, "true"];
  }),
);
const GOAL = args.get("goal") ?? "unspecified batch";
const OUT = args.get("out") ?? join(ROOT, `logs/overnight/codex-review-${Date.now()}.json`);

mkdirSync(join(ROOT, "logs/overnight"), { recursive: true });

const diff = spawnSync("git", ["diff", "HEAD", "--stat"], { encoding: "utf8" }).stdout;
const fullDiff = spawnSync("git", ["diff", "HEAD"], {
  encoding: "utf8",
  maxBuffer: 32 * 1024 * 1024,
}).stdout;
const claudeMd = readFileSync(join(ROOT, "CLAUDE.md"), "utf8");

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["verdict", "findings", "summary"],
  properties: {
    verdict: { type: "string", enum: ["approve", "approve_with_changes", "reject"] },
    findings: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["type", "severity", "file", "issue", "suggestion"],
        properties: {
          type: {
            type: "string",
            enum: [
              "correctness",
              "red-line-violation",
              "regression-risk",
              "missed-edge-case",
              "code-quality",
              "test-gap",
            ],
          },
          severity: { type: "string", enum: ["high", "medium", "low"] },
          file: { type: "string" },
          issue: { type: "string" },
          suggestion: { type: "string" },
        },
      },
    },
    summary: { type: "string" },
  },
};

const schemaPath = join(ROOT, "logs/overnight/_review_schema.json");
writeFileSync(schemaPath, JSON.stringify(SCHEMA, null, 2));

const prompt = `# Code review — Foldwink batch: ${GOAL}

You are a strict senior reviewer. Review the diff below against the CLAUDE.md
rules (reproduced in full). Cite file:line for every finding.

Red lines you MUST flag as \`red-line-violation\` (severity: high):
- backend, auth, cloud sync, leaderboard
- FOMO, guilt streaks, variable-ratio rewards
- ads or premium in 1.0
- second mechanic beyond Foldwink Tabs + Wink
- motion / animation library imports
- 3D renderer

Otherwise, flag correctness bugs, regressions, missed edge cases, test
gaps, and quality issues. Do not nitpick style.

Return JSON matching the schema with a \`verdict\` (approve /
approve_with_changes / reject) and one-paragraph \`summary\`.

## CLAUDE.md

\`\`\`
${claudeMd}
\`\`\`

## Diff summary

\`\`\`
${diff}
\`\`\`

## Full diff

\`\`\`diff
${fullDiff}
\`\`\`
`;

const outMsg = join(ROOT, "logs/overnight/_review_last.txt");
const res = spawnSync(
  "codex",
  [
    "exec",
    "--sandbox",
    "read-only",
    "--skip-git-repo-check",
    "--output-schema",
    `"${schemaPath}"`,
    "-o",
    `"${outMsg}"`,
    "-",
  ],
  {
    encoding: "utf8",
    input: prompt,
    shell: true,
    maxBuffer: 64 * 1024 * 1024,
  },
);

if (res.status !== 0) {
  console.error(`codex failed (status ${res.status}): ${res.stderr?.slice(0, 500)}`);
  process.exit(1);
}

const raw = readFileSync(outMsg, "utf8");
const first = raw.indexOf("{");
const last = raw.lastIndexOf("}");
let payload;
try {
  payload = JSON.parse(first >= 0 ? raw.slice(first, last + 1) : raw);
} catch (err) {
  console.error(`parse failed: ${err.message}`);
  console.error(raw.slice(0, 1000));
  process.exit(1);
}

writeFileSync(OUT, JSON.stringify({ goal: GOAL, ...payload }, null, 2));

console.log(`verdict: ${payload.verdict}`);
console.log(`summary: ${payload.summary}`);
console.log(`findings: ${(payload.findings ?? []).length}`);
for (const f of payload.findings ?? []) {
  console.log(`  [${f.severity}/${f.type}] ${f.file}: ${f.issue}`);
}
console.log(`\nwrote ${OUT}`);

if (payload.verdict === "reject") process.exit(2);
if ((payload.findings ?? []).some((f) => f.severity === "high")) process.exit(1);
