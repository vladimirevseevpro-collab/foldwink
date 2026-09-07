#!/usr/bin/env node
// Phase C — Claude cross-verification of phase B findings.
//
// Philosophy: Phase B (GPT) is a creative scout — it finds real issues
// but also hallucinates. Claude's role here is the skeptical verifier.
// For each finding we do whatever programmatic check we can; for subjective
// claims we leave the finding marked "needs-claude-review" so a later
// manual/agent pass can read the puzzle and judge.
//
// Programmatic checks performed:
//   FACTUAL_ERROR with substring claim: if the explanation or items suggest
//     "X does not contain Y", we actually check substring containment.
//   SAME_SPECIES_SPLIT: look up the pair in the overlap_pairs seed and
//     confirm both items really are in different groups.
//   DUPLICATE_CHECK (synthesized): detect exact-string item duplicates in
//     the same puzzle.
//   LABEL_OVERLAP: compute token-set relationship (subset / overlap / none)
//     as auxiliary signal.
//
// Subjective checks (AMBIGUOUS_ITEM, OBSCURE, WRONG_TIER, TRIVIAL,
// CULTURAL_MISFIT, REDUNDANT_ITEMS, OTHER): emit verdict "needs-claude-review".
//
// Output: reports/puzzle_audit/phase_c_claude_verifications.json

import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

const POOL_DIRS = {
  en: join(ROOT, "puzzles/pool"),
  de: join(ROOT, "puzzles/de/pool"),
  ru: join(ROOT, "puzzles/ru/pool"),
};

const OVERLAP_PAIRS = JSON.parse(
  readFileSync(join(ROOT, "reports/puzzle_audit/overlap_pairs.json"), "utf8"),
);

const PHASE_B_DIR = join(ROOT, "reports/puzzle_audit/phase_b_raw");

const norm = (s) => s.trim().toLowerCase().replace(/ё/g, "е");

function loadPuzzle(lang, id) {
  const dir = POOL_DIRS[lang];
  if (!dir) return null;
  const files = readdirSync(dir).filter((f) => f.endsWith(".json"));
  for (const f of files) {
    try {
      const p = JSON.parse(readFileSync(join(dir, f), "utf8"));
      if (p.id === id) return p;
    } catch {}
  }
  return null;
}

function puzzleItems(p) {
  const out = [];
  for (const g of p.groups) {
    for (const item of g.items) out.push({ item, group: g.label, groupId: g.id });
  }
  return out;
}

function verifySubstringClaim(puzzle, finding) {
  // Look for a claim like "X does not contain Y" in the explanation.
  // This covers the "locate doesn't contain CAT" hallucination case.
  const expl = finding.explanation ?? "";
  const re =
    /["“]?([A-Za-zА-Яа-яÄÖÜäöüß-]+)["”]?\s+does\s+not\s+contain\s+["“]?([A-Za-zА-Яа-яÄÖÜäöüß]+)["”]?/gi;
  const matches = [...expl.matchAll(re)];
  if (matches.length === 0) return null;
  const results = [];
  for (const m of matches) {
    const word = m[1];
    const target = m[2];
    const contains = word.toLowerCase().includes(target.toLowerCase());
    results.push({
      claim: `"${word}" does not contain "${target}"`,
      actuallyContains: contains,
      gptCorrect: !contains,
    });
  }
  return results;
}

function verifySameSpeciesSplit(puzzle, finding, lang) {
  const items = finding.items ?? [];
  if (items.length < 2) return { status: "unverifiable", reason: "no items listed" };
  const locations = new Map();
  for (const { item, group, groupId } of puzzleItems(puzzle)) {
    locations.set(norm(item), { item, group, groupId });
  }
  const [a, b] = items.slice(0, 2).map(norm);
  const la = locations.get(a);
  const lb = locations.get(b);
  if (!la || !lb) return { status: "unverifiable", reason: "item not found in puzzle" };
  if (la.groupId === lb.groupId)
    return { status: "refuted", reason: "items are in the same group" };
  // Check if the pair is a known same-species pair
  const langPairs = OVERLAP_PAIRS[lang] ?? [];
  for (const { pair } of langPairs) {
    const [pa, pb] = pair.map(norm);
    if ((pa === a && pb === b) || (pa === b && pb === a)) {
      return { status: "confirmed-known", reason: "listed in overlap_pairs seed" };
    }
  }
  return {
    status: "confirmed-unknown",
    reason: "items are in different groups; species relation not in seed — needs review",
  };
}

function verifyDuplicateItems(puzzle) {
  const seen = new Map();
  const dups = [];
  for (const { item, groupId } of puzzleItems(puzzle)) {
    const k = norm(item);
    if (seen.has(k) && seen.get(k) !== groupId) dups.push({ item, groupId });
    seen.set(k, groupId);
  }
  return dups;
}

