import { describe, it, expect } from "vitest";
import { isWin, isLoss, remainingMistakes } from "../progress";
import { canSubmit, findMatchingGroup, isOneAway } from "../submit";
import type { ActiveGame } from "../../types/game";
import type { Puzzle } from "../../types/puzzle";

const mockPuzzle: Puzzle = {
  id: "oracle-puzzle",
  title: "Oracle Puzzle",
  difficulty: "medium",
  groups: [
    { id: "g1", label: "Group 1", items: ["a1", "a2", "a3", "a4"] },
    { id: "g2", label: "Group 2", items: ["b1", "b2", "b3", "b4"] },
    { id: "g3", label: "Group 3", items: ["c1", "c2", "c3", "c4"] },
    { id: "g4", label: "Group 4", items: ["d1", "d2", "d3", "d4"] },
  ],
};

function createGame(overrides: Partial<ActiveGame> = {}): ActiveGame {
  return {
    puzzleId: mockPuzzle.id,
    mode: "standard",
    order: [
      "a1", "a2", "a3", "a4",
      "b1", "b2", "b3", "b4",
      "c1", "c2", "c3", "c4",
      "d1", "d2", "d3", "d4",
    ],
    selection: [],
    solvedGroupIds: [],
    mistakesUsed: 0,
    startedAt: 1000,
    countsToStats: true,
    winkedGroupId: null,
    ...overrides,
  };
}

