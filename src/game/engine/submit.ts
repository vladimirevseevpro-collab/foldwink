import type { Puzzle, PuzzleGroup } from "../types/puzzle";
import { SELECTION_SIZE } from "../types/game";

export function canSubmit(selection: readonly string[]): boolean {
  return selection.length === SELECTION_SIZE;
}

/**
 * Stable identity for a quartet regardless of click or shuffle order.
 * Puzzle items are still strings in the current schema; W2 will replace
 * display-text identity with durable item ids without changing this API.
 */
export function guessSignature(selection: readonly string[]): string | null {
  if (selection.length !== SELECTION_SIZE) return null;
  const unique = new Set(selection);
  if (unique.size !== SELECTION_SIZE) return null;
  return JSON.stringify([...unique].sort());
}

export function findMatchingGroup(
  selection: readonly string[],
  puzzle: Puzzle,
): PuzzleGroup | null {
  if (selection.length !== SELECTION_SIZE) return null;
  const selSet = new Set(selection);
  if (selSet.size !== SELECTION_SIZE) return null;
  for (const group of puzzle.groups) {
    const groupItems = new Set<string>(group.items);
    if (groupItems.size !== SELECTION_SIZE) continue;
    let match = true;
    for (const item of group.items) {
      if (!selSet.has(item)) {
        match = false;
        break;
      }
    }
    if (match) return group;
  }
  return null;
}

/**
 * Returns true when the incorrect selection had exactly SELECTION_SIZE-1
 * items from a single group. Standard "one away" signal used by grouping
 * puzzles to soften a miss.
 */
export function isOneAway(selection: readonly string[], puzzle: Puzzle): boolean {
  if (selection.length !== SELECTION_SIZE) return false;
  const selSet = new Set(selection);
  if (selSet.size !== SELECTION_SIZE) return false;
  for (const group of puzzle.groups) {
    let overlap = 0;
    for (const item of group.items) {
      if (selSet.has(item)) overlap += 1;
    }
    if (overlap === SELECTION_SIZE - 1) return true;
  }
  return false;
}