function analyzeLabelOverlap(puzzle, finding) {
  const labels = finding.groups ?? [];
  if (labels.length < 2) return { status: "unverifiable" };
  const tokenize = (l) =>
    new Set(
      l
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]+/gu, " ")
        .split(/\s+/)
        .filter((t) => t.length >= 3),
    );
  const ta = tokenize(labels[0]);
  const tb = tokenize(labels[1]);
  const shared = [...ta].filter((t) => tb.has(t));
  const subsetAtoB = [...ta].every((t) => tb.has(t));
  const subsetBtoA = [...tb].every((t) => ta.has(t));
  return {
    sharedTokens: shared,
    lexicalSubset: subsetAtoB || subsetBtoA,
    note:
      subsetAtoB || subsetBtoA
        ? "one label's meaningful tokens are subset of the other — likely semantic overlap"
        : shared.length > 0
          ? "labels share tokens but neither is subset — could be parallel-sibling (usually OK)"
          : "no lexical overlap — semantic-only claim; needs-claude-review",
  };
}

function processFinding(finding, lang, puzzleCache) {
  let puzzle = puzzleCache.get(finding.puzzleId);
  if (!puzzle) {
    puzzle = loadPuzzle(lang, finding.puzzleId);
    if (puzzle) puzzleCache.set(finding.puzzleId, puzzle);
  }
  if (!puzzle) {
    return { verdict: "unverifiable", reason: "puzzle not found" };
  }

  const checks = {};
  const substr = verifySubstringClaim(puzzle, finding);
  if (substr) checks.substring = substr;

  const dups = verifyDuplicateItems(puzzle);
  if (dups.length > 0) checks.duplicatesDetected = dups;

  if (finding.type === "SAME_SPECIES_SPLIT") {
    checks.speciesSplit = verifySameSpeciesSplit(puzzle, finding, lang);
  }

  if (finding.type === "LABEL_OVERLAP") {
    checks.labelOverlap = analyzeLabelOverlap(puzzle, finding);
  }

  let verdict;
  if (checks.substring) {
    const hallucinated = checks.substring.some((r) => !r.gptCorrect);
    verdict = hallucinated ? "refuted" : "confirmed";
  } else if (finding.type === "SAME_SPECIES_SPLIT") {
    verdict = checks.speciesSplit.status.startsWith("confirmed")
      ? "confirmed"
      : checks.speciesSplit.status;
  } else if (finding.type === "LABEL_OVERLAP") {
    verdict = checks.labelOverlap.lexicalSubset ? "confirmed-lexical" : "needs-claude-review";
  } else if (
    [
      "AMBIGUOUS_ITEM",
      "OBSCURE",
      "WRONG_TIER",
      "TRIVIAL",
      "CULTURAL_MISFIT",
      "REDUNDANT_ITEMS",
      "FACTUAL_ERROR",
      "OTHER",
    ].includes(finding.type)
  ) {
    verdict = "needs-claude-review";
  } else {
    verdict = "needs-claude-review";
  }

  return { verdict, checks };
}

const batches = readdirSync(PHASE_B_DIR)
  .filter((f) => /^[a-z]{2}-(easy|medium|hard)-b\d+\.json$/.test(f))
  .sort();

const allFindings = [];
const byLang = new Map();
for (const f of batches) {
  const batch = JSON.parse(readFileSync(join(PHASE_B_DIR, f), "utf8"));
  for (const finding of batch.findings ?? []) {
    allFindings.push({ ...finding, __lang: batch.lang, __tier: batch.tier, __batchFile: f });
  }
  if (!byLang.has(batch.lang)) byLang.set(batch.lang, new Map());
}

console.log(`Loaded ${allFindings.length} GPT findings across ${batches.length} batches.`);

const puzzleCache = new Map();
const verdicts = [];
const counts = {
  confirmed: 0,
  "confirmed-lexical": 0,
  "confirmed-known": 0,
  "confirmed-unknown": 0,
  refuted: 0,
  "needs-claude-review": 0,
  unverifiable: 0,
};

for (const f of allFindings) {
  const result = processFinding(f, f.__lang, puzzleCache);
  counts[result.verdict] = (counts[result.verdict] ?? 0) + 1;
  verdicts.push({
    lang: f.__lang,
    tier: f.__tier,
    puzzleId: f.puzzleId,
    gptType: f.type,
    gptSeverity: f.severity,
    gptExplanation: f.explanation,
    gptItems: f.items,
    gptGroups: f.groups,
    gptSuggestedFix: f.suggestedFix,
    claudeVerdict: result.verdict,
    claudeChecks: result.checks,
    batchFile: f.__batchFile,
  });
}

writeFileSync(
  join(ROOT, "reports/puzzle_audit/phase_c_claude_verifications.json"),
  JSON.stringify(
    { generatedAt: new Date().toISOString(), total: verdicts.length, counts, verdicts },
    null,
    2,
  ),
);

console.log("\nVerdicts:");
for (const [k, v] of Object.entries(counts).sort()) console.log(`  ${k}: ${v}`);
console.log("\nWrote phase_c_claude_verifications.json");
