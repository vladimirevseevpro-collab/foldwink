/**
 * Content-logic audit for curated Foldwink pools.
 *
 * This is deliberately a reviewer aid, not an automatic rejection engine.
 * It catches recurring structural risks that schema validation cannot see:
 * adult/young animal pairs, parent/child pairs split across categories,
 * overlapping group labels, and labels too vague to make a fair grouping.
 *
 * Run: node scripts/audit-puzzle-logic.mjs
 */

import fs from "node:fs";
import path from "node:path";

const POOLS = [
  { key: "en", dir: "puzzles/pool" },
  { key: "ru", dir: "puzzles/ru/pool" },
  { key: "de", dir: "puzzles/de/pool" },
];
const REPORT_PATH = "docs/reports/FOLDWINK_CONTENT_LOGIC_AUDIT.md";

const RELATION_PAIRS = [
  ["cow", "calf"],
  ["bull", "calf"],
  ["horse", "foal"],
  ["mare", "foal"],
  ["sheep", "lamb"],
  ["goat", "kid"],
  ["pig", "piglet"],
  ["dog", "puppy"],
  ["cat", "kitten"],
  ["chicken", "chick"],
  ["duck", "duckling"],
  ["goose", "gosling"],
  ["deer", "fawn"],
  ["bear", "cub"],
  ["lion", "cub"],
  ["tiger", "cub"],
  ["корова", "телёнок"],
  ["бык", "телёнок"],
  ["лошадь", "жеребёнок"],
  ["кобыла", "жеребёнок"],
  ["овца", "ягнёнок"],
  ["коза", "козлёнок"],
  ["свинья", "поросёнок"],
  ["собака", "щенок"],
  ["кошка", "котёнок"],
  ["курица", "цыплёнок"],
  ["утка", "утёнок"],
  ["гусь", "гусёнок"],
  ["олень", "оленёнок"],
  ["медведь", "медвежонок"],
  ["лев", "львёнок"],
  ["тигр", "тигрёнок"],
  ["kuh", "kalb"],
  ["pferd", "fohlen"],
  ["schaf", "lamm"],
  ["ziege", "zicklein"],
  ["schwein", "ferkel"],
  ["hund", "welpe"],
  ["katze", "kätzchen"],
  ["huhn", "küken"],
  ["ente", "entenküken"],
  ["gans", "gössel"],
];

const VAGUE_LABELS = new Set([
  "things",
  "stuff",
  "miscellaneous",
  "other",
  "various",
  "general",
  "вещи",
  "разное",
  "прочее",
  "всякое",
  "общее",
  "dinge",
  "sonstiges",
  "verschiedenes",
  "andere",
]);

function normalize(value) {
  return value
    .toLocaleLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function tokens(value) {
  return normalize(value).split(" ").filter(Boolean);
}

function itemHasTerm(item, term) {
  const itemTokens = new Set(tokens(item));
  return tokens(term).every((token) => itemTokens.has(token));
}

function listPuzzles(dir) {
  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".json"))
    .sort()
    .map((file) => ({
      file,
      puzzle: JSON.parse(fs.readFileSync(path.join(dir, file), "utf8")),
    }));
}

function nestedLabel(left, right) {
  const a = new Set(tokens(left));
  const b = new Set(tokens(right));
  if (a.size === 0 || b.size === 0 || a.size === b.size) return null;
  const smaller = a.size < b.size ? a : b;
  const larger = a.size < b.size ? b : a;
  if (![...smaller].every((token) => larger.has(token))) return null;
  return [...smaller];
}

