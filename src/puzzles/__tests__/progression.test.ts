import { describe, expect, it } from "vitest";
import { getNextProgressionPuzzle } from "../progression";
import type { Puzzle } from "../../game/types/puzzle";

const MOCK_POOL: Puzzle[] = [
  {
    id: "puzzle-0001",
    title: "Starter 1",
    difficulty: "easy",
    groups: [
      { id: "g1", label: "G1", items: ["A", "B", "C", "D"] },
      { id: "g2", label: "G2", items: ["E", "F", "G", "H"] },
      { id: "g3", label: "G3", items: ["I", "J", "K", "L"] },
      { id: "g4", label: "G4", items: ["M", "N", "O", "P"] },
    ],
  },
  {
    id: "puzzle-0002",
    title: "Starter 2",
    difficulty: "easy",
    groups: [
      { id: "g1", label: "G1", items: ["A", "B", "C", "D"] },
      { id: "g2", label: "G2", items: ["E", "F", "G", "H"] },
      { id: "g3", label: "G3", items: ["I", "J", "K", "L"] },
      { id: "g4", label: "G4", items: ["M", "N", "O", "P"] },
    ],
  },
  {
    id: "puzzle-0003",
    title: "Puzzle 3",
    difficulty: "easy",
    groups: [
      { id: "g1", label: "G1", items: ["A", "B", "C", "D"] },
      { id: "g2", label: "G2", items: ["E", "F", "G", "H"] },
      { id: "g3", label: "G3", items: ["I", "J", "K", "L"] },
      { id: "g4", label: "G4", items: ["M", "N", "O", "P"] },
    ],
  },
  {
    id: "puzzle-0004",
    title: "Puzzle 4",
    difficulty: "easy",
    groups: [
      { id: "g1", label: "G1", items: ["A", "B", "C", "D"] },
      { id: "g2", label: "G2", items: ["E", "F", "G", "H"] },
      { id: "g3", label: "G3", items: ["I", "J", "K", "L"] },
      { id: "g4", label: "G4", items: ["M", "N", "O", "P"] },
    ],
  },
  {
    id: "puzzle-0005",
    title: "Puzzle 5",
    difficulty: "easy",
    groups: [
      { id: "g1", label: "G1", items: ["A", "B", "C", "D"] },
      { id: "g2", label: "G2", items: ["E", "F", "G", "H"] },
      { id: "g3", label: "G3", items: ["I", "J", "K", "L"] },
      { id: "g4", label: "G4", items: ["M", "N", "O", "P"] },
    ],
  },
];

describe("getNextProgressionPuzzle", () => {
  it("guarantees hand-crafted starter puzzles on steps 0 and 1", () => {
    const p0 = getNextProgressionPuzzle({
      pool: MOCK_POOL,
      solvedIds: [],
      cursor: 0,
      difficulty: "easy",
      playerSeed: "user_seed_abc",
    });
    expect(p0?.id).toBe("puzzle-0001");

    const p1 = getNextProgressionPuzzle({
      pool: MOCK_POOL,
      solvedIds: ["puzzle-0001"],
      cursor: 1,
      difficulty: "easy",
      playerSeed: "user_seed_abc",
    });
    expect(p1?.id).toBe("puzzle-0002");
  });

  it("selects only unsolved puzzles for steps 2+", () => {
    const p2 = getNextProgressionPuzzle({
      pool: MOCK_POOL,
      solvedIds: ["puzzle-0001", "puzzle-0002", "puzzle-0003"],
      cursor: 2,
      difficulty: "easy",
      playerSeed: "user_seed_xyz",
    });
    expect(["puzzle-0004", "puzzle-0005"]).toContain(p2?.id);
  });

  it("produces deterministic output for the same player seed and cursor", () => {
    const pick1 = getNextProgressionPuzzle({
      pool: MOCK_POOL,
      solvedIds: [],
      cursor: 3,
      difficulty: "easy",
      playerSeed: "deterministic_seed_123",
    });
    const pick2 = getNextProgressionPuzzle({
      pool: MOCK_POOL,
      solvedIds: [],
      cursor: 3,
      difficulty: "easy",
      playerSeed: "deterministic_seed_123",
    });
    expect(pick1?.id).toBe(pick2?.id);
  });
});
