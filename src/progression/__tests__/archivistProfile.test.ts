import { describe, expect, it, beforeEach } from "vitest";
import {
  INITIAL_PROFILE,
  loadArchivistProfile,
  awardPalimpsestCompletion,
  getLevelFromXp,
  getGuildRank,
  commitSolveReward,
} from "../archivistProfile";
import { resetStorageAdapterForTests } from "../../utils/storage";

function installLocalStorage(): void {
  const store = new Map<string, string>();
  (globalThis as unknown as { localStorage?: Storage }).localStorage = {
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

describe("archivist profile & rewards engine", () => {
  beforeEach(() => {
    installLocalStorage();
    resetStorageAdapterForTests();
  });

  it("loads initial profile when storage is empty", () => {
    const profile = loadArchivistProfile();
    expect(profile.level).toBe(1);
    expect(profile.ink).toBe(25);
    expect(profile.wax).toBe(3);
  });

  it("calculates level from XP correctly", () => {
    expect(getLevelFromXp(0)).toBe(1);
    expect(getLevelFromXp(100)).toBe(2);
    expect(getLevelFromXp(400)).toBe(3);
    expect(getLevelFromXp(900)).toBe(4);
  });

  it("maps levels to guild ranks", () => {
    expect(getGuildRank(1).titleEn).toBe("Novice Scribe");
    expect(getGuildRank(10).titleEn).toBe("Guild Correspondent");
    expect(getGuildRank(50).titleEn).toBe("Keeper of the Black Seal");
  });

  it("commits one deterministic unique-solve reward and blocks replay", () => {
    const first = commitSolveReward({
      language: "en",
      lineageId: "official-001",
      context: "practice",
      result: "win",
    });
    const replay = commitSolveReward({
      language: "en",
      lineageId: "official-001",
      context: "zen",
      result: "win",
    });

    expect(first).toMatchObject({ awarded: true, xpGained: 80, reason: "awarded" });
    expect(replay).toMatchObject({ awarded: false, xpGained: 0, reason: "already-consumed" });
    const profile = loadArchivistProfile();
    expect(profile.version).toBe(2);
    expect(profile.xp).toBe(80);
    expect(profile.consumedRewardKeys).toEqual(["unique-solve:en:official-001"]);
  });

  it("refunds a legacy pending contract exactly once during v2 migration", () => {
    localStorage.setItem(
      "foldwink:archivistProfile",
      JSON.stringify({
        ...INITIAL_PROFILE,
        version: 1,
        wax: 3,
        activeContract: { active: true, wagerWax: 2, rule: "sudden_death" },
        migrationReceipts: [],
      }),
    );
    resetStorageAdapterForTests();

    const migrated = loadArchivistProfile();
    const repeated = loadArchivistProfile();

    expect(migrated).toMatchObject({ version: 2, wax: 5, activeContract: null });
    expect(migrated.migrationReceipts).toContain("migration:v2:legacy-contract-refund");
    expect(repeated.wax).toBe(5);
  });

  it("unlocks the Palimpsest stamp once without XP or currency farming", () => {
    const p0 = { ...INITIAL_PROFILE, xp: 0, ink: 5, wax: 1, collectedStampIds: [] };
    const { updatedProfile, rewards } = awardPalimpsestCompletion(p0);

    expect(rewards.xpGained).toBe(0);
    expect(rewards.waxGained).toBe(0);
    expect(rewards.inkGained).toBe(0);
    expect(rewards.stampUnlocked).toBe(true);

    expect(updatedProfile.xp).toBe(0);
    expect(updatedProfile.wax).toBe(1);
    expect(updatedProfile.ink).toBe(5);
    expect(updatedProfile.collectedStampIds).toContain("stamp_palimpsest");
    expect(updatedProfile.sealId).toBe("seal_palimpsest");

    // Second completion does not duplicate the stamp
    const second = awardPalimpsestCompletion(updatedProfile);
    expect(second.rewards.stampUnlocked).toBe(false);
    expect(second.updatedProfile).toEqual(updatedProfile);
    expect(
      second.updatedProfile.collectedStampIds.filter((s) => s === "stamp_palimpsest").length,
    ).toBe(1);
  });
});
