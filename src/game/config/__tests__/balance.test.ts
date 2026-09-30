import { describe, expect, it } from "vitest";
import { BALANCE_POLICY, recommendBand, type CalibrationResult } from "../balance";

const result = (
  outcome: "win" | "loss",
  mistakesUsed = outcome === "win" ? 1 : 4,
  overrides: Partial<CalibrationResult> = {},
): CalibrationResult => ({
  tier: "medium",
  result: outcome,
  mistakesUsed,
  firstAttempt: true,
  context: "practice",
  editorialReady: true,
  ...overrides,
});

describe("balance recommendation policy", () => {
  it("keeps the experimental thresholds versioned", () => {
    expect(BALANCE_POLICY).toEqual({
      version: "balance-2026-09-v1",
      promotionWindow: 5,
      promotionWinsRequired: 4,
      promotionMedianMistakesMax: 1,
      calmAfterConsecutiveLosses: 2,
      recommendationCooldownCompletions: 5,
    });
  });

  it("suggests the next available band after four confident wins in five", () => {
    expect(
      recommendBand({
        tier: "medium",
        currentBand: "B2",
        availableBands: ["B2", "B3"],
        results: [
          result("win", 0),
          result("win", 1),
          result("loss"),
          result("win", 1),
          result("win", 1),
        ],
      }),
    ).toEqual({ kind: "up", targetBand: "B3", reason: "confident" });
  });

  it("does not let retries or non-practice modes calibrate skill", () => {
    expect(
      recommendBand({
        tier: "medium",
        currentBand: "B2",
        availableBands: ["B2", "B3"],
        results: [
          result("win", 0, { firstAttempt: false }),
          result("win", 0, { context: "daily" }),
          result("win", 0, { editorialReady: false }),
          result("win", 0, { tier: "easy" }),
          result("win", 0),
        ],
      }),
    ).toEqual({ kind: "none", reason: "insufficient-data" });
  });

  it("suggests a calmer available band after two consecutive relevant losses", () => {
    expect(
      recommendBand({
        tier: "medium",
        currentBand: "B3",
        availableBands: ["B1", "B2", "B3"],
        results: [result("win"), result("loss"), result("loss")],
      }),
    ).toEqual({ kind: "calmer", targetBand: "B2", reason: "loss-run" });
  });

  it("respects recommendation cooldown and never invents an adjacent band", () => {
    expect(
      recommendBand({
        tier: "medium",
        currentBand: "B2",
        availableBands: ["B2", "B3"],
        results: [result("loss"), result("loss")],
        relevantCompletionsSinceLastRecommendation: 2,
      }),
    ).toEqual({ kind: "none", reason: "cooldown" });

    expect(
      recommendBand({
        tier: "hard",
        currentBand: "B4",
        availableBands: ["B4"],
        results: Array.from({ length: 5 }, () => result("win", 0, { tier: "hard" })),
      }),
    ).toEqual({ kind: "none", reason: "no-adjacent-band" });
  });
});