function auditPuzzle(pool, file, puzzle) {
  const findings = [];
  const groups = Array.isArray(puzzle.groups) ? puzzle.groups : [];

  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];
    const labelTokens = tokens(group.label ?? "");
    if (labelTokens.length === 1 && VAGUE_LABELS.has(labelTokens[0])) {
      findings.push({
        severity: "review",
        kind: "vague-label",
        group: group.label,
        detail: "Label is too vague to communicate a fair category.",
      });
    }

    for (let j = i + 1; j < groups.length; j++) {
      const other = groups[j];
      const sharedBase = nestedLabel(group.label ?? "", other.label ?? "");
      if (sharedBase) {
        findings.push({
          severity: "review",
          kind: "nested-labels",
          group: `${group.label} / ${other.label}`,
          detail: `One label is a strict subset of the other: ${sharedBase.join(", ")}. Verify that the narrower group cannot leak into the broader one.`,
        });
      }
    }
  }

  for (const [adult, young] of RELATION_PAIRS) {
    const matches = [];
    for (const group of groups) {
      const adultItems = (group.items ?? []).filter((item) => itemHasTerm(item, adult));
      const youngItems = (group.items ?? []).filter((item) => itemHasTerm(item, young));
      if (adultItems.length || youngItems.length) {
        matches.push({ group, adultItems, youngItems });
      }
    }
    const adultFound = matches.flatMap((match) => match.adultItems);
    const youngFound = matches.flatMap((match) => match.youngItems);
    if (!adultFound.length || !youngFound.length) continue;

    const sameGroup = matches.some(
      (match) => match.adultItems.length && match.youngItems.length,
    );
    findings.push({
      severity: sameGroup ? "review" : "risk",
      kind: sameGroup ? "adult-young-same-group" : "adult-young-split-groups",
      group: matches.map((match) => match.group.label).join(" / "),
      detail: `${adult} and ${young} both appear in this puzzle; verify that the distinction is natural and not a category leak.`,
    });
  }

  return findings.map((finding) => ({
    pool,
    file,
    id: puzzle.id,
    title: puzzle.title,
    difficulty: puzzle.difficulty,
    ...finding,
  }));
}

const findings = [];
const counts = [];
for (const source of POOLS) {
  const puzzles = listPuzzles(source.dir);
  counts.push({ pool: source.key, count: puzzles.length });
  for (const { file, puzzle } of puzzles)
    findings.push(...auditPuzzle(source.key, file, puzzle));
}

findings.sort(
  (a, b) =>
    a.severity.localeCompare(b.severity) ||
    a.pool.localeCompare(b.pool) ||
    a.id.localeCompare(b.id),
);

const lines = [
  "# Foldwink Content Logic Audit",
  "",
  `Generated: ${new Date().toISOString().slice(0, 10)}`,
  "",
  "## Scope",
  "",
  `- Pools scanned: ${counts.map(({ pool, count }) => `${pool}=${count}`).join(", ")}`,
  "- This is a human-review queue. Signals are not automatic rejections.",
  "- High-priority rule: adult animals and their young must not create a false distinction or an accidental overlap between hidden groups.",
  "",
  "## Findings",
  "",
];

if (findings.length === 0) {
  lines.push("No heuristic logic risks found. This does not replace editorial playtesting.");
} else {
  lines.push(
    "| Severity | Pool | Puzzle | Group(s) | Signal | Review note |",
    "| --- | --- | --- | --- | --- | --- |",
  );
  for (const finding of findings) {
    lines.push(
      `| ${finding.severity} | ${finding.pool} | ${finding.id} — ${finding.title} | ${finding.group} | ${finding.kind} | ${finding.detail} |`,
    );
  }
}

lines.push(
  "",
  "## Editorial Decision Rule",
  "",
  "1. Keep a signal only when an ordinary player can explain all four items with one natural, level-consistent category.",
  "2. Revise when one item is a life stage, subtype, part, or near-synonym of another item without the label explicitly making that relation the point.",
  "3. Reject when two plausible groupings compete and neither is clearly stronger from the items alone.",
  "4. Verify every revised puzzle on a 390px mobile layout before promotion.",
);

fs.writeFileSync(REPORT_PATH, `${lines.join("\n")}\n`, "utf8");
console.log(
  `Content logic audit: ${findings.length} review signal(s) written to ${REPORT_PATH}`,
);
