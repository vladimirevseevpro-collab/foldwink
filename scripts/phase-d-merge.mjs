#!/usr/bin/env node
// Phase D — merge phase A (static) + phase B (GPT) + phase C (verification)
// into a single prioritised report and apply-queue.
//
// Priority rules:
//   - confirmed (programmatic) + severity:high → HIGH_AUTO
//   - confirmed-known / confirmed-lexical + severity:high → HIGH_AUTO
//   - refuted (GPT hallucinated) → drop with note in report
//   - needs-claude-review + severity:high → HIGH_REVIEW
//   - any severity:medium / low → MEDIUM_NOTE / LOW_NOTE
//
// Output:
//   reports/puzzle_audit/MERGED_AUDIT_REPORT.md
//   reports/puzzle_audit/APPLY_QUEUE.json (items in HIGH_AUTO + HIGH_REVIEW)

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const AUDIT_DIR = join(ROOT, "reports/puzzle_audit");

const phaseA = JSON.parse(readFileSync(join(AUDIT_DIR, "phase_a_claude_static.json"), "utf8"));
const phaseC = JSON.parse(
  readFileSync(join(AUDIT_DIR, "phase_c_claude_verifications.json"), "utf8"),
);

const buckets = {
  HIGH_AUTO: [],
  HIGH_REVIEW: [],
  MEDIUM_NOTE: [],
  LOW_NOTE: [],
  DROPPED_REFUTED: [],
};

for (const v of phaseC.verdicts) {
  const item = {
    lang: v.lang,
    tier: v.tier,
    puzzleId: v.puzzleId,
    type: v.gptType,
    severity: v.gptSeverity,
    explanation: v.gptExplanation,
    items: v.gptItems,
    groups: v.gptGroups,
    suggestedFix: v.gptSuggestedFix,
    claudeVerdict: v.claudeVerdict,
    checks: v.claudeChecks,
  };
  const confirmed =
    v.claudeVerdict === "confirmed" ||
    v.claudeVerdict === "confirmed-known" ||
    v.claudeVerdict === "confirmed-lexical" ||
    v.claudeVerdict === "confirmed-unknown";
  if (v.claudeVerdict === "refuted") {
    buckets.DROPPED_REFUTED.push(item);
  } else if (confirmed && v.gptSeverity === "high") {
    buckets.HIGH_AUTO.push(item);
  } else if (v.gptSeverity === "high") {
    buckets.HIGH_REVIEW.push(item);
  } else if (v.gptSeverity === "medium") {
    buckets.MEDIUM_NOTE.push(item);
  } else {
    buckets.LOW_NOTE.push(item);
  }
}

// Phase A signal: static-only findings that phase B might have missed.
const staticOnly = {
  PAIR_SPLIT: 0,
  DUP_ITEM: 0,
  LABEL_OVERLAP_high: 0,
  SHORT_ITEM: 0,
  MISSING_META: 0,
  CROSS_PUZZLE_REP: 0,
};
for (const f of phaseA.findings) {
  const k = f.type === "LABEL_OVERLAP" && f.severity === "high" ? "LABEL_OVERLAP_high" : f.type;
  if (staticOnly[k] !== undefined) staticOnly[k] += 1;
}

function groupByLang(items) {
  const m = new Map();
  for (const it of items) {
    if (!m.has(it.lang)) m.set(it.lang, []);
    m.get(it.lang).push(it);
  }
  return m;
}

function renderSection(title, items) {
  const lines = [`## ${title} — ${items.length}`];
  if (items.length === 0) {
    lines.push("_none_");
    return lines.join("\n");
  }
  const byLang = groupByLang(items);
  for (const [lang, arr] of [...byLang.entries()].sort()) {
    lines.push(`\n### ${lang.toUpperCase()} (${arr.length})`);
    for (const it of arr) {
      lines.push(
        `\n- **${it.puzzleId}** (${it.tier}) — \`${it.type}\` [${it.severity}] → verdict: \`${it.claudeVerdict}\``,
      );
      lines.push(`  - ${it.explanation}`);
      if (it.items?.length) lines.push(`  - items: ${it.items.join(", ")}`);
      if (it.groups?.length) lines.push(`  - groups: ${it.groups.join(" | ")}`);
      if (it.suggestedFix) lines.push(`  - fix: ${it.suggestedFix}`);
      if (it.checks?.substring) {
        for (const s of it.checks.substring) {
          lines.push(
            `  - check: ${s.claim} → GPT ${s.gptCorrect ? "correct" : "**hallucinated**"}`,
          );
        }
      }
    }
  }
  return lines.join("\n");
}

const md = [
  "# Foldwink — Merged audit report",
  "",
  `Generated: ${new Date().toISOString()}`,
  "",
  "Sources: phase A (local static), phase B (GPT audit via codex), phase C (Claude programmatic verification).",
  "",
  "## Summary",
  "",
  `- HIGH_AUTO (confirmed + high severity): **${buckets.HIGH_AUTO.length}**`,
  `- HIGH_REVIEW (subjective + high severity, needs human): **${buckets.HIGH_REVIEW.length}**`,
  `- MEDIUM_NOTE: ${buckets.MEDIUM_NOTE.length}`,
  `- LOW_NOTE: ${buckets.LOW_NOTE.length}`,
  `- DROPPED_REFUTED (GPT hallucinations caught by Claude): ${buckets.DROPPED_REFUTED.length}`,
  "",
  "## Static-only signals (phase A)",
  "",
  ...Object.entries(staticOnly).map(([k, v]) => `- ${k}: ${v}`),
  "",
  renderSection("HIGH_AUTO — apply queue candidates", buckets.HIGH_AUTO),
  "",
  renderSection("HIGH_REVIEW — human decision needed", buckets.HIGH_REVIEW),
  "",
  renderSection("DROPPED_REFUTED — GPT claims Claude refuted", buckets.DROPPED_REFUTED),
  "",
  `## Medium + low notes`,
  "",
  `See \`MERGED_AUDIT_REPORT.json\` companion file for full detail (${buckets.MEDIUM_NOTE.length + buckets.LOW_NOTE.length} items).`,
  "",
].join("\n");

writeFileSync(join(AUDIT_DIR, "MERGED_AUDIT_REPORT.md"), md);
writeFileSync(
  join(AUDIT_DIR, "MERGED_AUDIT_REPORT.json"),
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      staticOnly,
      buckets,
    },
    null,
    2,
  ),
);

writeFileSync(
  join(AUDIT_DIR, "APPLY_QUEUE.json"),
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      items: buckets.HIGH_AUTO,
    },
    null,
    2,
  ),
);

console.log(`HIGH_AUTO:      ${buckets.HIGH_AUTO.length}`);
console.log(`HIGH_REVIEW:    ${buckets.HIGH_REVIEW.length}`);
console.log(`MEDIUM_NOTE:    ${buckets.MEDIUM_NOTE.length}`);
console.log(`LOW_NOTE:       ${buckets.LOW_NOTE.length}`);
console.log(`DROPPED_REFUTED:${buckets.DROPPED_REFUTED.length}`);
console.log(`\nWrote MERGED_AUDIT_REPORT.md + .json and APPLY_QUEUE.json`);
