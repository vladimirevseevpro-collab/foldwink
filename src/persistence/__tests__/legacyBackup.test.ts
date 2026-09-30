import { beforeEach, describe, expect, it } from "vitest";
import { INITIAL_STATS } from "../../game/types/stats";
import { INITIAL_PROFILE } from "../../progression/archivistProfile";
import { resetStorageAdapterForTests } from "../../utils/storage";
import { loadLegacyMigrationBackup, saveLegacyMigrationBackupOnce } from "../legacyBackup";
import type { LegacyPersistenceSnapshot } from "../legacyMigration";

function snapshot(): LegacyPersistenceSnapshot {
  return {
    language: "en",
    stats: { ...INITIAL_STATS, gamesPlayed: 2 },
    standardProgress: { cursor: 1 },
    dailyHistory: {},
    onboarded: true,
    archivistProfile: { ...INITIAL_PROFILE, xp: 80 },
    activeSession: null,
    getPuzzleDifficulty: () => "easy",
  };
}

describe("legacy migration backup", () => {
  beforeEach(() => resetStorageAdapterForTests());

  it("stores one serializable snapshot and never overwrites the original", () => {
    const first = saveLegacyMigrationBackupOnce(snapshot(), 100);
    const changed = snapshot();
    changed.stats.gamesPlayed = 99;
    const retry = saveLegacyMigrationBackupOnce(changed, 200);

    expect(retry).toEqual(first);
    expect(loadLegacyMigrationBackup()).toMatchObject({
      version: 1,
      createdAt: 100,
      snapshot: { stats: { gamesPlayed: 2 } },
    });
    expect("getPuzzleDifficulty" in first.snapshot).toBe(false);
  });
});
