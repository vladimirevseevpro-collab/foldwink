import { describe, expect, it } from "vitest";
import { INITIAL_STATS } from "../../game/types/stats";
import { INITIAL_PROFILE } from "../../progression/archivistProfile";
import { getDailySlotKey } from "../gameRepository";
import {
  LEGACY_IMPORT_SCHEDULE_VERSION,
  migrateLegacySnapshot,
  type LegacyPersistenceSnapshot,
} from "../legacyMigration";

function snapshot(): LegacyPersistenceSnapshot {
  return {
    language: "ru",
    stats: { ...INITIAL_STATS, gamesPlayed: 3 },
    standardProgress: { cursor: 2 },
    dailyHistory: {
      "2026-09-13": {
        date: "2026-09-13",
        puzzleId: "ru-0042",
        result: "win",
        mistakesUsed: 1,
        durationMs: 60_000,
      },
    },
    onboarded: true,
    archivistProfile: { ...INITIAL_PROFILE, xp: 160 },
    activeSession: {
      puzzleId: "ru-0043",
      savedAt: 200,
      active: {
        puzzleId: "ru-0043",
        mode: "standard",
        order: ["а", "б", "в", "г", "д", "е", "ё", "ж", "з", "и", "й", "к", "л", "м", "н", "о"],
        selection: ["а"],
        solvedGroupIds: [],
        mistakesUsed: 1,
        startedAt: 100,
        countsToStats: true,
        winkedGroupId: null,
      },
    },
    getPuzzleDifficulty: () => "medium",
  };
}

describe("migrateLegacySnapshot", () => {
  it("is deterministic and keeps legacy values without inventing a reward", () => {
    const input = snapshot();
    const first = migrateLegacySnapshot(input);
    const second = migrateLegacySnapshot(input);

    expect(second).toEqual(first);
    expect(first.profileRevision).toBe(0);
    expect(first.stats.gamesPlayed).toBe(3);
    expect(first.archivistProfile.xp).toBe(160);
    expect(first.archivistProfile.rewardReceipts).toEqual({});
  });

  it("makes imported Daily identity language-scoped and self-contained", () => {
    const result = migrateLegacySnapshot(snapshot());
    const daily = result.dailyHistory[getDailySlotKey("ru", "2026-09-13")];

    expect(daily).toMatchObject({
      language: "ru",
      date: "2026-09-13",
      puzzleId: "ru-0042",
      scheduleVersion: LEGACY_IMPORT_SCHEDULE_VERSION,
      winkUsed: false,
    });
    expect(daily.puzzleRef).toMatchObject({ puzzleId: "ru-0042", lineageId: "ru-0042" });
  });

  it("upgrades an active legacy session with stable identity, rules and revision", () => {
    const active = migrateLegacySnapshot(snapshot()).activeSession!.active;

    expect(active.attemptId).toBe("legacy-attempt:standard:ru-0043:100");
    expect(active.context).toBe("practice");
    expect(active.revision).toBe(2);
    expect(active.rules).toMatchObject({
      maxIncorrectGuesses: 4,
      tabsEnabled: true,
      maxWinks: 1,
    });
    expect(active.incorrectGuessSignatures).toEqual([]);
  });

  it("drops a terminal or mismatched legacy session instead of reviving it", () => {
    const input = snapshot();
    input.activeSession!.active.result = "loss";
    expect(migrateLegacySnapshot(input).activeSession).toBeNull();

    const mismatched = snapshot();
    mismatched.activeSession!.puzzleId = "another-puzzle";
    expect(migrateLegacySnapshot(mismatched).activeSession).toBeNull();
  });
});
