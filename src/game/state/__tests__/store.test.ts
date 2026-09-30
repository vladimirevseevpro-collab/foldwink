import { describe, it, expect } from "vitest";
import { createStore, type StoreDeps } from "../store";
import type { Puzzle } from "../../types/puzzle";
import { INITIAL_STATS } from "../../types/stats";
import type { EditorialRecord } from "../../../puzzles/catalog";

function mkPuzzle(id: string, overrides: Partial<Puzzle> = {}): Puzzle {
  return {
    id,
    title: id,
    difficulty: "easy",
    groups: [
      { id: "g1", label: "G1", items: ["a", "b", "c", "d"] },
      { id: "g2", label: "G2", items: ["e", "f", "g", "h"] },
      { id: "g3", label: "G3", items: ["i", "j", "k", "l"] },
      { id: "g4", label: "G4", items: ["m", "n", "o", "p"] },
    ],
    ...overrides,
  };
}

function makeDeps(pool: Puzzle[], opts: Partial<StoreDeps> = {}): StoreDeps {
  let t = 1_000_000;
  const byId = new Map(pool.map((p) => [p.id, p] as const));
  const easyPool = pool.filter((p) => p.difficulty === "easy");
  const mediumPool = pool.filter((p) => p.difficulty === "medium");
  const hardPool = pool.filter((p) => p.difficulty === "hard");
  const wrap = (arr: Puzzle[], i: number): Puzzle | undefined =>
    arr.length === 0 ? undefined : arr[((i % arr.length) + arr.length) % arr.length];
  return {
    pool,
    easyPool,
    mediumPool,
    hardPool,
    getPuzzleById: (id) => byId.get(id),
    getPuzzleByIndex: (i) => wrap(pool, i),
    getEasyByIndex: (i) => wrap(easyPool, i),
    getMediumByIndex: (i) => wrap(mediumPool, i),
    getHardByIndex: (i) => wrap(hardPool, i),
    getStarterManifest: () => undefined,
    getDailyEntry: (language, date) => {
      const puzzle = pool[0];
      if (!puzzle) return undefined;
      return {
        entryId: `daily-${language}-${date}`,
        date,
        language,
        puzzleId: puzzle.id,
        lineageId: puzzle.id,
        contentVersion: "test-catalog-v1",
        scheduleVersion: "test-calendar-v1",
      };
    },
    now: () => {
      t += 1000;
      return t;
    },
    todayLocal: () => "2026-04-11",
    initialStats: { ...INITIAL_STATS },
    initialProgress: { cursor: 0, easyCursor: 0, mediumCursor: 0, hardCursor: 0 },
    initialTodayDailyRecord: null,
    initialOnboarded: true,
    ...opts,
  };
}

function winCurrentPuzzle(store: ReturnType<typeof createStore>) {
  const puzzle = store.getState().puzzle!;
  for (const g of puzzle.groups) {
    for (const item of g.items) store.getState().toggleSelection(item);
    store.getState().submit();
  }
}

function loseCurrentPuzzle(store: ReturnType<typeof createStore>) {
  const puzzle = store.getState().puzzle!;
  for (let itemIndex = 0; itemIndex < 4; itemIndex++) {
    store.getState().clearSelection();
    for (const group of puzzle.groups) {
      store.getState().toggleSelection(group.items[itemIndex]);
    }
    store.getState().submit();
  }
}

