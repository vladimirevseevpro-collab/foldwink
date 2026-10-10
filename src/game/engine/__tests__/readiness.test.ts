import { describe, it, expect } from "vitest";
import {
  mediumReadiness,
  hardReadiness,
  EASY_NUDGE_AT,
  MEDIUM_UNLOCK_AT,
  FALLBACK_LOSS_STREAK,
  HARD_UNLOCK_AT,
  HARD_RECOMMEND_MEDIUM_WINS,
  HARD_FALLBACK_LOSS_STREAK,
} from "../readiness";
import { INITIAL_STATS, type Stats, type RecentSolve } from "../../types/stats";

function mk(overrides: Partial<Stats> = {}): Stats {
  return { ...INITIAL_STATS, ...overrides };
}

function solve(
  difficulty: "easy" | "medium",
  result: "win" | "loss",
  mistakesUsed: number,
  durationMs: number,
): RecentSolve {
  return { difficulty, result, mistakesUsed, durationMs };
}

describe("mediumReadiness — unlock and nudge", () => {
  it("empty record is locked and shows no nudge", () => {
    const r = mediumReadiness(mk());
    expect(r.unlocked).toBe(false);
    expect(r.showNudge).toBe(false);
    expect(r.level).toBe("locked");
  });

  it("fewer than 3 easy wins — still locked, no nudge", () => {
    const r = mediumReadiness(mk({ wins: 2, gamesPlayed: 2 }));
    expect(r.unlocked).toBe(false);
    expect(r.showNudge).toBe(false);
    expect(r.level).toBe("locked");
  });

  it(`${EASY_NUDGE_AT} easy wins — early nudge appears`, () => {
    const r = mediumReadiness(mk({ wins: EASY_NUDGE_AT, gamesPlayed: EASY_NUDGE_AT }));
    expect(r.unlocked).toBe(false);
    expect(r.showNudge).toBe(true);
    expect(r.level).toBe("locked");
    expect(r.caption.toLowerCase()).toContain("easy");
  });

  it(`${MEDIUM_UNLOCK_AT} easy wins — medium unlocks`, () => {
    const r = mediumReadiness(mk({ wins: MEDIUM_UNLOCK_AT, gamesPlayed: MEDIUM_UNLOCK_AT }));
    expect(r.unlocked).toBe(true);
    expect(r.showNudge).toBe(false);
  });

  it("unlock does not regress after losses", () => {
    const r = mediumReadiness(
      mk({ wins: MEDIUM_UNLOCK_AT, gamesPlayed: MEDIUM_UNLOCK_AT + 10, losses: 10 }),
    );
    expect(r.unlocked).toBe(true);
  });
});

