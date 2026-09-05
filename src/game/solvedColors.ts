import type { Puzzle } from "./types/puzzle";

export const SOLVED_COLOR_CLASSES = [
  "bg-solved1 text-ink border border-solved1Border",
  "bg-solved2 text-ink border border-solved2Border",
  "bg-solved3 text-ink border border-solved3Border",
  "bg-solved4 text-ink border border-solved4Border",
] as const;

export const SOLVED_CARD_DEPTH_CLASSES = [
  "shadow-solved1",
  "shadow-solved2",
  "shadow-solved3",
  "shadow-solved4",
] as const;

/**
 * Small Unicode markers placed before solved card text so colour is not the
 * only signal distinguishing the four groups. Accessibility aid for
 * colour-blind players. 0.5.0.
 */
export const SOLVED_GROUP_MARKERS = ["●", "◆", "▲", "■"] as const;

export function colorIndexForGroup(puzzle: Puzzle, groupId: string): number {
  const idx = puzzle.groups.findIndex((g) => g.id === groupId);
  if (idx < 0) return 0;
  return idx % SOLVED_COLOR_CLASSES.length;
}

export function solvedClassForGroup(puzzle: Puzzle, groupId: string): string {
  return SOLVED_COLOR_CLASSES[colorIndexForGroup(puzzle, groupId)];
}

export function solvedDepthClassForGroup(puzzle: Puzzle, groupId: string): string {
  return SOLVED_CARD_DEPTH_CLASSES[colorIndexForGroup(puzzle, groupId)];
}