describe("store — standard mode", () => {
  it("delegates legacy passport import through the persistence boundary", async () => {
    const puzzle = mkPuzzle("passport-fixture");
    let received: unknown = null;
    const store = createStore(
      makeDeps([puzzle], {
        commitLegacyPassport: async (details) => {
          received = details;
          return true;
        },
      }),
    );
    const details = {
      playerSeed: "portable-seed",
      sealId: "seal_compass",
      nibId: "nib_obsidian",
      titleId: "title_connections",
      collectedStampIds: ["stamp_midori_compass"],
    };

    await expect(store.getState().importLegacyPassport(details)).resolves.toBe(true);
    expect(received).toEqual(details);
  });

  it("selects only ready catalog content and records exposure diversity", () => {
    const seen = mkPuzzle("seen");
    const fresh = mkPuzzle("fresh");
    const editorial = (puzzle: Puzzle, topic: string): EditorialRecord => ({
      puzzleRef: {
        language: "en",
        puzzleId: puzzle.id,
        lineageId: puzzle.id,
        contentVersion: "test-catalog-v1",
      },
      publicTier: "easy",
      band: "B1",
      vocabularyFamiliarity: "common",
      relationTypes: ["classification"],
      topicTags: [topic],
      anchorGroupId: "g1",
      ambiguityRisk: "low",
      tabReview: "not-applicable",
      mobileFit: "approved",
      authorReview: { reviewerId: "author", date: "2026-09-14" },
      independentReview: { reviewerId: "validator", date: "2026-09-14" },
      playtest: null,
      status: "ready",
    });
    const records = new Map([
      [seen.id, editorial(seen, "old-topic")],
      [fresh.id, editorial(fresh, "fresh-topic")],
    ]);
    const store = createStore(
      makeDeps([seen, fresh], {
        getEditorialRecord: (_language, puzzleId) => records.get(puzzleId),
        getPlayerSeed: () => "player-1",
        initialProgress: { cursor: 0, seenLineageIds: [seen.id], selectionSequence: 4 },
      }),
    );

    store.getState().startEasy();

    expect(store.getState().puzzle?.id).toBe(fresh.id);
    expect(store.getState().active?.puzzleRef).toEqual(records.get(fresh.id)?.puzzleRef);
    expect(store.getState().progress.selectionSequence).toBe(5);
    expect(store.getState().progress.seenLineageIds).toEqual([seen.id, fresh.id]);
    expect(store.getState().progress.recentTopicTags).toEqual(["fresh-topic"]);
    expect(store.getState().progress.recentItemValues).toHaveLength(16);
  });

  it("follows explicit starter entries across difficulty tiers", () => {
    const easy = mkPuzzle("intro-easy");
    const medium = mkPuzzle("intro-wink", { difficulty: "medium" });
    const starterManifest = {
      language: "en" as const,
      catalogVersion: "test-catalog-v1",
      entries: [
        {
          entryId: "starter-1",
          order: 1,
          role: "first-connection",
          band: "B0" as const,
          puzzleRef: {
            language: "en" as const,
            puzzleId: easy.id,
            lineageId: easy.id,
            contentVersion: "test-catalog-v1",
          },
        },
        {
          entryId: "starter-2",
          order: 2,
          role: "wink-introduction",
          band: "B2" as const,
          puzzleRef: {
            language: "en" as const,
            puzzleId: medium.id,
            lineageId: medium.id,
            contentVersion: "test-catalog-v1",
          },
        },
        ...[3, 4, 5, 6].map((order) => ({
          entryId: `starter-${order}`,
          order,
          role: "later",
          band: "B1" as const,
          puzzleRef: {
            language: "en" as const,
            puzzleId: `missing-${order}`,
            lineageId: `missing-${order}`,
            contentVersion: "test-catalog-v1",
          },
        })),
      ],
    };
    const store = createStore(
      makeDeps([easy, medium], { getStarterManifest: () => starterManifest }),
    );

    store.getState().startStandard();
    expect(store.getState().puzzle?.id).toBe(easy.id);
    expect(store.getState().progress.selectionSequence).toBe(1);
    expect(store.getState().progress.seenLineageIds).toEqual([easy.id]);
    winCurrentPuzzle(store);
    expect(store.getState().progress.completedStarterEntryIds).toEqual(["starter-1"]);

    store.getState().startNextSame();
    expect(store.getState().puzzle?.id).toBe(medium.id);
    expect(store.getState().active?.starterEntryId).toBe("starter-2");
    expect(store.getState().progress.selectionSequence).toBe(2);
  });

  it("advances cursor on win", () => {
    const pool = [mkPuzzle("p1"), mkPuzzle("p2"), mkPuzzle("p3")];
    const store = createStore(makeDeps(pool));

    store.getState().startStandard();
    expect(store.getState().puzzle!.id).toBe("p1");
    winCurrentPuzzle(store);
    expect(store.getState().progress.cursor).toBe(1);
    expect(store.getState().screen).toBe("result");

    store.getState().goToMenu();
    store.getState().startStandard();
    expect(store.getState().puzzle!.id).toBe("p2");
  });

  it("does not advance cursor on loss", () => {
    const pool = [mkPuzzle("p1"), mkPuzzle("p2")];
    const store = createStore(makeDeps(pool));
    store.getState().startStandard();

    loseCurrentPuzzle(store);
    expect(store.getState().summary?.result).toBe("loss");
    expect(store.getState().progress.cursor).toBe(0);
    expect(store.getState().stats.losses).toBe(1);
  });

  it("retries the same pinned board without advancing selectionSequence", () => {
    const target = mkPuzzle("retry-me");
    const store = createStore(makeDeps([target]));
    store.getState().startEasy();
    const first = store.getState().active!;
    loseCurrentPuzzle(store);
    const sequence = store.getState().progress.selectionSequence;

    store.getState().retryCurrent();
    const retry = store.getState().active!;
    expect(store.getState().puzzle?.id).toBe(target.id);
    expect(retry.attemptId).not.toBe(first.attemptId);
    expect(retry.parentAttemptId).toBe(first.attemptId);
    expect(retry.puzzleRef).toEqual(first.puzzleRef);
    expect(store.getState().progress.selectionSequence).toBe(sequence);
  });

  it("wraps cursor past the end of pool", () => {
    const pool = [mkPuzzle("p1"), mkPuzzle("p2")];
    const store = createStore(makeDeps(pool, { initialProgress: { cursor: 5 } }));
    store.getState().startStandard();
    expect(store.getState().puzzle!.id).toBe("p2");
  });
});

