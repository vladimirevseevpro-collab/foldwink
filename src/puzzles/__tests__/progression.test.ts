import { describe, expect, it } from "vitest";
import type { Puzzle } from "../../game/types/puzzle";
import type { EditorialRecord, PuzzleBand, StarterEntry } from "../catalog";
import { selectPracticePuzzle, type PracticeCandidate } from "../progression";

function puzzle(id: string, difficulty: Puzzle["difficulty"] = "easy", prefix = id): Puzzle {
  return {
    id,
    title: id,
    difficulty,
    groups: [0, 1, 2, 3].map((group) => ({
      id: `g${group}`,
      label: `G${group}`,
      items: [0, 1, 2, 3].map((item) => `${prefix}-${group}-${item}`),
    })) as Puzzle["groups"],
  };
}

function candidate(
  id: string,
  band: PuzzleBand,
  topic: string,
  options: Partial<EditorialRecord> & { difficulty?: Puzzle["difficulty"] } = {},
): PracticeCandidate {
  const puzzleRef = {
    language: "en" as const,
    puzzleId: id,
    lineageId: id,
    contentVersion: "catalog-v1",
  };
  return {
    puzzle: puzzle(id, options.difficulty ?? "easy"),
    puzzleRef,
    editorial: {
      puzzleRef,
      publicTier: options.difficulty ?? "easy",
      band,
      vocabularyFamiliarity: "common",
      relationTypes: ["classification"],
      topicTags: [topic],
      anchorGroupId: "g0",
      ambiguityRisk: "low",
      tabReview: "not-applicable",
      mobileFit: "approved",
      authorReview: { reviewerId: "author", date: "2026-09-14" },
      independentReview: { reviewerId: "validator", date: "2026-09-14" },
      playtest: null,
      status: "ready",
      ...options,
    },
  };
}

const starters: StarterEntry[] = [
  {
    entryId: "starter-1",
    order: 1,
    role: "first-connection",
    band: "B0",
    puzzleRef: {
      language: "en",
      puzzleId: "starter",
      lineageId: "starter",
      contentVersion: "catalog-v1",
    },
  },
];

const base = {
  language: "en" as const,
  tier: "easy" as const,
  followStarterPath: false,
  starters,
  completedStarterEntryIds: [] as string[],
  seenLineageIds: [] as string[],
  recentTopicTags: [] as string[],
  recentItemValues: [] as string[],
  selectionSequence: 0,
  playerSeed: "player-1",
  catalogVersion: "catalog-v1",
};

describe("selectPracticePuzzle", () => {
  it("uses the explicit starter manifest instead of pool order", () => {
    const random = candidate("aaa", "B0", "other");
    const starter = candidate("starter", "B0", "intro");
    const result = selectPracticePuzzle({
      ...base,
      followStarterPath: true,
      candidates: [random, starter],
    });
    expect(result.source).toBe("starter");
    expect(result.candidate?.puzzle.id).toBe("starter");
  });

  it("excludes seen lineage even when it has not been solved", () => {
    const result = selectPracticePuzzle({
      ...base,
      seenLineageIds: ["seen"],
      candidates: [candidate("seen", "B1", "a"), candidate("new", "B1", "b")],
    });
    expect(result.candidate?.puzzle.id).toBe("new");
    expect(result.repeatsExhaustedCatalog).toBe(false);
  });

  it("never escapes the requested tier or language", () => {
    const result = selectPracticePuzzle({
      ...base,
      recommendedBand: "B2",
      candidates: [
        candidate("medium", "B2", "a", { difficulty: "medium", publicTier: "medium" }),
        {
          ...candidate("ru-easy", "B2", "b"),
          puzzleRef: {
            language: "ru",
            puzzleId: "ru-easy",
            lineageId: "ru-easy",
            contentVersion: "catalog-v1",
          },
        },
      ],
    });
    expect(result.candidate).toBeUndefined();
    expect(result.source).toBe("none");
  });

  it("does not silently widen an unavailable band", () => {
    const result = selectPracticePuzzle({
      ...base,
      recommendedBand: "B2",
      candidates: [candidate("b1", "B1", "a")],
    });
    expect(result.candidate).toBeUndefined();
    expect(result.bandUnavailable).toBe(true);
  });

  it("relaxes only diversity when it would empty the valid pool", () => {
    const result = selectPracticePuzzle({
      ...base,
      recentTopicTags: ["food"],
      candidates: [candidate("food-1", "B1", "food")],
    });
    expect(result.candidate?.puzzle.id).toBe("food-1");
    expect(result.diversityRelaxed).toBe(true);
  });

  it("is deterministic for the same explicit state and seed", () => {
    const input = {
      ...base,
      selectionSequence: 14,
      candidates: [candidate("a", "B1", "x"), candidate("b", "B1", "y")],
    };
    expect(selectPracticePuzzle(input).candidate?.puzzle.id).toBe(
      selectPracticePuzzle(input).candidate?.puzzle.id,
    );
  });
});
