/**
 * The v2 reward decision is deliberately independent from persistence. A caller
 * must commit the returned receipt, profile values, and consumed keys together.
 */
export const REWARD_POLICY_SCHEMA_VERSION = 2;
export const UNIQUE_SOLVE_XP = 80;

export type RewardLanguage = "en" | "ru" | "de";

export type RewardContext =
  | "daily"
  | "practice"
  | "onboarding"
  | "zen"
  | "mastery"
  | "archive"
  | "duel"
  | "custom"
  | "palimpsest";

export type RewardResult = "win" | "loss" | "abandoned";

export type RewardReason =
  | "awarded"
  | "not-a-win"
  | "ineligible-context"
  | "unofficial-lineage"
  | "already-consumed";

export interface RewardPolicyInput {
  language: RewardLanguage;
  lineageId: string;
  context: RewardContext;
  result: RewardResult;
  currentXp: number;
  currentLevel: number;
  consumedRewardKeys: readonly string[];
  /**
   * Custom imports cannot be reliably matched to an official editorial lineage.
   * Omit for catalogue-backed attempts; they are official by default.
   */
  officialLineage?: boolean;
}

export interface RewardReceipt {
  readonly schemaVersion: typeof REWARD_POLICY_SCHEMA_VERSION;
  readonly receiptId: string;
  readonly rewardKey: string;
  readonly awarded: boolean;
  readonly xpGained: number;
  readonly prevLevel: number;
  readonly newLevel: number;
  readonly reason: RewardReason;
}

export interface RewardProfileValues {
  readonly xp: number;
  readonly level: number;
}

export interface RewardPolicyDecision {
  readonly receipt: RewardReceipt;
  readonly updatedProfile: RewardProfileValues;
  readonly consumedRewardKeys: readonly string[];
}

const ELIGIBLE_CONTEXTS: ReadonlySet<RewardContext> = new Set([
  "daily",
  "practice",
  "onboarding",
  "zen",
  "mastery",
  "archive",
]);

export function getUniqueSolveRewardKey(language: RewardLanguage, lineageId: string): string {
  return `unique-solve:${language}:${lineageId}`;
}

export function getRewardReceiptId(language: RewardLanguage, lineageId: string): string {
  return `reward-receipt:v${REWARD_POLICY_SCHEMA_VERSION}:${getUniqueSolveRewardKey(language, lineageId)}`;
}

/**
 * Computes the sole v2 base-XP grant. Mastery is an eligible route to an
 * unconsumed base solve, not a second mastery bonus.
 */
export function evaluateRewardPolicy(input: RewardPolicyInput): RewardPolicyDecision {
  const rewardKey = getUniqueSolveRewardKey(input.language, input.lineageId);
  const receiptId = getRewardReceiptId(input.language, input.lineageId);
  const prevLevel = normalizeLevel(input.currentLevel);
  const currentXp = normalizeXp(input.currentXp);
  const alreadyConsumed = input.consumedRewardKeys.includes(rewardKey);
  const reason = getReason(input, alreadyConsumed);
  const awarded = reason === "awarded";
  const xpGained = awarded ? UNIQUE_SOLVE_XP : 0;
  const newXp = currentXp + xpGained;
  // A legacy profile may have a level ahead of its XP. v2 never revokes it.
  const newLevel = Math.max(prevLevel, getLevelFromXp(newXp));
  const consumedRewardKeys = awarded
    ? freezeArray([...input.consumedRewardKeys, rewardKey])
    : freezeArray([...input.consumedRewardKeys]);

  return Object.freeze({
    receipt: Object.freeze({
      schemaVersion: REWARD_POLICY_SCHEMA_VERSION,
      receiptId,
      rewardKey,
      awarded,
      xpGained,
      prevLevel,
      newLevel,
      reason,
    }),
    updatedProfile: Object.freeze({ xp: newXp, level: newLevel }),
    consumedRewardKeys,
  });
}

function getReason(input: RewardPolicyInput, alreadyConsumed: boolean): RewardReason {
  if (input.result !== "win") return "not-a-win";
  if (input.officialLineage === false) return "unofficial-lineage";
  if (!ELIGIBLE_CONTEXTS.has(input.context)) return "ineligible-context";
  if (alreadyConsumed) return "already-consumed";
  return "awarded";
}

function normalizeXp(xp: number): number {
  return Number.isFinite(xp) ? Math.max(0, xp) : 0;
}

function normalizeLevel(level: number): number {
  return Number.isFinite(level) ? Math.max(1, Math.floor(level)) : 1;
}

function getLevelFromXp(xp: number): number {
  return Math.floor(Math.sqrt(Math.max(0, xp) / 100)) + 1;
}

function freezeArray(values: string[]): readonly string[] {
  return Object.freeze(values);
}