describe("store — result-hold timing", () => {
  it("defers screen:'result' through scheduleTransition and keeps screen:'game' until fired", async () => {
    const pool = [mkPuzzle("p1"), mkPuzzle("p2")];
    const pending: Array<{ cb: () => void; ms: number }> = [];
    const schedule = (cb: () => void, ms: number) => {
      pending.push({ cb, ms });
    };
    const store = createStore(makeDeps(pool, { scheduleTransition: schedule }));
    store.getState().startStandard();
    winCurrentPuzzle(store);
    // Hold: state finalized (summary present, stats updated) but screen
    // stays on game until the scheduled callback fires.
    expect(store.getState().active?.result).toBe("win");
    expect(store.getState().summary).not.toBeNull();
    expect(store.getState().screen).toBe("game");
    expect(pending).toHaveLength(1);
    expect(pending[0].ms).toBe(600);
    pending[0].cb();
    expect(store.getState().screen).toBe("result");
  });

  it("does not clobber screen if player navigated away during the hold", () => {
    const pool = [mkPuzzle("p1")];
    const pending: Array<{ cb: () => void; ms: number }> = [];
    const schedule = (cb: () => void, ms: number) => {
      pending.push({ cb, ms });
    };
    const store = createStore(makeDeps(pool, { scheduleTransition: schedule }));
    store.getState().startStandard();
    winCurrentPuzzle(store);
    store.getState().goToMenu();
    expect(store.getState().screen).toBe("menu");
    pending[0].cb();
    expect(store.getState().screen).toBe("menu");
  });
});