describe("mediumReadiness — recommendation level", () => {
  it("unlocked but weak easy performance → unlocked-weak, not strongly recommended", () => {
    // 5 easy wins + many losses (win rate 5/15 ≈ 33%)
    const r = mediumReadiness(
      mk({
        wins: 5,
        losses: 10,
        gamesPlayed: 15,
        totalMistakes: 35,
        recentSolves: [
          solve("easy", "win", 3, 200_000),
          solve("easy", "win", 3, 200_000),
          solve("easy", "win", 3, 200_000),
          solve("easy", "win", 3, 200_000),
          solve("easy", "win", 3, 200_000),
        ],
      }),
    );
    expect(r.unlocked).toBe(true);
    expect(r.level).toBe("unlocked-weak");
  });

  it("good aggregates + 2+ recent confident solves → recommended or strong", () => {
    const recent: RecentSolve[] = [
      solve("easy", "win", 0, 200_000),
      solve("easy", "win", 1, 220_000),
      solve("easy", "win", 1, 240_000),
    ];
    const r = mediumReadiness(
      mk({
        wins: 6,
        losses: 1,
        gamesPlayed: 7,
        totalMistakes: 6,
        recentSolves: recent,
      }),
    );
    expect(r.unlocked).toBe(true);
    expect(["recommended", "strong"]).toContain(r.level);
  });

  it("strong when recent confident wins are also fast (≤ 2.5 min, ≤ 1 mistake)", () => {
    const recent: RecentSolve[] = [
      solve("easy", "win", 0, 130_000), // fast confident
      solve("easy", "win", 1, 140_000), // fast confident
      solve("easy", "win", 1, 160_000),
    ];
    const r = mediumReadiness(
      mk({
        wins: 6,
        losses: 1,
        gamesPlayed: 7,
        totalMistakes: 4,
        recentSolves: recent,
      }),
    );
    expect(r.unlocked).toBe(true);
    expect(r.level).toBe("strong");
  });

  it("bad time (slow) does not hard-block unlock — still unlocked-weak at worst", () => {
    const recent: RecentSolve[] = [
      solve("easy", "win", 0, 600_000), // 10 min — "slow"
      solve("easy", "win", 1, 520_000),
      solve("easy", "win", 0, 480_000),
    ];
    const r = mediumReadiness(
      mk({
        wins: 6,
        losses: 1,
        gamesPlayed: 7,
        totalMistakes: 3,
        recentSolves: recent,
      }),
    );
    expect(r.unlocked).toBe(true);
    // Recommendation is still valid — time is secondary; it only downgrades
    // away from "strong", not away from unlock or recommend.
    expect(["recommended", "unlocked-weak"]).toContain(r.level);
    expect(r.level).not.toBe("locked");
  });

  it("good median time bumps confidence even without many fast-confident entries", () => {
    const recent: RecentSolve[] = [
      solve("easy", "win", 1, 170_000),
      solve("easy", "win", 1, 160_000),
      solve("easy", "win", 1, 150_000),
    ];
    const r = mediumReadiness(
      mk({
        wins: 6,
        losses: 1,
        gamesPlayed: 7,
        totalMistakes: 5,
        recentSolves: recent,
      }),
    );
    expect(r.level).toBe("strong");
  });
});

describe("mediumReadiness — fallback after medium losses", () => {
  it(`${FALLBACK_LOSS_STREAK} consecutive medium losses → gentle fallback copy`, () => {
    const r = mediumReadiness(
      mk({
        wins: MEDIUM_UNLOCK_AT,
        losses: 2,
        gamesPlayed: MEDIUM_UNLOCK_AT + 2,
        mediumLosses: 2,
        mediumLossStreak: 2,
      }),
    );
    expect(r.fallback).toBeTruthy();
    expect((r.fallback ?? "").toLowerCase()).toContain("easy");
  });

  it("one medium loss → no fallback yet", () => {
    const r = mediumReadiness(
      mk({
        wins: MEDIUM_UNLOCK_AT,
        losses: 1,
        gamesPlayed: MEDIUM_UNLOCK_AT + 1,
        mediumLosses: 1,
        mediumLossStreak: 1,
      }),
    );
    expect(r.fallback).toBeNull();
  });

  it("fallback never replaces the main level — medium remains accessible", () => {
    const r = mediumReadiness(
      mk({
        wins: MEDIUM_UNLOCK_AT,
        losses: 2,
        gamesPlayed: MEDIUM_UNLOCK_AT + 2,
        mediumLossStreak: 3,
      }),
    );
    expect(r.unlocked).toBe(true);
    expect(r.level).not.toBe("locked");
  });
});

describe("mediumReadiness — derived fields", () => {
  it("derives easyWins correctly from total wins minus mediumWins", () => {
    const r = mediumReadiness(mk({ wins: 7, mediumWins: 2, gamesPlayed: 9 }));
    expect(r.easyWins).toBe(5);
  });

  it("returns a stable shape for empty records (no throws)", () => {
    const r = mediumReadiness(mk());
    expect(typeof r.label).toBe("string");
    expect(typeof r.caption).toBe("string");
    expect(typeof r.easyWinRate).toBe("number");
  });
});

