import { describe, expect, it, beforeEach } from "vitest";
import {
  INITIAL_PROFILE,
  loadArchivistProfile,
  awardSolveRewards,
  awardPalimpsestCompletion,
  startIronContract,
  getLevelFromXp,
  getGuildRank,
} from "../archivistProfile";

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

  it("awards XP, ink, wax on flawless victory", () => {
    const p0 = { ...INITIAL_PROFILE, xp: 0, ink: 0, wax: 0 };
    const { updatedProfile, rewards } = awardSolveRewards(p0, {
      result: "win",
      mistakesUsed: 0,
      isDaily: true,
      difficulty: "medium",
    });

    expect(rewards.xpGained).toBeGreaterThan(100);
    expect(rewards.inkGained).toBeGreaterThan(40);
    expect(rewards.waxGained).toBe(2);
    expect(updatedProfile.xp).toBe(rewards.xpGained);
    expect(updatedProfile.wax).toBe(2);
  });

  it("supports iron contract wager, consuming wax and awarding prestige on victory", () => {
    const p0 = { ...INITIAL_PROFILE, wax: 5 };
    const contracted = startIronContract(p0, 2);
    expect(contracted).not.toBeNull();
    expect(contracted?.wax).toBe(3);
    expect(contracted?.activeContract?.active).toBe(true);

    const { updatedProfile, rewards } = awardSolveRewards(contracted!, {
      result: "win",
      mistakesUsed: 0,
      isDaily: false,
      difficulty: "hard",
    });

    expect(rewards.contractResult).toBe("won");
    expect(rewards.prestigeGained).toBe(1);
    expect(updatedProfile.contractsWon).toBe(1);
    expect(updatedProfile.activeContract).toBeNull();
  });

  it("maps levels to guild ranks", () => {
    expect(getGuildRank(1).titleEn).toBe("Novice Scribe");
    expect(getGuildRank(10).titleEn).toBe("Guild Correspondent");
    expect(getGuildRank(50).titleEn).toBe("Keeper of the Black Seal");
  });

  it("awards XP, wax, ink, and unlocks stamp_palimpsest on palimpsest completion", () => {
    const p0 = { ...INITIAL_PROFILE, xp: 0, ink: 5, wax: 1, collectedStampIds: [] };
    const { updatedProfile, rewards } = awardPalimpsestCompletion(p0);

    expect(rewards.xpGained).toBe(50);
    expect(rewards.waxGained).toBe(3);
    expect(rewards.inkGained).toBe(2);
    expect(rewards.stampUnlocked).toBe(true);

    expect(updatedProfile.xp).toBe(50);
    expect(updatedProfile.wax).toBe(4);
    expect(updatedProfile.ink).toBe(7);
    expect(updatedProfile.collectedStampIds).toContain("stamp_palimpsest");

    // Second completion does not duplicate the stamp
    const second = awardPalimpsestCompletion(updatedProfile);
    expect(second.rewards.stampUnlocked).toBe(false);
    expect(second.updatedProfile.collectedStampIds.filter((s) => s === "stamp_palimpsest").length).toBe(1);
  });
});