describe("store — daily mode", () => {
  it("records daily completion and blocks stat double-count on replay", () => {
    const pool = [mkPuzzle("p1"), mkPuzzle("p2")];
    const store = createStore(makeDeps(pool));

    store.getState().startDaily();
    winCurrentPuzzle(store);
    expect(store.getState().todayDailyRecord?.date).toBe("2026-04-11");
    expect(store.getState().stats.wins).toBe(1);

    store.getState().goToMenu();
    store.getState().startDaily();
    expect(store.getState().active!.countsToStats).toBe(false);
    winCurrentPuzzle(store);
    expect(store.getState().stats.wins).toBe(1);
  });

  it("replays the exact pinned Daily board after the published calendar changes", () => {
    const first = mkPuzzle("daily-v1", { title: "Original daily" });
    const replacement = mkPuzzle("daily-v2", {
      title: "Replacement daily",
      groups: [
        { id: "r1", label: "R1", items: ["q", "r", "s", "t"] },
        { id: "r2", label: "R2", items: ["u", "v", "w", "x"] },
        { id: "r3", label: "R3", items: ["y", "z", "aa", "bb"] },
        { id: "r4", label: "R4", items: ["cc", "dd", "ee", "ff"] },
      ],
    });
    let publishedPuzzle = first;
    const store = createStore(
      makeDeps([first, replacement], {
        getDailyEntry: (language, date) => ({
          entryId: `daily-${language}-${date}-${publishedPuzzle.id}`,
          date,
          language,
          puzzleId: publishedPuzzle.id,
          lineageId: publishedPuzzle.id,
          contentVersion: `${publishedPuzzle.id}-content-v1`,
          scheduleVersion: `${publishedPuzzle.id}-calendar-v1`,
        }),
      }),
    );

    store.getState().startDaily();
    winCurrentPuzzle(store);
    const recorded = store.getState().todayDailyRecord;
    expect(recorded?.puzzleSnapshot).toEqual(first);
    expect(recorded?.puzzleRef?.puzzleId).toBe(first.id);

    publishedPuzzle = replacement;
    store.getState().goToMenu();
    store.getState().startDaily();

    expect(store.getState().puzzle).toEqual(first);
    expect(store.getState().active?.countsToStats).toBe(false);
    expect(store.getState().active?.puzzleRef).toEqual(recorded?.puzzleRef);
    expect(store.getState().active?.daily).toEqual({
      entryId: recorded?.entryId,
      date: recorded?.date,
      scheduleVersion: recorded?.scheduleVersion,
    });
  });

  it("replays a legacy Daily record through today's calendar when no snapshot exists", () => {
    const published = mkPuzzle("published-daily");
    const store = createStore(
      makeDeps([published], {
        initialTodayDailyRecord: {
          date: "2026-04-11",
          puzzleId: "removed-legacy-daily",
          result: "win",
          mistakesUsed: 1,
          durationMs: 90_000,
          language: "en",
          entryId: "legacy-daily:en:2026-04-11",
          scheduleVersion: "legacy-calendar-v1",
          puzzleRef: {
            language: "en",
            puzzleId: "removed-legacy-daily",
            lineageId: "removed-legacy-daily",
            contentVersion: "legacy-content-v1",
          },
          attemptId: "legacy-attempt",
        },
      }),
    );

    store.getState().startDaily();

    expect(store.getState().puzzle).toEqual(published);
    expect(store.getState().active?.countsToStats).toBe(false);
  });

  it("uses the published entry even when Medium is not unlocked", () => {
    const pool = [
      mkPuzzle("e1"),
      mkPuzzle("e2"),
      mkPuzzle("m1", { difficulty: "medium" }),
      mkPuzzle("m2", { difficulty: "medium" }),
      mkPuzzle("h1", { difficulty: "hard" }),
    ];
    const store = createStore(
      makeDeps(pool, {
        getDailyEntry: (language, date) => ({
          entryId: `daily-${language}-${date}`,
          date,
          language,
          puzzleId: "m1",
          lineageId: "m1",
          contentVersion: "test-catalog-v1",
          scheduleVersion: "test-calendar-v1",
        }),
      }),
    );
    store.getState().startDaily();
    expect(store.getState().puzzle!.id).toBe("m1");
    expect(store.getState().active?.daily?.entryId).toBe("daily-en-2026-04-11");
  });

  it("does not change the Daily identity when stats or unlocks differ", () => {
    const pool = [
      mkPuzzle("e1"),
      mkPuzzle("m1", { difficulty: "medium" }),
      mkPuzzle("m2", { difficulty: "medium" }),
    ];
    const fresh = createStore(makeDeps(pool));
    const experienced = createStore(
      makeDeps(pool, {
        initialStats: {
          ...INITIAL_STATS,
          wins: 5,
          gamesPlayed: 5,
          mediumWins: 0,
        },
      }),
    );
    fresh.getState().startDaily();
    experienced.getState().startDaily();
    expect(fresh.getState().active?.puzzleRef).toEqual(
      experienced.getState().active?.puzzleRef,
    );
    expect(fresh.getState().active?.daily).toEqual(experienced.getState().active?.daily);
  });

  it("stays on the menu when the published horizon has no entry", () => {
    const store = createStore(makeDeps([mkPuzzle("p1")], { getDailyEntry: () => undefined }));
    store.getState().startDaily();
    expect(store.getState().screen).toBe("menu");
    expect(store.getState().active).toBeNull();
  });
});

