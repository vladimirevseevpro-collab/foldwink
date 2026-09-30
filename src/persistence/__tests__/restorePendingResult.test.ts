import { describe, expect, it } from "vitest";
import { INITIAL_STATS } from "../../game/types/stats";
import type { Puzzle } from "../../game/types/puzzle";
import { INITIAL_PROFILE } from "../../progression/archivistProfile";
import type { PersistedAggregateV2, PersistedTerminalAttempt } from "../gameRepository";
import { restorePendingResult } from "../restorePendingResult";

const puzzle: Puzzle = {
  id: "puzzle-1",
  title: "Restore fixture",
  difficulty: "easy",
  groups: [
    { id: "g1", label: "G1", items: ["a", "b", "c", "d"] },
    { id: "g2", label: "G2", items: ["e", "f", "g", "h"] },
    { id: "g3", label: "G3", items: ["i", "j", "k", "l"] },
    { id: "g4", label: "G4", items: ["m", "n", "o", "p"] },
  ],
};

function terminal(): PersistedTerminalAttempt {
  return {
    attemptId: "attempt-1",
    commandId: "finalize:attempt-1:1:win",
    revision: 1,
    context: "practice",
    rules: {
      version: 1,
      maxIncorrectGuesses: 4,
      tabsEnabled: false,
      maxWinks: 0,
      timerPresentation: "optional",
    },
    puzzleId: puzzle.id,
    mode: "standard",
    order: puzzle.groups.flatMap((group) => group.items),
    selection: [],
    solvedGroupIds: ["g1", "g2", "g3", "g4"],
    mistakesUsed: 1,
    startedAt: 100,
    startedLocalDate: "2026-09-14",
    countsToStats: true,
    winkedGroupId: null,
    result: "win",
    endedAt: 1_100,
    rewardReceipt: {
      schemaVersion: 2,
      receiptId: "receipt-1",
      rewardKey: "unique-solve:en:puzzle-1",
      awarded: false,
      xpGained: 0,
      prevLevel: 1,
      newLevel: 1,
      reason: "already-consumed",
    },
  };
}

function aggregate(): PersistedAggregateV2 {
  const finished = terminal();
  return {
    schemaVersion: 2,
    profileRevision: 2,
    activeSession: null,
    pendingResultAttemptId: finished.attemptId,
    terminalAttempts: { [finished.attemptId]: finished },
    stats: { ...INITIAL_STATS, gamesPlayed: 1, wins: 1 },
    standardProgress: { cursor: 1 },
    dailyHistory: {},
    onboarded: true,
    archivistProfile: { ...INITIAL_PROFILE, version: 2 },
  };
}

describe("restorePendingResult", () => {
  it("reconstructs a read-only Result and reuses the persisted denial receipt", () => {
    const restored = restorePendingResult(aggregate(), (id) =>
      id === puzzle.id ? puzzle : undefined,
    );

    expect(restored?.active.result).toBe("win");
    expect(restored?.summary).toMatchObject({ result: "win", mistakesUsed: 1 });
    expect(restored?.summary.durationMs).toBe(1_000);
    expect(restored?.rewardReceipt).toMatchObject({ reason: "already-consumed" });
  });

  it("does not revive an acknowledged, abandoned, or unavailable puzzle", () => {
    const acknowledged = aggregate();
    acknowledged.pendingResultAttemptId = null;
    expect(restorePendingResult(acknowledged, () => puzzle)).toBeNull();

    const abandoned = aggregate();
    abandoned.terminalAttempts["attempt-1"].result = "abandoned";
    expect(restorePendingResult(abandoned, () => puzzle)).toBeNull();
    expect(restorePendingResult(aggregate(), () => undefined)).toBeNull();
  });

  it("restores the pinned payload after the catalog entry changed or disappeared", () => {
    const state = aggregate();
    state.terminalAttempts["attempt-1"].puzzleSnapshot = puzzle;
    expect(restorePendingResult(state, () => undefined)?.puzzle).toEqual(puzzle);
  });
});
