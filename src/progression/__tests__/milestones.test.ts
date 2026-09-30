import { describe, expect, it } from "vitest";
import {
  earnedCollectionMilestones,
  newlyEarnedCollectionMilestone,
  nextCollectionMilestone,
  uniqueSolvedCount,
} from "../milestones";

const stats = (count: number) => ({
  solvedPuzzleIds: Array.from({ length: count }, (_, index) => `official-${index}`),
});

describe("deterministic collection milestones", () => {
  it("derives six ordered pages from unique official identities", () => {
    expect(earnedCollectionMilestones(stats(0))).toHaveLength(0);
    expect(earnedCollectionMilestones(stats(100)).map((item) => item.threshold)).toEqual([
      1, 5, 10, 25, 50, 100,
    ]);
    expect(uniqueSolvedCount({ solvedPuzzleIds: ["one", "one"] })).toBe(1);
  });

  it("shows the next target and only celebrates exact first crossing", () => {
    expect(nextCollectionMilestone(stats(6))?.threshold).toBe(10);
    expect(newlyEarnedCollectionMilestone(stats(10))?.id).toBe("milestone_ten_dispatches");
    expect(newlyEarnedCollectionMilestone(stats(11))).toBeNull();
  });
});