describe("store — selection limits", () => {
  it("caps selection at 4", () => {
    const pool = [mkPuzzle("p1")];
    const store = createStore(makeDeps(pool));
    store.getState().startStandard();
    store.getState().toggleSelection("a");
    store.getState().toggleSelection("b");
    store.getState().toggleSelection("c");
    store.getState().toggleSelection("d");
    store.getState().toggleSelection("e");
    expect(store.getState().active!.selection).toEqual(["a", "b", "c", "d"]);
  });

  it("deselects on second tap", () => {
    const pool = [mkPuzzle("p1")];
    const store = createStore(makeDeps(pool));
    store.getState().startStandard();
    store.getState().toggleSelection("a");
    store.getState().toggleSelection("a");
    expect(store.getState().active!.selection).toEqual([]);
  });

  it("keeps an incorrect quartet selected and does not consume it twice", () => {
    const store = createStore(makeDeps([mkPuzzle("p1")]));
    store.getState().startStandard();
    for (const item of ["a", "e", "i", "m"]) store.getState().toggleSelection(item);
    store.getState().submit();
    expect(store.getState().active?.mistakesUsed).toBe(1);
    expect(store.getState().active?.selection).toEqual(["a", "e", "i", "m"]);

    store.getState().submit();

    expect(store.getState().active?.mistakesUsed).toBe(1);
    expect(store.getState().active?.selection).toEqual(["a", "e", "i", "m"]);
    expect(store.getState().flash).toBe("repeat");

    store.getState().toggleSelection("m");
    store.getState().toggleSelection("n");
    expect(store.getState().active?.selection).toEqual(["a", "e", "i", "n"]);
  });
});

describe("store — streak delta", () => {
  it("reports streak delta on a winning submit", () => {
    const pool = [mkPuzzle("p1"), mkPuzzle("p2")];
    const store = createStore(makeDeps(pool));
    store.getState().startStandard();
    winCurrentPuzzle(store);
    expect(store.getState().streakDelta).toBe(1);
    expect(store.getState().stats.currentStreak).toBe(1);
  });

  it("resets streak delta on a fresh game", () => {
    const pool = [mkPuzzle("p1"), mkPuzzle("p2")];
    const store = createStore(makeDeps(pool));
    store.getState().startStandard();
    winCurrentPuzzle(store);
    store.getState().goToMenu();
    store.getState().startStandard();
    expect(store.getState().streakDelta).toBe(0);
  });
});

