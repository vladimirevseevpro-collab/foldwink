import type { ArchivistProfile, GuildRank } from "./types";
import { GUILD_RANKS } from "./types";
import { safeRead, safeWrite } from "../utils/storage";
import {
  evaluateRewardPolicy,
  type RewardContext,
  type RewardLanguage,
  type RewardReceipt,
} from "../game/application/rewardPolicy";

const PROFILE_STORAGE_KEY = "foldwink:archivistProfile";
const CONTRACT_REFUND_RECEIPT = "migration:v2:legacy-contract-refund";

export const INITIAL_PROFILE: ArchivistProfile = {
  version: 2,
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
  consumedRewardKeys: [],
  rewardReceipts: {},
  migrationReceipts: [],
};

export function loadArchivistProfile(): ArchivistProfile {
  const parsed = safeRead<Partial<ArchivistProfile>>(PROFILE_STORAGE_KEY, {});
  const migrationReceipts = Array.isArray(parsed.migrationReceipts)
    ? parsed.migrationReceipts.filter((value): value is string => typeof value === "string")
    : [];
  const wager = parsed.activeContract?.wagerWax;
  const refundableContract =
    parsed.activeContract?.active === true &&
    Number.isInteger(wager) &&
    typeof wager === "number" &&
    wager > 0 &&
    !migrationReceipts.includes(CONTRACT_REFUND_RECEIPT);
  const normalized: ArchivistProfile = {
    ...INITIAL_PROFILE,
    ...parsed,
    version: 2,
    wax:
      Math.max(
        0,
        Number.isFinite(parsed.wax) ? (parsed.wax ?? INITIAL_PROFILE.wax) : INITIAL_PROFILE.wax,
      ) + (refundableContract ? wager : 0),
    activeContract: refundableContract ? null : (parsed.activeContract ?? null),
    collectedStampIds: Array.isArray(parsed.collectedStampIds)
      ? parsed.collectedStampIds.filter((value): value is string => typeof value === "string")
      : [...INITIAL_PROFILE.collectedStampIds],
    consumedRewardKeys: Array.isArray(parsed.consumedRewardKeys)
      ? parsed.consumedRewardKeys.filter((value): value is string => typeof value === "string")
      : [],
    rewardReceipts:
      parsed.rewardReceipts && typeof parsed.rewardReceipts === "object"
        ? parsed.rewardReceipts
        : {},
    migrationReceipts: refundableContract
      ? [...migrationReceipts, CONTRACT_REFUND_RECEIPT]
      : migrationReceipts,
  };
  if (refundableContract) safeWrite(PROFILE_STORAGE_KEY, normalized);
  return normalized;
}

export function saveArchivistProfile(profile: ArchivistProfile): void {
  safeWrite(PROFILE_STORAGE_KEY, profile);
}

export interface CommitSolveRewardInput {
  language: RewardLanguage;
  lineageId: string;
  context: RewardContext;
  result: "win" | "loss";
  officialLineage?: boolean;
}

/**
 * Compatibility commit for the first W1 slice. It makes the currently
 * visible reward idempotent in one profile and removes React render side
 * effects. ADR-002 still requires the final stats/profile/receipt update to
 * move into one IndexedDB transaction before W1 is complete.
 */
export function commitSolveReward(input: CommitSolveRewardInput): RewardReceipt {
  const profile = loadArchivistProfile();
  const decision = evaluateRewardPolicy({
    ...input,
    currentXp: profile.xp,
    currentLevel: profile.level,
    consumedRewardKeys: profile.consumedRewardKeys ?? [],
  });

  if (decision.receipt.awarded) {
    saveArchivistProfile({
      ...profile,
      version: 2,
      xp: decision.updatedProfile.xp,
      level: decision.updatedProfile.level,
      consumedRewardKeys: [...decision.consumedRewardKeys],
      rewardReceipts: {
        ...(profile.rewardReceipts ?? {}),
        [decision.receipt.rewardKey]: decision.receipt,
      },
    });
  }

  return decision.receipt;
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

export function awardPalimpsestCompletion(profile: ArchivistProfile): {
  updatedProfile: ArchivistProfile;
  rewards: {
    xpGained: number;
    waxGained: number;
    inkGained: number;
    stampUnlocked: boolean;
  };
} {
  const xpGained = 0;
  const waxGained = 0;
  const inkGained = 0;
  const stampUnlocked = !profile.collectedStampIds.includes("stamp_palimpsest");
  const collectedStampIds = stampUnlocked
    ? [...profile.collectedStampIds, "stamp_palimpsest"]
    : profile.collectedStampIds;
  const updatedProfile: ArchivistProfile = {
    ...profile,
    collectedStampIds,
    sealId: "seal_palimpsest",
  };

  if (stampUnlocked) saveArchivistProfile(updatedProfile);

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
