import type { PuzzleBand } from "../../puzzles/catalog";

/**
 * Conservative W2 calibration policy. These values are experiment defaults,
 * not claims about proven player behavior; bump the version when tuning them.
 */
export const BALANCE_POLICY = Object.freeze({
  version: "balance-2026-09-v1",
  promotionWindow: 5,
  promotionWinsRequired: 4,
  promotionMedianMistakesMax: 1,
  calmAfterConsecutiveLosses: 2,
  recommendationCooldownCompletions: 5,
});

export type CalibrationTier = "easy" | "medium" | "hard";

export type CalibrationResult = {
  tier: CalibrationTier;
  result: "win" | "loss";
  mistakesUsed: number;
  firstAttempt: boolean;
  context: "practice" | "daily" | "custom" | "duel" | "mastery" | "palimpsest";
  editorialReady: boolean;
};

export type BandRecommendation =
  | { kind: "none"; reason: "insufficient-data" | "cooldown" | "no-adjacent-band" }
  | { kind: "up" | "calmer"; targetBand: PuzzleBand; reason: "confident" | "loss-run" };

const BAND_ORDER: readonly PuzzleBand[] = ["B0", "B1", "B2", "B3", "B4"];

function adjacentAvailableBand(
  currentBand: PuzzleBand,
  availableBands: readonly PuzzleBand[],
  direction: -1 | 1,
): PuzzleBand | undefined {
  const currentIndex = BAND_ORDER.indexOf(currentBand);
  if (currentIndex < 0) return undefined;
  const available = new Set(availableBands);
  for (
    let index = currentIndex + direction;
    index >= 0 && index < BAND_ORDER.length;
    index += direction
  ) {
    const candidate = BAND_ORDER[index];
    if (available.has(candidate)) return candidate;
  }
  return undefined;
}

function median(values: readonly number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}

export function recommendBand(input: {
  tier: CalibrationTier;
  currentBand: PuzzleBand;
  availableBands: readonly PuzzleBand[];
  results: readonly CalibrationResult[];
  relevantCompletionsSinceLastRecommendation?: number;
}): BandRecommendation {
  const relevant = input.results.filter(
    (result) =>
      result.tier === input.tier &&
      result.context === "practice" &&
      result.firstAttempt &&
      result.editorialReady,
  );

  if (
    input.relevantCompletionsSinceLastRecommendation !== undefined &&
    input.relevantCompletionsSinceLastRecommendation <
      BALANCE_POLICY.recommendationCooldownCompletions
  ) {
    return { kind: "none", reason: "cooldown" };
  }

  const lossTail = relevant.slice(-BALANCE_POLICY.calmAfterConsecutiveLosses);
  if (
    lossTail.length === BALANCE_POLICY.calmAfterConsecutiveLosses &&
    lossTail.every((result) => result.result === "loss")
  ) {
    const targetBand = adjacentAvailableBand(input.currentBand, input.availableBands, -1);
    return targetBand
      ? { kind: "calmer", targetBand, reason: "loss-run" }
      : { kind: "none", reason: "no-adjacent-band" };
  }

  const window = relevant.slice(-BALANCE_POLICY.promotionWindow);
  if (window.length < BALANCE_POLICY.promotionWindow) {
    return { kind: "none", reason: "insufficient-data" };
  }
  const wins = window.filter((result) => result.result === "win");
  if (
    wins.length >= BALANCE_POLICY.promotionWinsRequired &&
    median(wins.map((result) => result.mistakesUsed)) <=
      BALANCE_POLICY.promotionMedianMistakesMax
  ) {
    const targetBand = adjacentAvailableBand(input.currentBand, input.availableBands, 1);
    return targetBand
      ? { kind: "up", targetBand, reason: "confident" }
      : { kind: "none", reason: "no-adjacent-band" };
  }
  return { kind: "none", reason: "insufficient-data" };
}