describe("store — newBest record flag", () => {
  it("first-ever win sets newBest=true and bestStreak=1", () => {
    const pool = [mkPuzzle("p1")];
    const store = createStore(makeDeps(pool));
    store.getState().startStandard();
    winCurrentPuzzle(store);
    expect(store.getState().stats.bestStreak).toBe(1);
    expect(store.getState().newBest).toBe(true);
  });

  it("strictly beating the previous best sets newBest=true", () => {
    const pool = [mkPuzzle("p1"), mkPuzzle("p2"), mkPuzzle("p3"), mkPuzzle("p4")];
    const store = createStore(
      makeDeps(pool, {
        initialStats: { ...INITIAL_STATS, bestStreak: 2, currentStreak: 0 },
      }),
    );
    // First two wins are below best — flag should stay false.
    store.getState().startStandard();
    winCurrentPuzzle(store);
    expect(store.getState().newBest).toBe(false);
    store.getState().goToMenu();
    store.getState().startStandard();
    winCurrentPuzzle(store);
    // currentStreak=2, bestStreak still 2 → tie, not a new best.
    expect(store.getState().stats.bestStreak).toBe(2);
    expect(store.getState().newBest).toBe(false);
    store.getState().goToMenu();
    store.getState().startStandard();
    winCurrentPuzzle(store);
    // Strict improvement: bestStreak 2 → 3.
    expect(store.getState().stats.bestStreak).toBe(3);
    expect(store.getState().newBest).toBe(true);
  });

  it("tying the previous best does NOT set newBest", () => {
    const pool = [mkPuzzle("p1"), mkPuzzle("p2"), mkPuzzle("p3")];
    const store = createStore(
      makeDeps(pool, {
        initialStats: { ...INITIAL_STATS, bestStreak: 5, currentStreak: 0 },
      }),
    );
    for (let i = 0; i < 3; i++) {
      store.getState().startStandard();
      winCurrentPuzzle(store);
      expect(store.getState().newBest).toBe(false);
      store.getState().goToMenu();
    }
    expect(store.getState().stats.bestStreak).toBe(5);
  });

  it("a loss never sets newBest and does not shrink bestStreak", () => {
    const pool = [mkPuzzle("p1")];
    const store = createStore(
      makeDeps(pool, {
        initialStats: { ...INITIAL_STATS, bestStreak: 4, currentStreak: 4 },
      }),
    );
    store.getState().startStandard();
    loseCurrentPuzzle(store);
    expect(store.getState().summary?.result).toBe("loss");
    expect(store.getState().newBest).toBe(false);
    expect(store.getState().stats.bestStreak).toBe(4);
    expect(store.getState().stats.currentStreak).toBe(0);
  });

  it("newBest is reset when a fresh game starts", () => {
    const pool = [mkPuzzle("p1"), mkPuzzle("p2")];
    const store = createStore(makeDeps(pool));
    store.getState().startStandard();
    winCurrentPuzzle(store);
    expect(store.getState().newBest).toBe(true);
    store.getState().goToMenu();
    expect(store.getState().newBest).toBe(false);
    store.getState().startStandard();
    expect(store.getState().newBest).toBe(false);
  });

  it("daily replay cannot trigger a new best", () => {
    const pool = [mkPuzzle("p1")];
    const store = createStore(makeDeps(pool));
    store.getState().startDaily();
    winCurrentPuzzle(store);
    const firstBest = store.getState().stats.bestStreak;
    expect(store.getState().newBest).toBe(true);

    store.getState().goToMenu();
    store.getState().startDaily();
    // Replay must not count toward stats.
    expect(store.getState().active!.countsToStats).toBe(false);
    winCurrentPuzzle(store);
    expect(store.getState().stats.bestStreak).toBe(firstBest);
    expect(store.getState().newBest).toBe(false);
  });

  it("abandoning mid-run (no submit) leaves bestStreak untouched", () => {
    const pool = [mkPuzzle("p1"), mkPuzzle("p2")];
    const store = createStore(
      makeDeps(pool, {
        initialStats: { ...INITIAL_STATS, bestStreak: 7, currentStreak: 7 },
      }),
    );
    store.getState().startStandard();
    store.getState().toggleSelection("a");
    store.getState().toggleSelection("b");
    store.getState().goToMenu();
    expect(store.getState().stats.bestStreak).toBe(7);
    expect(store.getState().stats.currentStreak).toBe(7);
    expect(store.getState().newBest).toBe(false);
  });
});

describe("store — saved attempt continuation", () => {
  it("opens an already pinned in-progress attempt only through explicit Continue", () => {
    const puzzle = mkPuzzle("saved-puzzle");
    const source = createStore(makeDeps([puzzle]));
    source.getState().startEasy();
    const saved = source.getState().active!;
    const restored = createStore(
      makeDeps([puzzle], {
        initialActive: saved,
        initialPuzzle: puzzle,
        initialScreen: "menu",
      }),
    );

    expect(restored.getState().screen).toBe("menu");
    expect(restored.getState().active?.attemptId).toBe(saved.attemptId);
    restored.getState().resumeActive();
    expect(restored.getState().screen).toBe("game");
    expect(restored.getState().active).toBe(saved);
  });
});

