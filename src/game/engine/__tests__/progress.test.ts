import { describe, it, expect } from "vitest";
import {
  applyCorrectGroup,
  applyIncorrectGuess,
  isWin,
  isLoss,
  remainingMistakes,
} from "../progress";
import type { ActiveGame } from "../../types/game";
import type { Puzzle } from "../../types/puzzle";

const puzzle: Puzzle = {
  id: "p",
  title: "P",
  difficulty: "easy",
  groups: [
    { id: "g1", label: "G1", items: ["a", "b", "c", "d"] },
    { id: "g2", label: "G2", items: ["e", "f", "g", "h"] },
    { id: "g3", label: "G3", items: ["i", "j", "k", "l"] },
    { id: "g4", label: "G4", items: ["m", "n", "o", "p"] },
  ],
};

function base(): ActiveGame {
  return {
    puzzleId: "p",
    mode: "standard",
    order: ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p"],
    selection: ["a", "b", "c", "d"],
    solvedGroupIds: [],
    mistakesUsed: 0,
    startedAt: 0,
    countsToStats: true,
    winkedGroupId: null,
  };
}

describe("applyCorrectGroup", () => {
  it("adds groupId and clears selection", () => {
    const g = applyCorrectGroup(base(), "g1");
    expect(g.solvedGroupIds).toEqual(["g1"]);
    expect(g.selection).toEqual([]);
  });
  it("is idempotent for already-solved group", () => {
    const g = applyCorrectGroup({ ...base(), solvedGroupIds: ["g1"] }, "g1");
    expect(g.solvedGroupIds).toEqual(["g1"]);
  });
});

describe("applyIncorrectGuess", () => {
  it("increments mistakes and keeps the attempted cards selected for adjustment", () => {
    const attempted = { ...base(), selectionItemIds: ["p:a", "p:b", "p:c", "p:d"] };
    const g = applyIncorrectGuess(attempted);
    expect(g.mistakesUsed).toBe(1);
    expect(g.selection).toEqual(attempted.selection);
    expect(g.selectionItemIds).toEqual(attempted.selectionItemIds);
  });
  it("records a canonical signature and refuses to consume it twice", () => {
    const first = applyIncorrectGuess(base(), '["a","e","i","m"]');
    const reordered = { ...first, selection: ["m", "i", "e", "a"] };
    const second = applyIncorrectGuess(reordered, '["a","e","i","m"]');
    expect(first.mistakesUsed).toBe(1);
    expect(first.incorrectGuessSignatures).toEqual(['["a","e","i","m"]']);
    expect(second).toBe(reordered);
    expect(second.mistakesUsed).toBe(1);
    expect(second.selection).toEqual(["m", "i", "e", "a"]);
  });
});

describe("remainingMistakes", () => {
  it("counts down from 4", () => {
    expect(remainingMistakes({ ...base(), mistakesUsed: 0 })).toBe(4);
    expect(remainingMistakes({ ...base(), mistakesUsed: 3 })).toBe(1);
    expect(remainingMistakes({ ...base(), mistakesUsed: 4 })).toBe(0);
  });
});

describe("isWin", () => {
  it("true only when all 4 groups solved", () => {
    expect(isWin({ ...base(), solvedGroupIds: ["g1", "g2", "g3"] }, puzzle)).toBe(false);
    expect(isWin({ ...base(), solvedGroupIds: ["g1", "g2", "g3", "g4"] }, puzzle)).toBe(true);
  });
});

describe("isLoss", () => {
  it("true at or above 4 mistakes", () => {
    expect(isLoss({ ...base(), mistakesUsed: 3 })).toBe(false);
    expect(isLoss({ ...base(), mistakesUsed: 4 })).toBe(true);
    expect(isLoss({ ...base(), mistakesUsed: 5 })).toBe(true);
  });
  it("uses an attempt-bound terminal threshold", () => {
    const mastery = {
      ...base(),
      rules: {
        version: 1 as const,
        maxIncorrectGuesses: 2,
        tabsEnabled: true,
        maxWinks: 1 as const,
        timerPresentation: "optional" as const,
      },
    };
    expect(isLoss({ ...mastery, mistakesUsed: 1 })).toBe(false);
    expect(isLoss({ ...mastery, mistakesUsed: 2 })).toBe(true);
    expect(remainingMistakes({ ...mastery, mistakesUsed: 1 })).toBe(1);
  });
});
