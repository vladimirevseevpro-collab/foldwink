import { describe, expect, it } from "vitest";
import {
  evaluateRewardPolicy,
  getRewardReceiptId,
  getUniqueSolveRewardKey,
  UNIQUE_SOLVE_XP,
  type RewardPolicyInput,
} from "../rewardPolicy";

const baseInput: RewardPolicyInput = {
  language: "en",
  lineageId: "official-001",
  context: "practice",
  result: "win",
  currentXp: 0,
  currentLevel: 1,
  consumedRewardKeys: [],
};

describe("reward policy v2", () => {
  it("awards 80 XP once with a deterministic immutable receipt", () => {
    const decision = evaluateRewardPolicy(baseInput);
    const rewardKey = "unique-solve:en:official-001";

    expect(decision.receipt).toEqual({
      schemaVersion: 2,
      receiptId: "reward-receipt:v2:unique-solve:en:official-001",
      rewardKey,
      awarded: true,
      xpGained: UNIQUE_SOLVE_XP,
      prevLevel: 1,
      newLevel: 1,
      reason: "awarded",
    });
    expect(decision.updatedProfile).toEqual({ xp: 80, level: 1 });
    expect(decision.consumedRewardKeys).toEqual([rewardKey]);
    expect(Object.isFrozen(decision)).toBe(true);
    expect(Object.isFrozen(decision.receipt)).toBe(true);
    expect(Object.isFrozen(decision.consumedRewardKeys)).toBe(true);
  });

  it("does not grant XP or consume a key for loss or abandonment", () => {
    for (const result of ["loss", "abandoned"] as const) {
      const decision = evaluateRewardPolicy({ ...baseInput, result });

      expect(decision.receipt).toMatchObject({
        awarded: false,
        xpGained: 0,
        reason: "not-a-win",
      });
      expect(decision.updatedProfile).toEqual({ xp: 0, level: 1 });
      expect(decision.consumedRewardKeys).toEqual([]);
    }
  });

  it("blocks the same official lineage after its reward key was consumed (TEST-03)", () => {
    const first = evaluateRewardPolicy(baseInput);
    const replay = evaluateRewardPolicy({
      ...baseInput,
      context: "zen",
      currentXp: first.updatedProfile.xp,
      currentLevel: first.updatedProfile.level,
      consumedRewardKeys: first.consumedRewardKeys,
    });

    expect(replay.receipt).toMatchObject({
      awarded: false,
      xpGained: 0,
      reason: "already-consumed",
      rewardKey: first.receipt.rewardKey,
      receiptId: first.receipt.receiptId,
    });
    expect(replay.updatedProfile).toEqual(first.updatedProfile);
    expect(replay.consumedRewardKeys).toEqual(first.consumedRewardKeys);
  });

  it("keeps a daily loss reward-free while a later practice win earns the one base solve (TEST-05)", () => {
    const dailyLoss = evaluateRewardPolicy({ ...baseInput, context: "daily", result: "loss" });
    const practiceWin = evaluateRewardPolicy({
      ...baseInput,
      currentXp: dailyLoss.updatedProfile.xp,
      currentLevel: dailyLoss.updatedProfile.level,
      consumedRewardKeys: dailyLoss.consumedRewardKeys,
    });

    expect(dailyLoss.receipt).toMatchObject({
      awarded: false,
      xpGained: 0,
      reason: "not-a-win",
    });
    expect(practiceWin.receipt).toMatchObject({ awarded: true, xpGained: UNIQUE_SOLVE_XP });
  });

  it("allows all official eligible contexts, including base-only mastery", () => {
    for (const context of [
      "daily",
      "practice",
      "onboarding",
      "zen",
      "archive",
      "mastery",
    ] as const) {
      const decision = evaluateRewardPolicy({ ...baseInput, context });
      expect(decision.receipt).toMatchObject({ awarded: true, xpGained: UNIQUE_SOLVE_XP });
    }
  });

  it("rejects duel, custom, palimpsest, and unofficial lineages", () => {
    for (const context of ["duel", "custom", "palimpsest"] as const) {
      const decision = evaluateRewardPolicy({ ...baseInput, context });
      expect(decision.receipt).toMatchObject({
        awarded: false,
        xpGained: 0,
        reason: "ineligible-context",
      });
    }

    expect(
      evaluateRewardPolicy({ ...baseInput, officialLineage: false }).receipt,
    ).toMatchObject({
      awarded: false,
      xpGained: 0,
      reason: "unofficial-lineage",
    });
  });

  it("uses stable language-and-lineage identities and never lowers an existing level", () => {
    expect(getUniqueSolveRewardKey("de", "same-lineage")).toBe("unique-solve:de:same-lineage");
    expect(getRewardReceiptId("de", "same-lineage")).toBe(
      "reward-receipt:v2:unique-solve:de:same-lineage",
    );

    const decision = evaluateRewardPolicy({ ...baseInput, currentXp: 0, currentLevel: 4 });
    expect(decision.receipt).toMatchObject({ prevLevel: 4, newLevel: 4 });
    expect(decision.updatedProfile).toEqual({ xp: UNIQUE_SOLVE_XP, level: 4 });
  });
});
