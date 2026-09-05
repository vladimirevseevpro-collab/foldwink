import { describe, expect, it } from "vitest";
import type { DailyRecord } from "../../game/types/stats";
import {
  addLocalDays,
  derivePersonalMoment,
  deriveRecentDailySummary,
  deriveSevenDayFold,
  listDailyRecords,
  mergeDailyHistory,
  parseLocalDate,
  calculateDailyStreak,
  applyGraceWaxProtection,
} from "../dailyRitual";

function daily(date: string, overrides: Partial<DailyRecord> = {}): DailyRecord {
  return {
    date,
    puzzleId: `p-${date}`,
    result: "win",
    mistakesUsed: 0,
    durationMs: 90_000,
    ...overrides,
  };
}

describe("dailyRitual", () => {
  it("parses local dates safely and adds days across month edges", () => {
    expect(parseLocalDate("2026-07-22")).not.toBeNull();
    expect(parseLocalDate("2026-02-30")).toBeNull();
    expect(addLocalDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("merges and dedupes history by normalized record date", () => {
    const merged = mergeDailyHistory(
      {
        "2026-07-20": daily("2026-07-20", { result: "loss" }),
        legacy: daily("2026-07-21", { durationMs: 50_000 }),
      },
      daily("2026-07-21", { durationMs: 40_000 }),
    );

    expect(Object.keys(merged)).toEqual(["2026-07-20", "2026-07-21"]);
    expect(merged["2026-07-21"]?.durationMs).toBe(40_000);
  });

  it("builds exactly seven local day cells ending today and leaves gaps neutral", () => {
    const cells = deriveSevenDayFold(
      {
        "2026-07-18": daily("2026-07-18", { result: "loss" }),
        "2026-07-22": daily("2026-07-22"),
      },
      "2026-07-22",
    );

    expect(cells).toHaveLength(7);
    expect(cells[0]?.date).toBe("2026-07-16");
    expect(cells[6]?.date).toBe("2026-07-22");
    expect(cells[6]?.isToday).toBe(true);
    expect(cells[1]?.state).toBe("empty");
    expect(cells[2]?.state).toBe("lost");
    expect(cells[6]?.state).toBe("won");
  });

  it("recent summary counts only recorded dailies, not missing calendar days", () => {
    const summary = deriveRecentDailySummary(
      listDailyRecords({
        "2026-07-10": daily("2026-07-10", { result: "loss" }),
        "2026-07-12": daily("2026-07-12"),
        "2026-07-20": daily("2026-07-20"),
        "2026-07-22": daily("2026-07-22", { result: "loss" }),
      }),
    );

    expect(summary).toEqual({ solved: 2, recorded: 4 });
  });

  it("returns first-daily only for the first recorded daily", () => {
    const moment = derivePersonalMoment({ "2026-07-22": daily("2026-07-22") }, "2026-07-22");
    expect(moment?.kind).toBe("first-daily");
  });

  it("returns fastest-win only for a strict same-mistake improvement, not a tie", () => {
    const faster = derivePersonalMoment(
      {
        "2026-07-20": daily("2026-07-20", { mistakesUsed: 1, durationMs: 100_000 }),
        "2026-07-21": daily("2026-07-21", { result: "loss", mistakesUsed: 4 }),
        "2026-07-22": daily("2026-07-22", { mistakesUsed: 1, durationMs: 95_000 }),
      },
      "2026-07-22",
    );
    expect(faster?.kind).toBe("fastest-win");
    expect(faster?.comparedTo?.date).toBe("2026-07-20");

    const tied = derivePersonalMoment(
      {
        "2026-07-20": daily("2026-07-20", { mistakesUsed: 1, durationMs: 95_000 }),
        "2026-07-22": daily("2026-07-22", { mistakesUsed: 1, durationMs: 95_000 }),
      },
      "2026-07-22",
    );
    expect(tied?.kind).toBe("today-logged");
  });

  it("returns flawless-win once for the first flawless win even after earlier losses", () => {
    const firstFlawless = derivePersonalMoment(
      {
        "2026-07-18": daily("2026-07-18", { result: "loss", mistakesUsed: 4 }),
        "2026-07-22": daily("2026-07-22", { mistakesUsed: 0 }),
      },
      "2026-07-22",
    );
    expect(firstFlawless?.kind).toBe("flawless-win");

    const repeatedFlawless = derivePersonalMoment(
      {
        "2026-07-18": daily("2026-07-18", { mistakesUsed: 0 }),
        "2026-07-22": daily("2026-07-22", { mistakesUsed: 0 }),
      },
      "2026-07-22",
    );
    expect(repeatedFlawless?.kind).toBe("today-logged");
  });

  it("falls back to today-logged for losses and replay-safe current-day history", () => {
    const moment = derivePersonalMoment(
      {
        "2026-07-21": daily("2026-07-21", { mistakesUsed: 0, durationMs: 70_000 }),
        "2026-07-22": daily("2026-07-22", { mistakesUsed: 0, durationMs: 70_000 }),
      },
      "2026-07-22",
    );
    expect(moment?.kind).toBe("today-logged");
    expect(moment?.recent).toEqual({ solved: 2, recorded: 2 });
  });

  it("calculates daily streak correctly from consecutive wins and handles Grace Wax", () => {
    const history = {
      "2026-07-20": daily("2026-07-20"),
      "2026-07-21": daily("2026-07-21"),
      "2026-07-22": daily("2026-07-22"),
    };
    expect(calculateDailyStreak(history, "2026-07-22")).toBe(3);

    // Today not yet played, yesterday won
    expect(calculateDailyStreak(history, "2026-07-23")).toBe(3);

    // Two days gap without grace wax -> streak broken (0)
    expect(calculateDailyStreak(history, "2026-07-24")).toBe(0);
  });

  it("protects daily streak with Grace Wax when a day is missed and wax >= 1", () => {
    const history = {
      "2026-07-20": daily("2026-07-20"),
      // 2026-07-21 was missed
    };
    const today = "2026-07-22";

    // Player has wax
    const resWithWax = applyGraceWaxProtection(history, today, { wax: 2 });
    expect(resWithWax.result.applied).toBe(true);
    expect(resWithWax.result.protectedDate).toBe("2026-07-21");
    expect(resWithWax.waxRemaining).toBe(1);
    expect(resWithWax.history["2026-07-21"]?.graceWaxUsed).toBe(true);

    // Seven-day fold marks the grace day as restored (Kintsugi)
    const cells = deriveSevenDayFold(resWithWax.history, today);
    const restoredCell = cells.find((c) => c.date === "2026-07-21");
    expect(restoredCell?.state).toBe("restored");

    // Streak is preserved
    expect(calculateDailyStreak(resWithWax.history, today)).toBe(2);

    // Player with 0 wax does not get grace wax
    const resNoWax = applyGraceWaxProtection(history, today, { wax: 0 });
    expect(resNoWax.result.applied).toBe(false);
    expect(resNoWax.waxRemaining).toBe(0);
  });
});
