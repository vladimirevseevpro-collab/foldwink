import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock persistence module so we can inspect which writers fire.
vi.mock("../../../../stats/persistence", () => ({
  saveStats: vi.fn(),
  saveProgress: vi.fn(),
  loadDailyHistory: vi.fn(() => ({})),
  saveDailyHistory: vi.fn(),
  saveOnboarded: vi.fn(),
  saveActiveSession: vi.fn(),
  clearActiveSession: vi.fn(),
}));

import * as persistence from "../../../../stats/persistence";
import { statsPersistenceObserver } from "../statsObserver";
import { sessionPersistenceObserver } from "../sessionObserver";
import { createStore } from "../../store";
import { INITIAL_STATS } from "../../../types/stats";
import type { Puzzle } from "../../../types/puzzle";

function mkPuzzle(id: string): Puzzle {
  return {
    id,
    title: id,
    difficulty: "easy",
    groups: [
      { id: "a", label: "A", items: ["a1", "a2", "a3", "a4"] },
      { id: "b", label: "B", items: ["b1", "b2", "b3", "b4"] },
      { id: "c", label: "C", items: ["c1", "c2", "c3", "c4"] },
      { id: "d", label: "D", items: ["d1", "d2", "d3", "d4"] },
    ],
  };
}

function makeStore() {
  const pool = [mkPuzzle("p1"), mkPuzzle("p2")];
  const easy = pool.filter((p) => p.difficulty === "easy");
  const wrap = (arr: Puzzle[], i: number): Puzzle | undefined =>
    arr.length === 0 ? undefined : arr[((i % arr.length) + arr.length) % arr.length];
  return createStore({
    pool,
    easyPool: easy,
    mediumPool: [],
    hardPool: [],
    getPuzzleById: (id) => pool.find((p) => p.id === id),
    getPuzzleByIndex: (i) => wrap(pool, i),
    getEasyByIndex: (i) => wrap(easy, i),
    getMediumByIndex: () => undefined,
    getHardByIndex: () => undefined,
    now: () => 1,
    todayLocal: () => "2026-01-01",
    initialStats: INITIAL_STATS,
    initialProgress: { cursor: 0, easyCursor: 0, mediumCursor: 0, hardCursor: 0 },
    initialTodayDailyRecord: null,
    initialOnboarded: true,
  });
}

describe("statsPersistenceObserver", () => {
  beforeEach(() => {
    vi.mocked(persistence.saveStats).mockClear();
    vi.mocked(persistence.saveProgress).mockClear();
    vi.mocked(persistence.saveOnboarded).mockClear();
    vi.mocked(persistence.saveDailyHistory).mockClear();
  });

  it("writes stats on stats change", () => {
    const store = makeStore();
    statsPersistenceObserver(store);
    store.setState({ stats: { ...store.getState().stats, wins: 1 } });
    expect(persistence.saveStats).toHaveBeenCalledTimes(1);
  });

  it("writes onboarded flag on toggle", () => {
    const store = makeStore();
    store.setState({ onboarded: false });
    statsPersistenceObserver(store);
    store.getState().completeOnboarding();
    expect(persistence.saveOnboarded).toHaveBeenCalledTimes(1);
  });

  it("does not persist replayable help as first-run state", () => {
    const store = makeStore();
    statsPersistenceObserver(store);
    store.getState().openHowToPlay();
    expect(persistence.saveOnboarded).not.toHaveBeenCalled();
  });

  it("does not write when unrelated slice changes", () => {
    const store = makeStore();
    statsPersistenceObserver(store);
    store.setState({ flash: "correct" });
    expect(persistence.saveStats).not.toHaveBeenCalled();
    expect(persistence.saveProgress).not.toHaveBeenCalled();
  });
});

describe("sessionPersistenceObserver", () => {
  beforeEach(() => {
    vi.mocked(persistence.saveActiveSession).mockClear();
    vi.mocked(persistence.clearActiveSession).mockClear();
  });

  it("saves active session when a game starts", () => {
    const store = makeStore();
    sessionPersistenceObserver(store);
    store.getState().startEasy();
    expect(persistence.saveActiveSession).toHaveBeenCalledTimes(1);
  });

  it("clears session when returning to menu", () => {
    const store = makeStore();
    sessionPersistenceObserver(store);
    store.getState().startEasy();
    vi.mocked(persistence.clearActiveSession).mockClear();
    store.getState().goToMenu();
    expect(persistence.clearActiveSession).toHaveBeenCalledTimes(1);
  });
});
