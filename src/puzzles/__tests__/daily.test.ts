import { describe, expect, it, vi } from "vitest";
import type { DailyEntry } from "../catalog";
import { resolveDailyEntry } from "../daily";

const entry: DailyEntry = {
  entryId: "daily-en-2026-09-14",
  date: "2026-09-14",
  language: "en",
  puzzleId: "puzzle-0004",
  lineageId: "puzzle-0004",
  contentVersion: "catalog-2026-09-v1",
  scheduleVersion: "calendar-2026-09-v1",
};

describe("resolveDailyEntry", () => {
  it("returns the exact versioned calendar entry", () => {
    const lookup = vi.fn(() => entry);
    expect(resolveDailyEntry("en", entry.date, lookup)).toEqual(entry);
    expect(lookup).toHaveBeenCalledWith("en", entry.date);
  });

  it("does not accept a cross-language fallback", () => {
    expect(resolveDailyEntry("ru", entry.date, () => entry)).toBeUndefined();
  });

  it("does not accept a different date or malformed local date", () => {
    expect(resolveDailyEntry("en", "2026-09-15", () => entry)).toBeUndefined();
    expect(resolveDailyEntry("en", "14-09-2026", () => entry)).toBeUndefined();
  });

  it("is independent of unlocks, mutable pools and player stats", () => {
    const lookup = vi.fn(() => entry);
    const first = resolveDailyEntry("en", entry.date, lookup);
    const second = resolveDailyEntry("en", entry.date, lookup);
    expect(first).toEqual(second);
    expect(lookup).toHaveBeenCalledTimes(2);
  });
});