describe("store — onboarding", () => {
  it("completion flips the persisted first-run flag", () => {
    const pool = [mkPuzzle("p1")];
    const store = createStore(makeDeps(pool, { initialOnboarded: false }));
    expect(store.getState().onboarded).toBe(false);
    store.getState().completeOnboarding();
    expect(store.getState().onboarded).toBe(true);
  });

  it("replays help without changing first-run completion", () => {
    const pool = [mkPuzzle("p1")];
    const store = createStore(makeDeps(pool, { initialOnboarded: true }));
    store.getState().openHowToPlay();
    expect(store.getState().howToPlayOpen).toBe(true);
    expect(store.getState().onboarded).toBe(true);
    store.getState().closeHowToPlay();
    expect(store.getState().howToPlayOpen).toBe(false);
    expect(store.getState().onboarded).toBe(true);
  });
});

describe("store — easy vs medium mode split", () => {
  it("startEasy only picks from the easy pool", () => {
    const pool = [
      mkPuzzle("e1"),
      mkPuzzle("m1", { difficulty: "medium" }),
      mkPuzzle("e2"),
      mkPuzzle("m2", { difficulty: "medium" }),
    ];
    const store = createStore(makeDeps(pool));
    store.getState().startEasy();
    expect(store.getState().puzzle!.id).toBe("e1");
    expect(store.getState().puzzle!.difficulty).toBe("easy");
  });

  it("startMedium only picks from the medium pool", () => {
    const pool = [
      mkPuzzle("e1"),
      mkPuzzle("m1", { difficulty: "medium" }),
      mkPuzzle("e2"),
      mkPuzzle("m2", { difficulty: "medium" }),
    ];
    const store = createStore(makeDeps(pool));
    store.getState().startMedium();
    expect(store.getState().puzzle!.id).toBe("m1");
    expect(store.getState().puzzle!.difficulty).toBe("medium");
  });

  it("advances mediumCursor independently of easyCursor on medium win", () => {
    const pool = [
      mkPuzzle("e1"),
      mkPuzzle("m1", { difficulty: "medium" }),
      mkPuzzle("m2", { difficulty: "medium" }),
    ];
    const store = createStore(makeDeps(pool));
    store.getState().startMedium();
    winCurrentPuzzle(store);
    expect(store.getState().progress.mediumCursor).toBe(1);
    // Easy cursor should be untouched.
    expect(store.getState().progress.easyCursor ?? 0).toBe(0);
  });

  it("records medium losses and bumps mediumLossStreak via store", () => {
    const pool = [mkPuzzle("m1", { difficulty: "medium" })];
    const store = createStore(makeDeps(pool));
    store.getState().startMedium();
    // Force a loss: select 4 items from different groups, submit until dead.
    loseCurrentPuzzle(store);
    const s = store.getState().stats;
    expect(s.losses).toBeGreaterThanOrEqual(1);
    expect(s.mediumLossStreak ?? 0).toBeGreaterThanOrEqual(1);
  });
});

