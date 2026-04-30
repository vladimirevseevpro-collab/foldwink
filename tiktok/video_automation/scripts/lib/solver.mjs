import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

export function loadPuzzlePool(poolDir) {
  const files = readdirSync(poolDir).filter((f) => f.endsWith(".json"));
  const puzzles = [];
  for (const f of files) {
    const raw = readFileSync(join(poolDir, f), "utf-8");
    puzzles.push(JSON.parse(raw));
  }
  return puzzles;
}

export function matchPuzzleByCards(pool, cardTexts) {
  const cardSet = new Set(cardTexts.map(normalize));
  for (const puzzle of pool) {
    const items = puzzle.groups.flatMap((g) => g.items).map(normalize);
    if (items.length !== 16) continue;
    if (items.every((it) => cardSet.has(it)) && cardSet.size === items.length) {
      return puzzle;
    }
  }
  return null;
}

function normalize(s) {
  return String(s).trim().toLowerCase();
}

export function buildSolvePlan(puzzle, { plannedMistakes = 0, groupOrder = null } = {}) {
  const groups = puzzle.groups.map((g) => ({
    id: g.id,
    label: g.label,
    items: g.items.slice(),
  }));
  if (groupOrder) {
    groups.sort((a, b) => groupOrder.indexOf(a.id) - groupOrder.indexOf(b.id));
  }
  const steps = [];
  for (let m = 0; m < plannedMistakes; m++) {
    const a = groups[m % groups.length];
    const b = groups[(m + 1) % groups.length];
    const pick = [a.items[0], a.items[1], b.items[0], b.items[1]];
    steps.push({ type: "mistake", label: `mix:${a.id}+${b.id}`, items: pick });
  }
  for (const g of groups) {
    steps.push({ type: "solve", label: g.label, items: g.items.slice() });
  }
  return steps;
}

export function findCardLocatorTexts(page) {
  return page.$$eval('[role="grid"] button', (btns) =>
    btns.map((b) => (b.textContent || "").trim()).filter(Boolean),
  );
}