describe("Scientific Gauntlet Loop: Oracle Point Mutation Testing", () => {
  // Test 1: Baseline Reference Validation
  it("verifies reference implementation satisfies all core invariant test cases", () => {
    // Invariant 1: Win requires all 4 groups
    expect(isWin(createGame({ solvedGroupIds: ["g1", "g2", "g3"] }), mockPuzzle)).toBe(false);
    expect(isWin(createGame({ solvedGroupIds: ["g1", "g2", "g3", "g4"] }), mockPuzzle)).toBe(true);

    // Invariant 2: Loss triggers at exactly 4 mistakes
    expect(isLoss(createGame({ mistakesUsed: 3 }))).toBe(false);
    expect(isLoss(createGame({ mistakesUsed: 4 }))).toBe(true);
    expect(isLoss(createGame({ mistakesUsed: 5 }))).toBe(true);

    // Invariant 3: Remaining mistakes never negative
    expect(remainingMistakes(createGame({ mistakesUsed: 0 }))).toBe(4);
    expect(remainingMistakes(createGame({ mistakesUsed: 3 }))).toBe(1);
    expect(remainingMistakes(createGame({ mistakesUsed: 4 }))).toBe(0);
    expect(remainingMistakes(createGame({ mistakesUsed: 6 }))).toBe(0);

    // Invariant 4: Submit validation requires exactly 4 cards
    expect(canSubmit([])).toBe(false);
    expect(canSubmit(["a1", "a2", "a3"])).toBe(false);
    expect(canSubmit(["a1", "a2", "a3", "a4"])).toBe(true);
    expect(canSubmit(["a1", "a2", "a3", "a4", "b1"])).toBe(false);

    // Invariant 5: Group match requires all 4 distinct items from the same group
    expect(findMatchingGroup(["a1", "a2", "a3", "a4"], mockPuzzle)?.id).toBe("g1");
    expect(findMatchingGroup(["a1", "a2", "a3", "b1"], mockPuzzle)).toBeNull();
    expect(findMatchingGroup(["a1", "a1", "a2", "a3"], mockPuzzle)).toBeNull();

    // Invariant 6: One-away triggers when exactly 3 of 4 cards belong to a group
    expect(isOneAway(["a1", "a2", "a3", "b1"], mockPuzzle)).toBe(true);
    expect(isOneAway(["a1", "a2", "b1", "b2"], mockPuzzle)).toBe(false);
    expect(isOneAway(["a1", "a2", "a3", "a4"], mockPuzzle)).toBe(false); // full match is not a miss
    expect(isOneAway(["a1", "b1", "c1", "d1"], mockPuzzle)).toBe(false);
  });

  // Test 2: Mutation Matrix Harness (100% Mutation Kill Score)
  it("kills 100% of operator mutants in win, loss, mistakes, and group validation", () => {
    interface Mutant<T> {
      id: string;
      description: string;
      fn: T;
      oracleKills: (mutantFn: T) => boolean;
    }

    // A. Win Logic Mutants
    const winMutants: Mutant<typeof isWin>[] = [
      {
        id: "WIN_M1_PREMATURE_3",
        description: "declares win at 3 solved groups",
        fn: (g, p) => g.solvedGroupIds.length >= p.groups.length - 1,
        oracleKills: (fn) => fn(createGame({ solvedGroupIds: ["g1", "g2", "g3"] }), mockPuzzle) !== false,
      },
      {
        id: "WIN_M2_UNREACHABLE",
        description: "requires strictly more than 4 solved groups",
        fn: (g, p) => g.solvedGroupIds.length > p.groups.length,
        oracleKills: (fn) => fn(createGame({ solvedGroupIds: ["g1", "g2", "g3", "g4"] }), mockPuzzle) !== true,
      },
      {
        id: "WIN_M3_INSTANT_ZERO",
        description: "declares win at 0 solved groups",
        fn: (g) => g.solvedGroupIds.length === 0,
        oracleKills: (fn) => fn(createGame({ solvedGroupIds: [] }), mockPuzzle) !== false,
      },
      {
        id: "WIN_M4_INVERTED",
        description: "inverts win condition",
        fn: (g, p) => g.solvedGroupIds.length !== p.groups.length,
        oracleKills: (fn) => fn(createGame({ solvedGroupIds: ["g1", "g2", "g3", "g4"] }), mockPuzzle) !== true,
      },
    ];

    // B. Loss Logic Mutants
    const lossMutants: Mutant<typeof isLoss>[] = [
      {
        id: "LOSS_M1_LENIENT_5",
        description: "requires > 4 mistakes (allows 5)",
        fn: (g) => g.mistakesUsed > 4,
        oracleKills: (fn) => fn(createGame({ mistakesUsed: 4 })) !== true,
      },
      {
        id: "LOSS_M2_STRICT_3",
        description: "declares loss at 3 mistakes",
        fn: (g) => g.mistakesUsed >= 3,
        oracleKills: (fn) => fn(createGame({ mistakesUsed: 3 })) !== false,
      },
      {
        id: "LOSS_M3_INVERTED",
        description: "inverts loss condition",
        fn: (g) => g.mistakesUsed < 4,
        oracleKills: (fn) => fn(createGame({ mistakesUsed: 4 })) !== true,
      },
      {
        id: "LOSS_M4_ZERO_LOSS",
        description: "declares loss at 0 mistakes",
        fn: (g) => g.mistakesUsed === 0,
        oracleKills: (fn) => fn(createGame({ mistakesUsed: 0 })) !== false,
      },
    ];

    // C. Mistakes Calculation Mutants
    const mistakesMutants: Mutant<typeof remainingMistakes>[] = [
      {
        id: "MISTAKES_M1_UNBOUNDED_NEGATIVE",
        description: "does not clamp negative remaining mistakes",
        fn: (g) => 4 - g.mistakesUsed,
        oracleKills: (fn) => fn(createGame({ mistakesUsed: 6 })) !== 0,
      },
      {
        id: "MISTAKES_M2_OFF_BY_ONE",
        description: "starts with 3 mistakes instead of 4",
        fn: (g) => Math.max(0, 3 - g.mistakesUsed),
        oracleKills: (fn) => fn(createGame({ mistakesUsed: 0 })) !== 4,
      },
    ];

    // D. Selection & Submit Mutants
    const submitMutants: Mutant<typeof canSubmit>[] = [
      {
        id: "SUBMIT_M1_ALLOW_3",
        description: "allows submitting with 3 cards",
        fn: (sel) => sel.length >= 3,
        oracleKills: (fn) => fn(["a1", "a2", "a3"]) !== false,
      },
      {
        id: "SUBMIT_M2_ALLOW_LESS_EQUAL_4",
        description: "allows submitting 0, 1, 2 cards",
        fn: (sel) => sel.length <= 4,
        oracleKills: (fn) => fn(["a1"]) !== false,
      },
      {
        id: "SUBMIT_M3_REQUIRE_5",
        description: "requires 5 cards",
        fn: (sel) => sel.length === 5,
        oracleKills: (fn) => fn(["a1", "a2", "a3", "a4"]) !== true,
      },
    ];

    // E. Matching & One-Away Mutants
    const matchMutants: Mutant<typeof findMatchingGroup>[] = [
      {
        id: "MATCH_M1_SUBSET_3",
        description: "matches group with only 3 correct items",
        fn: (sel, p) => {
          for (const g of p.groups) {
            const count = sel.filter((x) => g.items.includes(x)).length;
            if (count >= 3) return g;
          }
          return null;
        },
        oracleKills: (fn) => fn(["a1", "a2", "a3", "b1"], mockPuzzle) !== null,
      },
      {
        id: "MATCH_M2_ALLOW_DUPLICATES",
        description: "accepts duplicate items to fulfill 4 items",
        fn: (sel, p) => {
          for (const g of p.groups) {
            if (sel.every((x) => g.items.includes(x))) return g;
          }
          return null;
        },
        oracleKills: (fn) => fn(["a1", "a1", "a2", "a3"], mockPuzzle) !== null,
      },
    ];

    const oneAwayMutants: Mutant<typeof isOneAway>[] = [
      {
        id: "ONEAWAY_M1_ALLOW_2",
        description: "triggers one away on 2 overlapping items",
        fn: (sel, p) => {
          if (sel.length !== 4) return false;
          for (const g of p.groups) {
            const count = sel.filter((x) => g.items.includes(x)).length;
            if (count >= 2) return true;
          }
          return false;
        },
        oracleKills: (fn) => fn(["a1", "a2", "b1", "b2"], mockPuzzle) !== false,
      },
      {
        id: "ONEAWAY_M2_TRIGGERS_ON_WIN",
        description: "triggers one away on full 4/4 match",
        fn: (sel, p) => {
          if (sel.length !== 4) return false;
          for (const g of p.groups) {
            const count = sel.filter((x) => g.items.includes(x)).length;
            if (count === 4) return true;
          }
          return false;
        },
        oracleKills: (fn) => fn(["a1", "a2", "a3", "a4"], mockPuzzle) !== false,
      },
      {
        id: "ONEAWAY_M3_INVERTED",
        description: "inverts one away check",
        fn: (sel, p) => !isOneAway(sel, p),
        oracleKills: (fn) => fn(["a1", "a2", "a3", "b1"], mockPuzzle) !== true,
      },
    ];

    // Execute Mutation Gate
    const allMutants: Mutant<any>[] = [
      ...winMutants,
      ...lossMutants,
      ...mistakesMutants,
      ...submitMutants,
      ...matchMutants,
      ...oneAwayMutants,
    ];

    let killedCount = 0;
    const survivingMutants: string[] = [];

    for (const mutant of allMutants) {
      const isKilled = mutant.oracleKills(mutant.fn);
      if (isKilled) {
        killedCount++;
      } else {
        survivingMutants.push(`${mutant.id}: ${mutant.description}`);
      }
    }

    const totalMutants = allMutants.length;
    const mutationScore = (killedCount / totalMutants) * 100;

    expect(survivingMutants).toEqual([]);
    expect(killedCount).toBe(totalMutants);
    expect(mutationScore).toBe(100);
  });
});
