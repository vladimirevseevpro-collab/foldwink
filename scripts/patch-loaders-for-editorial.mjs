#!/usr/bin/env node
// Update the three loader files so the *_POOL_RAMPED pools sort by
// `meta.editorialRank` when present, falling back to `meta.difficultyScore`,
// then to 50 as a final floor. Idempotent — only edits if the compare
// function still has the old body.

import { readFileSync, writeFileSync } from "node:fs";

const FILES = ["src/puzzles/loader.ts", "src/puzzles/loaderDe.ts", "src/puzzles/loaderRu.ts"];

const OLD = `function compareByDifficultyScore(a: Puzzle, b: Puzzle): number {
  const sa = a.meta?.difficultyScore ?? 50;
  const sb = b.meta?.difficultyScore ?? 50;
  if (sa !== sb) return sa - sb;
  return a.id.localeCompare(b.id);
}`;

const NEW = `function compareByDifficultyScore(a: Puzzle, b: Puzzle): number {
  // Prefer the GPT + heuristic blended editorialRank when available; fall
  // back to the pure-heuristic difficultyScore; fall back to the midpoint.
  const sa = a.meta?.editorialRank ?? a.meta?.difficultyScore ?? 50;
  const sb = b.meta?.editorialRank ?? b.meta?.difficultyScore ?? 50;
  if (sa !== sb) return sa - sb;
  return a.id.localeCompare(b.id);
}`;

let patched = 0;
for (const file of FILES) {
  const src = readFileSync(file, "utf8");
  if (src.includes("meta?.editorialRank")) {
    console.log(`${file}: already patched`);
    continue;
  }
  if (!src.includes(OLD)) {
    console.warn(`${file}: expected compare function not found; skipping`);
    continue;
  }
  writeFileSync(file, src.replace(OLD, NEW));
  console.log(`${file}: patched`);
  patched += 1;
}

console.log(`\nPatched ${patched} file(s).`);
