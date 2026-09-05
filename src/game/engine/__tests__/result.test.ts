import { describe, expect, it } from "vitest";
import {
  calculateResultSummary,
  computePlayerArchetype,
  formatDuration,
} from "../result";
import type { ActiveGame } from "../../types/game";

describe("calculateResultSummary & formatDuration", () => {
  it("formats duration into mm:ss format", () => {
    expect(formatDuration(0)).toBe("0:00");
    expect(formatDuration(5000)).toBe("0:05");
    expect(formatDuration(65000)).toBe("1:05");
    expect(formatDuration(600000)).toBe("10:00");
  });

  it("calculates result summary from an active game", () => {
    const game: ActiveGame = {
      puzzleId: "test-01",
      mode: "daily",
      countsToStats: true,
      order: [],
      selection: [],
      solvedGroupIds: ["g1", "g2", "g3", "g4"],
      mistakesUsed: 1,
      startedAt: 1000,
      endedAt: 65000,
      winkedGroupId: null,
      result: "win",
    };

    const summary = calculateResultSummary(game, 65000);
    expect(summary.result).toBe("win");
    expect(summary.mistakesUsed).toBe(1);
    expect(summary.durationMs).toBe(64000);
    expect(summary.solvedGroupIds).toEqual(["g1", "g2", "g3", "g4"]);
  });
});

describe("computePlayerArchetype", () => {
  it("returns THE SNIPER when won with 0 mistakes", () => {
    const summary = {
      result: "win" as const,
      mistakesUsed: 0,
      durationMs: 75000,
      solvedGroupIds: ["g1", "g2", "g3", "g4"],
    };
    const archetype = computePlayerArchetype(summary, "easy");
    expect(archetype.id).toBe("sniper");
    expect(archetype.badge).toBe("THE SNIPER");
    expect(archetype.icon).toBe("🎯");
  });

  it("returns SPEED DEMON when won under 60 seconds", () => {
    const summary = {
      result: "win" as const,
      mistakesUsed: 0,
      durationMs: 45000,
      solvedGroupIds: ["g1", "g2", "g3", "g4"],
    };
    const archetype = computePlayerArchetype(summary, "easy");
    expect(archetype.id).toBe("speed_demon");
    expect(archetype.badge).toBe("SPEED DEMON");
    expect(archetype.icon).toBe("⚡");
  });

  it("returns THE GAMBLER when won with 3 mistakes used", () => {
    const summary = {
      result: "win" as const,
      mistakesUsed: 3,
      durationMs: 90000,
      solvedGroupIds: ["g1", "g2", "g3", "g4"],
    };
    const archetype = computePlayerArchetype(summary, "medium", null);
    expect(archetype.id).toBe("gambler");
    expect(archetype.badge).toBe("THE GAMBLER");
    expect(archetype.icon).toBe("🎲");
  });

  it("returns THE PURIST when won medium/hard without winking", () => {
    const summary = {
      result: "win" as const,
      mistakesUsed: 1,
      durationMs: 80000,
      solvedGroupIds: ["g1", "g2", "g3", "g4"],
    };
    const archetype = computePlayerArchetype(summary, "medium", null);
    expect(archetype.id).toBe("purist");
    expect(archetype.badge).toBe("THE PURIST");
    expect(archetype.icon).toBe("🧠");
  });

  it("returns THE DETECTIVE when won medium/hard using a wink", () => {
    const summary = {
      result: "win" as const,
      mistakesUsed: 1,
      durationMs: 80000,
      solvedGroupIds: ["g1", "g2", "g3", "g4"],
    };
    const archetype = computePlayerArchetype(summary, "medium", "g1");
    expect(archetype.id).toBe("detective");
    expect(archetype.badge).toBe("THE DETECTIVE");
    expect(archetype.icon).toBe("🔍");
  });

  it("returns THE PERSISTENT on a loss", () => {
    const summary = {
      result: "loss" as const,
      mistakesUsed: 4,
      durationMs: 80000,
      solvedGroupIds: ["g1", "g2"],
    };
    const archetype = computePlayerArchetype(summary, "medium", null);
    expect(archetype.id).toBe("persistent");
    expect(archetype.badge).toBe("PERSISTENT");
    expect(archetype.icon).toBe("🛡️");
  });
});
