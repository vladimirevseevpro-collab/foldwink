import { describe, expect, it } from "vitest";
import { INITIAL_STATS } from "../../types/stats";
import type { Puzzle } from "../../types/puzzle";
import { createStore, type StoreDeps } from "../store";
import { installGameLifecycle } from "../lifecycle";

const puzzle: Puzzle = {
  id: "timing-fixture",
  title: "Timing fixture",
  difficulty: "easy",
  groups: [
    { id: "a", label: "A", items: ["a", "b", "c", "d"] },
    { id: "b", label: "B", items: ["e", "f", "g", "h"] },
    { id: "c", label: "C", items: ["i", "j", "k", "l"] },
    { id: "d", label: "D", items: ["m", "n", "o", "p"] },
  ],
};

function deps(monotonicNow: () => number): StoreDeps {
  return {
    pool: [puzzle],
    easyPool: [puzzle],
    mediumPool: [],
    hardPool: [],
    getPuzzleById: () => puzzle,
    getPuzzleByIndex: () => puzzle,
    getEasyByIndex: () => puzzle,
    getMediumByIndex: () => undefined,
    getHardByIndex: () => undefined,
    now: () => 10_000,
    monotonicNow,
    todayLocal: () => "2026-09-14",
    initialStats: { ...INITIAL_STATS },
    initialProgress: { cursor: 0 },
    initialTodayDailyRecord: null,
    initialOnboarded: true,
  };
}

describe("store foreground lifecycle seam", () => {
  it("persists foreground time on hide and excludes a hidden gap", () => {
    let mono = 100;
    const store = createStore(deps(() => mono));
    store.getState().startEasy();

    mono = 750;
    store.getState().pauseActiveTiming();
    expect(store.getState().active?.elapsedActiveMs).toBe(650);
    expect(store.getState().active?.revision).toBe(1);

    mono = 50_000; // background/sleep time is intentionally not counted.
    store.getState().resumeActiveTiming();
    mono = 50_250;
    store.getState().pauseActiveTiming();
    expect(store.getState().active?.elapsedActiveMs).toBe(900);
  });

  it("drops yesterday's in-memory Daily completion after rollover", () => {
    let date = "2026-09-14";
    const store = createStore({
      ...deps(() => 0),
      todayLocal: () => date,
      initialTodayDailyRecord: {
        date,
        puzzleId: puzzle.id,
        result: "win",
        mistakesUsed: 0,
        durationMs: 10,
      },
    });
    date = "2026-09-15";
    store.getState().refreshDaily();
    expect(store.getState().todayDailyRecord).toBeNull();
  });

  it("flushes on visibility hide and resumes only after foreground focus", () => {
    let mono = 0;
    const store = createStore(deps(() => mono));
    const documentListeners = new Map<string, EventListener>();
    const windowListeners = new Map<string, EventListener>();
    let hidden = false;
    const stop = installGameLifecycle(store, {
      document: {
        get hidden() {
          return hidden;
        },
        addEventListener: (name: string, listener: EventListenerOrEventListenerObject) => {
          if (typeof listener === "function") documentListeners.set(name, listener);
        },
        removeEventListener: (name: string) => documentListeners.delete(name),
      },
      window: {
        addEventListener: (name: string, listener: EventListenerOrEventListenerObject) => {
          if (typeof listener === "function") windowListeners.set(name, listener);
        },
        removeEventListener: (name: string) => windowListeners.delete(name),
        setTimeout: () => 1,
        clearTimeout: () => undefined,
      },
      nextMidnightDelayMs: () => 60_000,
    });
    store.getState().startEasy();
    mono = 100;
    hidden = true;
    documentListeners.get("visibilitychange")?.(new Event("visibilitychange"));
    expect(store.getState().active?.elapsedActiveMs).toBe(100);

    mono = 10_000;
    hidden = false;
    windowListeners.get("focus")?.(new Event("focus"));
    mono = 10_200;
    store.getState().pauseActiveTiming();
    expect(store.getState().active?.elapsedActiveMs).toBe(300);
    store.getState().resumeActiveTiming();
    mono = 10_300;
    windowListeners.get("pagehide")?.(new Event("pagehide"));
    expect(store.getState().active?.elapsedActiveMs).toBe(400);
    stop();
    expect(windowListeners.has("pagehide")).toBe(false);
  });
});
