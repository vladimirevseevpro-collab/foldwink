#!/usr/bin/env node
// Phase A — deep local static audit across all three pools (en/de/ru).
// Produces a single structured JSON report of every signal we can catch
// without involving an LLM. Signals are intended as INPUTS for cross-check
// with GPT (phase B) and Claude (phase C), not as final verdicts.
//
// Checks performed per puzzle:
//   1. PAIR_SPLIT         — items from the overlap_pairs seed sit in
//                            different groups (e.g. овца/баран).
//   2. DUP_ITEM            — same item string in two groups.
//   3. LABEL_OVERLAP       — two group labels share a meaningful token
//                            (e.g. "домашний скот" / "мелкий скот").
//   4. SHORT_ITEM          — items ≤ 2 chars on non-wordplay puzzles.
//   5. CROSS_PUZZLE_REP    — item appears identically in multiple puzzles
//                            of the same language/tier (flag for editorial).
//   6. MISSING_META        — no categoryType / theme fields.
//
// Output: reports/puzzle_audit/phase_a_claude_static.json

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

const STOPWORDS = {
  en: new Set(["the", "a", "an", "of", "for", "in", "to", "and", "or", "with"]),
  de: new Set(["der", "die", "das", "ein", "eine", "von", "und", "oder", "mit", "im", "am"]),
  ru: new Set(["и", "в", "на", "с", "по", "для", "из", "о"]),
};

const norm = (s) => s.trim().toLowerCase().replace(/ё/g, "е");

function tokenize(label, lang) {
  const tokens = label
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]+/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
  const stops = STOPWORDS[lang] ?? new Set();
  return new Set(tokens.filter((t) => !stops.has(t) && t.length >= 3));
}

function loadPool({ lang, dir }) {
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort();
  const out = [];
  for (const f of files) {
    try {
      const p = JSON.parse(readFileSync(join(dir, f), "utf8"));
      if (p.groups && p.groups.length === 4) out.push({ ...p, __file: f, __lang: lang });
    } catch {}
  }
  return out;
}

const findings = [];

function pushFinding(lang, puzzleId, type, severity, detail, extra = {}) {
  findings.push({ lang, puzzleId, type, severity, detail, ...extra });
}

function checkPairSplit(puzzle, lang) {
  const langPairs = PAIRS[lang] ?? [];
  const locations = new Map();
  for (const group of puzzle.groups) {
    for (const item of group.items) {
      locations.set(norm(item), {
        raw: item,
        groupId: group.id,
        groupLabel: group.label,
      });
    }
  }
  for (const { pair, reason } of langPairs) {
    const [a, b] = pair.map(norm);
    const la = locations.get(a);
    const lb = locations.get(b);
    if (!la || !lb || la.groupId === lb.groupId) continue;
    pushFinding(lang, puzzle.id, "PAIR_SPLIT", "high", reason, {
      items: [la.raw, lb.raw],
      groups: [la.groupLabel, lb.groupLabel],
    });
  }
}

function checkDupItem(puzzle, lang) {
  const seen = new Map();
  for (const g of puzzle.groups) {
    for (const item of g.items) {
      const k = norm(item);
      if (seen.has(k) && seen.get(k).groupId !== g.id) {
        pushFinding(lang, puzzle.id, "DUP_ITEM", "high", "same item in two groups", {
          item,
          groups: [seen.get(k).groupLabel, g.label],
        });
      }
      seen.set(k, { groupId: g.id, groupLabel: g.label });
    }
  }
}

function checkLabelOverlap(puzzle, lang) {
  const tokenized = puzzle.groups.map((g) => ({
    id: g.id,
    label: g.label,
    tokens: tokenize(g.label, lang),
  }));
  for (let i = 0; i < tokenized.length; i++) {
    for (let j = i + 1; j < tokenized.length; j++) {
      const a = tokenized[i];
      const b = tokenized[j];
      const shared = [...a.tokens].filter((t) => b.tokens.has(t));
      if (shared.length === 0) continue;
      // Severity: high if one label's meaningful-token set is a subset of
      // the other (classic "мелкий скот" ⊂ "домашний скот" shape).
      const smaller = a.tokens.size <= b.tokens.size ? a.tokens : b.tokens;
      const other = smaller === a.tokens ? b.tokens : a.tokens;
      const isSubset = smaller.size > 0 && [...smaller].every((t) => other.has(t));
      const severity = isSubset ? "high" : "medium";
      pushFinding(lang, puzzle.id, "LABEL_OVERLAP", severity, "labels share tokens", {
        labels: [a.label, b.label],
        sharedTokens: shared,
        subset: isSubset,
      });
    }
  }
}