// =========================================================================
// Hard / Master Challenge readiness
// =========================================================================

describe("hardReadiness — coming-soon when no hard content", () => {
  it("returns coming-soon when hardPoolSize is 0", () => {
    const r = hardReadiness(mk(), 0);
    expect(r.level).toBe("coming-soon");
    expect(r.hasContent).toBe(false);
    expect(r.label).toContain("Master Challenge");
  });
});

describe("hardReadiness — unlock", () => {
  it("locked with 0 medium wins and hard content present", () => {
    const r = hardReadiness(mk(), 5);
    expect(r.level).toBe("locked");
    expect(r.unlocked).toBe(false);
  });

  it(`unlocks after ${HARD_UNLOCK_AT} medium wins`, () => {
    const r = hardReadiness(mk({ wins: 5, mediumWins: HARD_UNLOCK_AT, gamesPlayed: 5 }), 5);
    expect(r.unlocked).toBe(true);
    expect(r.level).not.toBe("locked");
  });

  it("does not regress after medium losses", () => {
    const r = hardReadiness(
      mk({ wins: 5, mediumWins: HARD_UNLOCK_AT, gamesPlayed: 15, mediumLosses: 10 }),
      5,
    );
    expect(r.unlocked).toBe(true);
  });
});

describe("hardReadiness — recommendation", () => {
  it("unlocked but not recommended with weak medium record", () => {
    const r = hardReadiness(
      mk({ wins: 4, mediumWins: HARD_UNLOCK_AT, gamesPlayed: 20, mediumLosses: 10 }),
      5,
    );
    expect(r.unlocked).toBe(true);
    expect(r.level).toBe("unlocked");
  });

  it("recommended with strong medium record", () => {
    const r = hardReadiness(
      mk({
        wins: 10,
        mediumWins: HARD_RECOMMEND_MEDIUM_WINS,
        mediumLosses: 1,
        gamesPlayed: 11,
      }),
      5,
    );
    expect(r.level).toBe("recommended");
  });
});

describe("hardReadiness — fallback", () => {
  it(`${HARD_FALLBACK_LOSS_STREAK} consecutive hard losses → fallback hint`, () => {
    const r = hardReadiness(
      mk({
        wins: 5,
        mediumWins: HARD_UNLOCK_AT,
        gamesPlayed: 10,
        hardLossStreak: HARD_FALLBACK_LOSS_STREAK,
      }),
      5,
    );
    expect(r.fallback).toBeTruthy();
    expect((r.fallback ?? "").toLowerCase()).toContain("medium");
  });

  it("no fallback with 1 hard loss", () => {
    const r = hardReadiness(
      mk({ wins: 5, mediumWins: HARD_UNLOCK_AT, gamesPlayed: 6, hardLossStreak: 1 }),
      5,
    );
    expect(r.fallback).toBeNull();
  });

  it("fallback never locks hard", () => {
    const r = hardReadiness(
      mk({
        wins: 5,
        mediumWins: HARD_UNLOCK_AT,
        gamesPlayed: 10,
        hardLossStreak: 5,
      }),
      5,
    );
    expect(r.unlocked).toBe(true);
    expect(r.level).not.toBe("locked");
  });
});

describe("mediumReadiness — starter path consistency", () => {
  it("a Medium win from the starter path unlocks Medium practice", () => {
    // 2 easy starters + 3 medium starters: Master is open, so Medium must be too.
    const stats = mk({ wins: 5, gamesPlayed: 5, mediumWins: 3 });
    expect(mediumReadiness(stats).unlocked).toBe(true);
    expect(hardReadiness(stats, 100).unlocked).toBe(true);
  });

  it("hard wins are not counted as easy wins", () => {
    const r = mediumReadiness(mk({ wins: 4, gamesPlayed: 4, hardWins: 4 }));
    expect(r.easyWins).toBe(0);
  });
});
