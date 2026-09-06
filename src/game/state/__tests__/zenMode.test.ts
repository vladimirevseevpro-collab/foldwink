import { describe, it, expect } from "vitest";
import { createStore, type StoreDeps } from "../store";
import type { Puzzle } from "../../types/puzzle";
import { INITIAL_STATS } from "../../types/stats";

function mkPuzzle(id: string): Puzzle {
  return {
    id,
    title: `Puzzle ${id}`,
    difficulty: "easy",
    groups: [
      { id: "g1", label: "G1", items: [`${id}-a`, `${id}-b`, `${id}-c`, `${id}-d`] },
      { id: "g2", label: "G2", items: [`${id}-e`, `${id}-f`, `${id}-g`, `${id}-h`] },
      { id: "g3", label: "G3", items: [`${id}-i`, `${id}-j`, `${id}-k`, `${id}-l`] },
      { id: "g4", label: "G4", items: [`${id}-m`, `${id}-n`, `${id}-o`, `${id}-p`] },
    ],
  };
}

function makeDeps(pool: Puzzle[], opts: Partial<StoreDeps> = {}): StoreDeps {
  let t = 1_000_000;
  const byId = new Map(pool.map((p) => [p.id, p] as const));
  return {
    pool,
    easyPool: pool,
    mediumPool: pool,
    hardPool: pool,
    getPuzzleById: (id) => byId.get(id),
    getPuzzleByIndex: (i) => pool[i % pool.length],
    getEasyByIndex: (i) => pool[i % pool.length],
    getMediumByIndex: (i) => pool[i % pool.length],
    getHardByIndex: (i) => pool[i % pool.length],
    now: () => {
      t += 1000;
      return t;
    },
    todayLocal: () => "2026-09-06",
    initialStats: { ...INITIAL_STATS },
    initialProgress: { cursor: 0, zenCursor: 0 },
    initialTodayDailyRecord: null,
    initialOnboarded: true,
    ...opts,
  };
}

function solveCurrentPuzzle(store: ReturnType<typeof createStore>) {
  const puzzle = store.getState().puzzle!;
  for (const g of puzzle.groups) {
    for (const item of g.items) {
      store.getState().toggleSelection(item);
    }
    store.getState().submit();
  }
}

describe("Zen Streak Mode & Custom Puzzle", () => {
  it("starts Zen mode without affecting daily stats and advances sequentially", () => {
    const pool = [mkPuzzle("zen-1"), mkPuzzle("zen-2"), mkPuzzle("zen-3")];
    const store = createStore(makeDeps(pool));

    store.getState().startZen();
    expect(store.getState().screen).toBe("game");
    expect(store.getState().active?.mode).toBe("zen");
    expect(store.getState().active?.countsToStats).toBe(false);
    expect(store.getState().puzzle?.id).toBe("zen-1");

    // Solve zen-1
    solveCurrentPuzzle(store);
    expect(store.getState().progress.zenCursor).toBe(1);
    expect(store.getState().stats.zenStreak).toBe(1);
    expect(store.getState().stats.bestZenStreak).toBe(1);
    // Standard cursor and daily record are untouched
    expect(store.getState().progress.cursor).toBe(0);
    expect(store.getState().todayDailyRecord).toBeNull();

    // Next button in Zen mode starts next zen puzzle
    store.getState().startNextSame();
    expect(store.getState().puzzle?.id).toBe("zen-2");
    expect(store.getState().active?.mode).toBe("zen");

    // Solve zen-2
    solveCurrentPuzzle(store);
    expect(store.getState().progress.zenCursor).toBe(2);
    expect(store.getState().stats.zenStreak).toBe(2);
  });

  it("launches custom puzzle via startCustomPuzzle", () => {
    const pool = [mkPuzzle("base-1")];
    const store = createStore(makeDeps(pool));
    const custom = mkPuzzle("custom-shared-99");

    store.getState().startCustomPuzzle(custom);
    expect(store.getState().screen).toBe("game");
    expect(store.getState().puzzle?.id).toBe("custom-shared-99");
    expect(store.getState().active?.countsToStats).toBe(false);
  });
});