function checkShortItem(puzzle, lang) {
  if (puzzle.meta?.categoryType === "wordplay" || puzzle.meta?.wordplay) return;
  for (const g of puzzle.groups) {
    for (const item of g.items) {
      if (item.trim().length <= 2) {
        pushFinding(
          lang,
          puzzle.id,
          "SHORT_ITEM",
          "low",
          "item ≤ 2 chars on non-wordplay puzzle",
          { item, group: g.label },
        );
      }
    }
  }
}

function checkMissingMeta(puzzle, lang) {
  if (!puzzle.meta) {
    pushFinding(lang, puzzle.id, "MISSING_META", "low", "no meta block");
    return;
  }
  if (!puzzle.meta.categoryType)
    pushFinding(lang, puzzle.id, "MISSING_META", "low", "no categoryType");
  if (!puzzle.meta.theme) pushFinding(lang, puzzle.id, "MISSING_META", "low", "no theme");
}

function checkCrossPuzzleRepetition(pool, lang) {
  const byTier = { easy: new Map(), medium: new Map(), hard: new Map() };
  for (const p of pool) {
    const bucket = byTier[p.difficulty];
    if (!bucket) continue;
    for (const g of p.groups) {
      for (const item of g.items) {
        const k = norm(item);
        if (!bucket.has(k)) bucket.set(k, []);
        bucket.get(k).push({ id: p.id, group: g.label, raw: item });
      }
    }
  }
  for (const [tier, bucket] of Object.entries(byTier)) {
    for (const [, locs] of bucket) {
      if (locs.length < 2) continue;
      // A word like "red" or "mars" can legitimately appear in many
      // puzzles. Only flag when the same item repeats under the same
      // group-label → likely accidental copy-paste.
      const byLabel = new Map();
      for (const l of locs) {
        if (!byLabel.has(l.group)) byLabel.set(l.group, []);
        byLabel.get(l.group).push(l.id);
      }
      for (const [groupLabel, ids] of byLabel) {
        if (ids.length < 2) continue;
        pushFinding(
          lang,
          ids[0],
          "CROSS_PUZZLE_REP",
          "low",
          `item "${locs[0].raw}" appears in "${groupLabel}" in ${ids.length} ${tier} puzzles`,
          { tier, item: locs[0].raw, group: groupLabel, puzzleIds: ids },
        );
      }
    }
  }
}

for (const pool of POOLS) {
  const puzzles = loadPool(pool);
  console.log(`[${pool.lang}] loaded ${puzzles.length} puzzles`);
  for (const p of puzzles) {
    checkPairSplit(p, pool.lang);
    checkDupItem(p, pool.lang);
    checkLabelOverlap(p, pool.lang);
    checkShortItem(p, pool.lang);
    checkMissingMeta(p, pool.lang);
  }
  checkCrossPuzzleRepetition(puzzles, pool.lang);
}

findings.sort((a, b) => {
  const sev = { high: 0, medium: 1, low: 2 };
  if (sev[a.severity] !== sev[b.severity]) return sev[a.severity] - sev[b.severity];
  if (a.lang !== b.lang) return a.lang.localeCompare(b.lang);
  return a.puzzleId.localeCompare(b.puzzleId);
});

const counts = {};
for (const f of findings) {
  const k = `${f.type}:${f.severity}`;
  counts[k] = (counts[k] ?? 0) + 1;
}

const out = {
  generatedAt: new Date().toISOString(),
  total: findings.length,
  counts,
  findings,
};

writeFileSync(
  join(ROOT, "reports/puzzle_audit/phase_a_claude_static.json"),
  JSON.stringify(out, null, 2),
);

console.log(`\nTotal findings: ${findings.length}`);
for (const [k, v] of Object.entries(counts).sort()) console.log(`  ${k}: ${v}`);
