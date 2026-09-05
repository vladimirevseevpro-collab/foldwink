import type { ArchivistProfile, GuildRank } from "./types";
import { GUILD_RANKS } from "./types";
import { STAMP_COLLECTION } from "./stamps";

const PROFILE_STORAGE_KEY = "foldwink:archivistProfile";

export const INITIAL_PROFILE: ArchivistProfile = {
  version: 1,
  level: 1,
  xp: 0,
  ink: 25,
  wax: 3,
  prestige: 0,
  discipline: "scribe",
  sealId: "seal_raven",
  nibId: "nib_brass",
  titleId: "title_truths",
  collectedStampIds: ["stamp_morning_brew"],
  contractsAttempted: 0,
  contractsWon: 0,
  activeContract: null,
};

export function loadArchivistProfile(): ArchivistProfile {
  if (typeof localStorage === "undefined") {
    return { ...INITIAL_PROFILE };
  }
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return { ...INITIAL_PROFILE };
    const parsed = JSON.parse(raw);
    return { ...INITIAL_PROFILE, ...parsed };
  } catch {
    return { ...INITIAL_PROFILE };
  }
}

export function saveArchivistProfile(profile: ArchivistProfile): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  } catch {
    /* storage unavailable */
  }
}

export function getXpForLevel(level: number): number {
  return (level - 1) * (level - 1) * 100;
}

export function getLevelFromXp(xp: number): number {
  return Math.floor(Math.sqrt(Math.max(0, xp) / 100)) + 1;
}

export function getGuildRank(level: number): GuildRank {
  for (let i = GUILD_RANKS.length - 1; i >= 0; i--) {
    if (level >= GUILD_RANKS[i].minLevel) {
      return GUILD_RANKS[i];
    }
  }
  return GUILD_RANKS[0];
}

export interface SolveContext {
  result: "win" | "loss";
  mistakesUsed: number;
  isDaily: boolean;
  difficulty: "easy" | "medium" | "hard";
}

export interface SolveRewards {
  xpGained: number;
  inkGained: number;
  waxGained: number;
  prestigeGained: number;
  droppedStamp: (typeof STAMP_COLLECTION)[number] | null;
  prevLevel: number;
  newLevel: number;
  leveledUp: boolean;
  contractResult: "won" | "failed" | null;
}

export function awardSolveRewards(
  profile: ArchivistProfile,
  ctx: SolveContext,
): { updatedProfile: ArchivistProfile; rewards: SolveRewards } {
  const { result, mistakesUsed, isDaily, difficulty } = ctx;

  let xpGained: number;
  let inkGained = 0;
  let waxGained = 0;
  let prestigeGained = 0;
  let droppedStamp: (typeof STAMP_COLLECTION)[number] | null = null;
  let contractResult: "won" | "failed" | null = null;

  const prevLevel = profile.level;
  const isFlawless = mistakesUsed === 0;
  const hasContract = profile.activeContract?.active === true;

  if (result === "win") {
    // Base rewards
    const diffMultiplier = difficulty === "hard" ? 2.0 : difficulty === "medium" ? 1.5 : 1.0;
    xpGained = Math.round((50 + (isFlawless ? 30 : 15)) * diffMultiplier);
    inkGained = Math.round((20 + (isFlawless ? 15 : 5)) * diffMultiplier);
    waxGained = isFlawless ? 2 : 1;

    if (isDaily) {
      xpGained += 25;
      inkGained += 10;
    }

    if (hasContract) {
      contractResult = "won";
      prestigeGained += 1;
      xpGained += 100;
      inkGained += 50;
      waxGained += (profile.activeContract?.wagerWax ?? 2) * 2;
    }

    // Stamp drop evaluation
    const uncollected = STAMP_COLLECTION.filter((s) => !profile.collectedStampIds.includes(s.id));
    if (uncollected.length > 0) {
      if (hasContract) {
        // Guaranteed stamp on winning contract
        droppedStamp = uncollected.find((s) => s.id === "stamp_iron_contract") ?? uncollected[0];
      } else if (isFlawless && !profile.collectedStampIds.includes("stamp_flawless_sun")) {
        droppedStamp = STAMP_COLLECTION.find((s) => s.id === "stamp_flawless_sun") ?? null;
      } else if (Math.random() < 0.45) {
        droppedStamp = uncollected[Math.floor(Math.random() * uncollected.length)];
      }
    }
  } else {
    // Loss
    if (hasContract) {
      contractResult = "failed";
    }
    xpGained = 10; // small effort XP
  }

  const newXp = profile.xp + xpGained;
  const newLevel = getLevelFromXp(newXp);
  const leveledUp = newLevel > prevLevel;

  const collectedStampIds = [...profile.collectedStampIds];
  if (droppedStamp && !collectedStampIds.includes(droppedStamp.id)) {
    collectedStampIds.push(droppedStamp.id);
  }

  const updatedProfile: ArchivistProfile = {
    ...profile,
    level: newLevel,
    xp: newXp,
    ink: profile.ink + inkGained,
    wax: profile.wax + waxGained,
    prestige: profile.prestige + prestigeGained,
    collectedStampIds,
    contractsAttempted: hasContract ? profile.contractsAttempted + 1 : profile.contractsAttempted,
    contractsWon: contractResult === "won" ? profile.contractsWon + 1 : profile.contractsWon,
    activeContract: null, // contract completed
  };

  saveArchivistProfile(updatedProfile);

  return {
    updatedProfile,
    rewards: {
      xpGained,
      inkGained,
      waxGained,
      prestigeGained,
      droppedStamp,
      prevLevel,
      newLevel,
      leveledUp,
      contractResult,
    },
  };
}

export function startIronContract(
  profile: ArchivistProfile,
  wagerWax: number = 2,
): ArchivistProfile | null {
  if (profile.wax < wagerWax) return null;
  const updated: ArchivistProfile = {
    ...profile,
    wax: profile.wax - wagerWax,
    activeContract: {
      active: true,
      wagerWax,
      rule: "sudden_death",
    },
  };
  saveArchivistProfile(updated);
  return updated;
}

export function awardPalimpsestCompletion(profile: ArchivistProfile): {
  updatedProfile: ArchivistProfile;
  rewards: {
    xpGained: number;
    waxGained: number;
    inkGained: number;
    stampUnlocked: boolean;
  };
} {
  const xpGained = 50;
  const waxGained = 3;
  const inkGained = 2;
  const stampUnlocked = !profile.collectedStampIds.includes("stamp_palimpsest");
  const collectedStampIds = stampUnlocked
    ? [...profile.collectedStampIds, "stamp_palimpsest"]
    : profile.collectedStampIds;
  const newXp = profile.xp + xpGained;
  const newLevel = getLevelFromXp(newXp);

  const updatedProfile: ArchivistProfile = {
    ...profile,
    level: newLevel,
    xp: newXp,
    ink: profile.ink + inkGained,
    wax: profile.wax + waxGained,
    collectedStampIds,
  };

  saveArchivistProfile(updatedProfile);

  return {
    updatedProfile,
    rewards: {
      xpGained,
      waxGained,
      inkGained,
      stampUnlocked,
    },
  };
}
