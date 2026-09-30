import { beforeEach, describe, expect, it } from "vitest";
import {
  clearAllLocalData,
  loadStats,
  saveStats,
  saveProgress,
  saveDailyHistory,
  saveOnboarded,
  saveActiveSession,
} from "../persistence";
import { INITIAL_STATS } from "../../game/types/stats";

function installLocalStorage(): void {
  const store = new Map<string, string>();
  (globalThis as { localStorage?: Storage }).localStorage = {
    get length() {
      return store.size;
    },
    key(i: number) {
      return Array.from(store.keys())[i] ?? null;
    },
    getItem(k: string) {
      return store.has(k) ? store.get(k)! : null;
    },
    setItem(k: string, v: string) {
      store.set(k, v);
    },
    removeItem(k: string) {
      store.delete(k);
    },
    clear() {
      store.clear();
    },
  } as Storage;
}

describe("persistence — clearAllLocalData", () => {
  beforeEach(() => {
    installLocalStorage();
  });

  it("wipes bestStreak and every foldwink-namespaced key", async () => {
    const high = { ...INITIAL_STATS, bestStreak: 9, currentStreak: 3, wins: 7 };
    saveStats(high);
    saveProgress({ cursor: 12, easyCursor: 12, mediumCursor: 4, hardCursor: 1 });
    saveDailyHistory({
      "2026-04-15": {
        date: "2026-04-15",
        puzzleId: "p1",
        result: "win",
        mistakesUsed: 1,
        durationMs: 60_000,
      },
    });
    saveOnboarded(true);
    saveActiveSession({
      puzzleId: "p1",
      savedAt: 123,
      active: {
        puzzleId: "p1",
        mode: "standard",
        order: [],
        selection: [],
        solvedGroupIds: [],
        mistakesUsed: 0,
        startedAt: 0,
        countsToStats: true,
        winkedGroupId: null,
      },
    });
    // Unrelated non-foldwink key must survive.
    localStorage.setItem("unrelated:key", "keep-me");

    // IndexedDB is intentionally unavailable in this fixture. The reset
    // contract reports that incomplete durable clear so the footer must not
    // reload and pretend the profile was fully removed.
    expect(await clearAllLocalData()).toBe(false);

    expect(loadStats().bestStreak).toBe(0);
    expect(loadStats().wins).toBe(0);
    expect(localStorage.getItem("foldwink:stats")).toBeNull();
    expect(localStorage.getItem("foldwink:progress")).toBeNull();
    expect(localStorage.getItem("foldwink:daily")).toBeNull();
    expect(localStorage.getItem("foldwink:onboarded")).toBeNull();
    expect(localStorage.getItem("foldwink:active-session")).toBeNull();
    expect(localStorage.getItem("unrelated:key")).toBe("keep-me");
  });

  it("round-trips bestStreak through save/load", () => {
    const saved = { ...INITIAL_STATS, bestStreak: 11, currentStreak: 4 };
    saveStats(saved);
    const loaded = loadStats();
    expect(loaded.bestStreak).toBe(11);
    expect(loaded.currentStreak).toBe(4);
  });
});
