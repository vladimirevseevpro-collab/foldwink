import type { Puzzle, FlatItem } from "../types/puzzle";
import { fnv1a } from "../../utils/hash";

export function flattenPuzzle(puzzle: Puzzle): FlatItem[] {
  const out: FlatItem[] = [];
  for (const group of puzzle.groups) {
    for (const [index, item] of group.items.entries()) {
      out.push({ id: JSON.stringify([group.id, index]), value: item, groupId: group.id });
    }
  }
  return out;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffleDeterministic<T>(arr: readonly T[], seed: number): T[] {
  const out = arr.slice();
  const rand = mulberry32(seed);
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function seedFromString(s: string): number {
  return fnv1a(s);
}

export function shuffleItems(puzzle: Puzzle, seed: number): string[] {
  return shuffleFlatItems(puzzle, seed).map((item) => item.value);
}

export function shuffleFlatItems(puzzle: Puzzle, seed: number): FlatItem[] {
  return shuffleDeterministic(flattenPuzzle(puzzle), seed);
}

export function itemIdForValue(puzzle: Puzzle, value: string): string | undefined {
  return flattenPuzzle(puzzle).find((item) => item.value === value)?.id;
}