describe("store — wink mechanic", () => {
  const mediumPool = [mkPuzzle("m1", { difficulty: "medium" })];
  const easyPool = [mkPuzzle("e1")];

  it("winks an unsolved tab on medium puzzles", () => {
    const store = createStore(makeDeps(mediumPool));
    store.getState().startStandard();
    expect(store.getState().active!.winkedGroupId).toBeNull();
    store.getState().winkTab("g2");
    expect(store.getState().active!.winkedGroupId).toBe("g2");
  });

  it("refuses a second wink in the same game", () => {
    const store = createStore(makeDeps(mediumPool));
    store.getState().startStandard();
    store.getState().winkTab("g2");
    store.getState().winkTab("g3");
    expect(store.getState().active!.winkedGroupId).toBe("g2");
  });

  it("refuses winking a solved group", () => {
    const store = createStore(makeDeps(mediumPool));
    store.getState().startStandard();
    for (const item of ["a", "b", "c", "d"]) store.getState().toggleSelection(item);
    store.getState().submit();
    store.getState().winkTab("g1");
    expect(store.getState().active!.winkedGroupId).toBeNull();
  });

  it("refuses winking on easy puzzles", () => {
    const store = createStore(makeDeps(easyPool));
    store.getState().startStandard();
    store.getState().winkTab("g1");
    expect(store.getState().active!.winkedGroupId).toBeNull();
  });

  it("refuses winking an unknown group id", () => {
    const store = createStore(makeDeps(mediumPool));
    store.getState().startStandard();
    store.getState().winkTab("ghost");
    expect(store.getState().active!.winkedGroupId).toBeNull();
  });

  it("resets winkedGroupId on a fresh game", () => {
    const pool = [
      mkPuzzle("m1", { difficulty: "medium" }),
      mkPuzzle("m2", { difficulty: "medium" }),
    ];
    const store = createStore(makeDeps(pool));
    store.getState().startStandard();
    store.getState().winkTab("g2");
    expect(store.getState().active!.winkedGroupId).toBe("g2");
    store.getState().goToMenu();
    store.getState().startStandard();
    expect(store.getState().active!.winkedGroupId).toBeNull();
  });

  it("refuses winking after the game has ended", () => {
    const store = createStore(makeDeps(mediumPool));
    store.getState().startStandard();
    loseCurrentPuzzle(store);
    expect(store.getState().summary?.result).toBe("loss");
    store.getState().winkTab("g1");
    expect(store.getState().active!.winkedGroupId).toBeNull();
  });
});

describe("store — mastery challenge", () => {
  it("allows one mistake and ends on the second without counting normal stats", () => {
    const puzzle = mkPuzzle("m1", { difficulty: "medium" });
    const store = createStore(makeDeps([puzzle]));

    store.getState().startMastery();
    expect(store.getState().active).toMatchObject({
      context: "mastery",
      countsToStats: false,
      rules: { maxIncorrectGuesses: 2, maxWinks: 1 },
    });

    for (const item of ["a", "e", "i", "m"]) store.getState().toggleSelection(item);
    store.getState().submit();
    expect(store.getState().active?.result).toBeUndefined();
    expect(store.getState().active?.mistakesUsed).toBe(1);

    store.getState().clearSelection();
    for (const item of ["b", "f", "j", "n"]) store.getState().toggleSelection(item);
    store.getState().submit();
    expect(store.getState().active?.result).toBe("loss");
    expect(store.getState().stats.gamesPlayed).toBe(0);
  });
});

describe("store — duel mode", () => {
  it("starts duel with specified puzzle id and challenger metrics", () => {
    const puzzle = mkPuzzle("duel-puzzle-1");
    const store = createStore(makeDeps([puzzle]));
    store.getState().startDuel("duel-puzzle-1", 2, 45);

    expect(store.getState().screen).toBe("game");
    expect(store.getState().puzzle?.id).toBe("duel-puzzle-1");
    expect(store.getState().duel).toEqual({
      puzzleId: "duel-puzzle-1",
      challengerMistakes: 2,
      challengerTimeSec: 45,
      challenge: { source: "legacy" },
    });
    expect(store.getState().active?.countsToStats).toBe(false);
  });

  it("clears duel state when returning to menu", () => {
    const puzzle = mkPuzzle("duel-puzzle-2");
    const store = createStore(makeDeps([puzzle]));
    store.getState().startDuel("duel-puzzle-2", 1, 30);
    expect(store.getState().duel).not.toBeNull();

    store.getState().goToMenu();
    expect(store.getState().duel).toBeNull();
    expect(store.getState().screen).toBe("menu");
  });

  it("clears duel state when starting regular modes (easy, medium, hard, daily)", () => {
    const puzzle = mkPuzzle("duel-puzzle-3");
    const store = createStore(makeDeps([puzzle]));
    store.getState().startDuel("duel-puzzle-3", 1, 30);
    expect(store.getState().duel).not.toBeNull();

    store.getState().startEasy();
    expect(store.getState().duel).toBeNull();

    store.getState().startDuel("duel-puzzle-3", 1, 30);
    expect(store.getState().duel).not.toBeNull();
    store.getState().startDaily();
    expect(store.getState().duel).toBeNull();
  });
});
