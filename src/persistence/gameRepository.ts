import type { RewardReceipt } from "../game/application/rewardPolicy";
import type { ActiveGame, GameResult, PuzzleRef } from "../game/types/game";
import type { Puzzle } from "../game/types/puzzle";
import type { DailyRecord, StandardProgress, Stats } from "../game/types/stats";
import type { ArchivistProfile } from "../progression/types";
import { NIBS, SEALS, STAMP_COLLECTION, TITLES } from "../progression/stamps";
import { diagnosticFingerprint } from "./diagnosticSerialization";

/** The sole persisted aggregate schema introduced by W1. */
export const PERSISTED_AGGREGATE_SCHEMA_VERSION = 2 as const;
export const TERMINAL_ATTEMPT_HISTORY_LIMIT = 500;

export type PersistedLanguage = "en" | "ru" | "de";

/**
 * ActiveGame is deliberately reused while W1 is being introduced.  The
 * required identifiers make its optimistic-concurrency boundary explicit.
 */
export type PersistedActiveAttempt = ActiveGame & {
  attemptId: string;
  revision: number;
  result?: never;
  endedAt?: never;
};

export type PersistedTerminalAttempt = Omit<PersistedActiveAttempt, "result" | "endedAt"> & {
  /** The terminal command that created this immutable record. */
  commandId: string;
  result: GameResult | "abandoned";
  endedAt: number;
  receiptId?: string;
  /** Presentation copy for denied/no-reward results; never re-evaluated on restore. */
  rewardReceipt?: RewardReceipt;
  /** Immutable payload used for durable Result/archive rendering after content edits. */
  puzzleSnapshot?: Puzzle;
};

export interface PersistedActiveSession {
  active: PersistedActiveAttempt;
  puzzleId: string;
  /** Present on every W2+ session; optional only for legacy schema-v2 data. */
  puzzleRef?: PuzzleRef;
  puzzleSnapshot?: Puzzle;
  savedAt: number;
}

export type PalimpsestStage = "obverse" | "obverse_done" | "reverse";

/**
 * The Palimpsest is a separate, non-scored mode, so it deliberately does not
 * reuse ActiveGame. Its compact snapshot contains only the board state needed
 * to resume the one curated dual-layer puzzle exactly after a reload.
 */
export interface PersistedPalimpsestSession {
  puzzleId: string;
  language: PersistedLanguage;
  stage: PalimpsestStage;
  order: string[];
  selection: string[];
  solvedGroupIds: string[];
  mistakesUsed: number;
  savedAt: number;
}

/** A self-contained daily record; the key is always `${language}:${date}`. */
export interface PersistedDailyRecord extends DailyRecord {
  language: PersistedLanguage;
  entryId: string;
  scheduleVersion: string;
  puzzleRef: {
    language: PersistedLanguage;
    puzzleId: string;
    lineageId: string;
    contentVersion: string;
  };
  winkUsed: boolean;
  attemptId: string;
  /** Exact board for replay after a calendar/content update; absent only on legacy imports. */
  puzzleSnapshot?: Puzzle;
  receiptId?: string;
}

export type DailyHistory = Record<string, PersistedDailyRecord>;

/**
 * One object-store record.  W1 intentionally keeps this as one aggregate so
 * terminal attempt, profile, receipt and Daily slot share one IDB transaction.
 */
export interface PersistedAggregateV2 {
  schemaVersion: typeof PERSISTED_AGGREGATE_SCHEMA_VERSION;
  profileRevision: number;
  activeSession: PersistedActiveSession | null;
  /** Additive W5 field. Undefined is accepted only while loading older v2 records. */
  palimpsestSession?: PersistedPalimpsestSession | null;
  /** Unacknowledged terminal result that must survive a reload. */
  pendingResultAttemptId: string | null;
  terminalAttempts: Record<string, PersistedTerminalAttempt>;
  stats: Stats;
  standardProgress: StandardProgress;
  dailyHistory: DailyHistory;
  onboarded: boolean;
  archivistProfile: ArchivistProfile;
}

export interface StartAttemptMutation {
  kind: "startAttempt";
  commandId: string;
  expectedProfileRevision: number;
  expectedActiveAttemptId: string | null;
  session: PersistedActiveSession;
  /** Selection sequence + seen lineage committed atomically with the session. */
  standardProgress: StandardProgress;
}

export interface SaveInProgressMutation {
  kind: "saveInProgress";
  commandId: string;
  expectedProfileRevision: number;
  expectedActiveAttemptId: string;
  expectedAttemptRevision: number;
  session: PersistedActiveSession;
}

export interface SavePalimpsestMutation {
  kind: "savePalimpsest";
  commandId: string;
  expectedProfileRevision: number;
  expectedActiveAttemptId: string | null;
  session: PersistedPalimpsestSession;
}

export interface CompletePalimpsestMutation {
  kind: "completePalimpsest";
  commandId: string;
  expectedProfileRevision: number;
  expectedActiveAttemptId: string | null;
  puzzleId: string;
  language: PersistedLanguage;
  stampId: "stamp_palimpsest";
}

/** Values produced by an application service after the pure engine/policy step. */
export interface FinalizeAggregateUpdate {
  stats: Stats;
  standardProgress: StandardProgress;
  archivistProfile: ArchivistProfile;
  onboarded?: boolean;
}

export interface FinalizeAttemptMutation {
  kind: "finalizeAttempt";
  commandId: string;
  expectedProfileRevision: number;
  expectedActiveAttemptId: string;
  expectedAttemptRevision: number;
  terminalAttempt: PersistedTerminalAttempt;
  update: FinalizeAggregateUpdate;
  /** Present only when the application policy created a receipt. */
  receipt?: RewardReceipt;
  /** Present only for the first scored completion of a Daily slot. */
  dailyRecord?: PersistedDailyRecord;
}

export interface AbandonAttemptMutation {
  kind: "abandon";
  commandId: string;
  expectedProfileRevision: number;
  expectedActiveAttemptId: string;
  expectedAttemptRevision: number;
  terminalAttempt: PersistedTerminalAttempt;
}

export interface ImportReplaceMutation {
  kind: "importReplace";
  commandId: string;
  expectedProfileRevision: number;
  expectedActiveAttemptId: string | null;
  replacement: PersistedAggregateV2;
}

export interface AcknowledgeResultMutation {
  kind: "acknowledgeResult";
  commandId: string;
  expectedProfileRevision: number;
  expectedActiveAttemptId: null;
  expectedPendingResultAttemptId: string;
}

export interface CollectStampMutation {
  kind: "collectStamp";
  commandId: string;
  expectedProfileRevision: number;
  expectedActiveAttemptId: string | null;
  stampId: string;
}

export interface UpdateProfileCosmeticMutation {
  kind: "updateProfileCosmetic";
  commandId: string;
  expectedProfileRevision: number;
  expectedActiveAttemptId: string | null;
  field: "sealId" | "nibId" | "titleId";
  value: string;
}

export interface LegacyPassportDetails {
  playerSeed?: string;
  sealId: string;
  nibId: string;
  titleId: string;
  collectedStampIds: string[];
}

export interface ImportLegacyPassportMutation {
  kind: "importLegacyPassport";
  commandId: string;
  expectedProfileRevision: number;
  expectedActiveAttemptId: string | null;
  details: LegacyPassportDetails;
}

export type AggregateMutation =
  | StartAttemptMutation
  | SaveInProgressMutation
  | SavePalimpsestMutation
  | CompletePalimpsestMutation
  | FinalizeAttemptMutation
  | AbandonAttemptMutation
  | AcknowledgeResultMutation
  | CollectStampMutation
  | UpdateProfileCosmeticMutation
  | ImportLegacyPassportMutation
  | ImportReplaceMutation;

export type AggregateConflictCode =
  | "profile-revision"
  | "active-attempt"
  | "attempt-revision"
  | "pending-result"
  | "reward-key"
  | "daily-slot";

export interface AggregateConflict {
  ok: false;
  kind: "conflict";
  code: AggregateConflictCode;
  current: PersistedAggregateV2;
}

export interface AggregateError {
  ok: false;
  kind: "error";
  code: "invalid-mutation" | "invalid-aggregate" | "unavailable" | "storage-failure";
  message: string;
}

export interface AggregateCommitted {
  ok: true;
  state: PersistedAggregateV2;
  /** True when an idempotent command observes its already-committed effect. */
  idempotent: boolean;
}

export type AggregateMutationResult = AggregateCommitted | AggregateConflict | AggregateError;

/** Uses a delimiter that cannot collide with valid ISO dates or language codes. */
export function getDailySlotKey(language: PersistedLanguage, date: string): string {
  return `${language}:${date}`;
}

/**
 * Pure compare-and-set transition.  It does not calculate game rules, stats,
 * or rewards; callers must supply those deterministic policy outputs.  This is
 * the deliberate integration boundary for the future attempt service.
 */
export function applyAggregateMutation(
  current: PersistedAggregateV2,
  mutation: AggregateMutation,
): AggregateMutationResult {
  if (!isPersistedAggregateV2(current)) {
    return error("invalid-aggregate", "The persisted record is not schema v2.");
  }
  // A network retry may carry the profile revision from before the first
  // commit. Its own terminal record is authoritative, so acknowledge it
  // before the general CAS guard rather than treating it as a fresh grant.
  if (mutation.kind === "finalizeAttempt") {
    const terminal = current.terminalAttempts[mutation.terminalAttempt.attemptId];
    if (terminal) {
      return isCommittedFinalize(current, mutation)
        ? { ok: true, state: current, idempotent: true }
        : conflict("attempt-revision", current);
    }
  }
  if (mutation.kind === "completePalimpsest") {
    const session = current.palimpsestSession ?? null;
    if (
      session === null &&
      current.archivistProfile.collectedStampIds.includes(mutation.stampId)
    ) {
      return { ok: true, state: current, idempotent: true };
    }
  }
  if (mutation.expectedProfileRevision !== current.profileRevision) {
    return conflict("profile-revision", current);
  }
  if (mutation.expectedActiveAttemptId !== getActiveAttemptId(current)) {
    return conflict("active-attempt", current);
  }

  switch (mutation.kind) {
    case "startAttempt":
      if (
        !isSessionConsistent(mutation.session) ||
        mutation.session.active.revision !== 0 ||
        !isValidProgress(mutation.standardProgress)
      ) {
        return error(
          "invalid-mutation",
          "startAttempt requires a valid new active session at revision zero and valid progress.",
        );
      }
      return committed({
        ...current,
        profileRevision: current.profileRevision + 1,
        activeSession: mutation.session,
        standardProgress: mutation.standardProgress,
        pendingResultAttemptId: null,
      });

    case "saveInProgress":
      return saveInProgress(current, mutation);

    case "savePalimpsest":
      if (!isValidPalimpsestSession(mutation.session)) {
        return error("invalid-mutation", "savePalimpsest requires a valid bounded session.");
      }
      return committed({
        ...current,
        profileRevision: current.profileRevision + 1,
        palimpsestSession: mutation.session,
      });

    case "completePalimpsest": {
      const session = current.palimpsestSession ?? null;
      if (
        !session ||
        session.puzzleId !== mutation.puzzleId ||
        session.language !== mutation.language
      ) {
        return conflict("active-attempt", current);
      }
      const collectedStampIds = current.archivistProfile.collectedStampIds.includes(
        mutation.stampId,
      )
        ? current.archivistProfile.collectedStampIds
        : [...current.archivistProfile.collectedStampIds, mutation.stampId];
      return committed({
        ...current,
        profileRevision: current.profileRevision + 1,
        palimpsestSession: null,
        archivistProfile: { ...current.archivistProfile, collectedStampIds },
      });
    }

    case "finalizeAttempt":
      return finalizeAttempt(current, mutation);

    case "abandon":
      return abandonAttempt(current, mutation);

    case "acknowledgeResult":
      if (current.pendingResultAttemptId !== mutation.expectedPendingResultAttemptId) {
        return conflict("pending-result", current);
      }
      return committed({
        ...current,
        profileRevision: current.profileRevision + 1,
        pendingResultAttemptId: null,
      });

    case "collectStamp":
      if (!/^[a-z0-9_-]{1,80}$/u.test(mutation.stampId)) {
        return error("invalid-mutation", "collectStamp requires a bounded stamp id.");
      }
      if (current.archivistProfile.collectedStampIds.includes(mutation.stampId)) {
        return { ok: true, state: current, idempotent: true };
      }
      return committed({
        ...current,
        profileRevision: current.profileRevision + 1,
        archivistProfile: {
          ...current.archivistProfile,
          collectedStampIds: [...current.archivistProfile.collectedStampIds, mutation.stampId],
        },
      });

    case "updateProfileCosmetic":
      if (!/^[a-z0-9_-]{1,80}$/u.test(mutation.value)) {
        return error("invalid-mutation", "updateProfileCosmetic requires a bounded option id.");
      }
      if (current.archivistProfile[mutation.field] === mutation.value) {
        return { ok: true, state: current, idempotent: true };
      }
      return committed({
        ...current,
        profileRevision: current.profileRevision + 1,
        archivistProfile: {
          ...current.archivistProfile,
          [mutation.field]: mutation.value,
        },
      });

    case "importLegacyPassport": {
      const details = mutation.details;
      const knownSeals = new Set(SEALS.map((item) => item.id));
      const knownNibs = new Set(NIBS.map((item) => item.id));
      const knownTitles = new Set(TITLES.map((item) => item.id));
      const knownStamps = new Set(STAMP_COLLECTION.map((item) => item.id));
      if (
        !knownSeals.has(details.sealId) ||
        !knownNibs.has(details.nibId) ||
        !knownTitles.has(details.titleId) ||
        !Array.isArray(details.collectedStampIds) ||
        details.collectedStampIds.length > STAMP_COLLECTION.length ||
        details.collectedStampIds.some((stampId) => !knownStamps.has(stampId)) ||
        (details.playerSeed !== undefined &&
          !/^[A-Za-z0-9_-]{1,128}$/u.test(details.playerSeed))
      ) {
        return error(
          "invalid-mutation",
          "importLegacyPassport requires known bounded details.",
        );
      }
      const collectedStampIds = [
        ...new Set([
          ...current.archivistProfile.collectedStampIds,
          ...details.collectedStampIds,
        ]),
      ];
      const unchanged =
        current.archivistProfile.sealId === details.sealId &&
        current.archivistProfile.nibId === details.nibId &&
        current.archivistProfile.titleId === details.titleId &&
        (details.playerSeed === undefined ||
          current.archivistProfile.playerSeed === details.playerSeed) &&
        collectedStampIds.length === current.archivistProfile.collectedStampIds.length;
      if (unchanged) return { ok: true, state: current, idempotent: true };
      return committed({
        ...current,
        profileRevision: current.profileRevision + 1,
        archivistProfile: {
          ...current.archivistProfile,
          sealId: details.sealId,
          nibId: details.nibId,
          titleId: details.titleId,
          collectedStampIds,
          playerSeed: details.playerSeed ?? current.archivistProfile.playerSeed,
        },
      });
    }

    case "importReplace":
      if (!isPersistedAggregateV2(mutation.replacement)) {
        return error("invalid-mutation", "importReplace requires a schema v2 replacement.");
      }
      return committed({
        ...mutation.replacement,
        profileRevision: current.profileRevision + 1,
      });
  }
}

function saveInProgress(
  current: PersistedAggregateV2,
  mutation: SaveInProgressMutation,
): AggregateMutationResult {
  const active = current.activeSession?.active;
  if (!active || active.revision !== mutation.expectedAttemptRevision) {
    return conflict("attempt-revision", current);
  }
  if (
    !isSessionConsistent(mutation.session) ||
    mutation.session.active.attemptId !== active.attemptId ||
    mutation.session.active.revision !== active.revision + 1
  ) {
    return error(
      "invalid-mutation",
      "saveInProgress must advance the active attempt by one revision.",
    );
  }
  return committed({
    ...current,
    profileRevision: current.profileRevision + 1,
    activeSession: mutation.session,
  });
}

function finalizeAttempt(
  current: PersistedAggregateV2,
  mutation: FinalizeAttemptMutation,
): AggregateMutationResult {
  const alreadyTerminal = current.terminalAttempts[mutation.terminalAttempt.attemptId];
  if (alreadyTerminal) {
    return isCommittedFinalize(current, mutation)
      ? { ok: true, state: current, idempotent: true }
      : conflict("attempt-revision", current);
  }

  const active = current.activeSession?.active;
  if (!active || active.revision !== mutation.expectedAttemptRevision) {
    return conflict("attempt-revision", current);
  }
  if (
    mutation.terminalAttempt.commandId !== mutation.commandId ||
    !isTerminalAdvance(active, mutation.terminalAttempt)
  ) {
    return error(
      "invalid-mutation",
      "finalizeAttempt must terminally advance the active attempt by one revision.",
    );
  }

  const receipt = mutation.receipt;
  if (receipt?.awarded) {
    const existingReceipt = current.archivistProfile.rewardReceipts?.[receipt.rewardKey];
    if (existingReceipt) {
      return conflict("reward-key", current);
    }
  }

  if (mutation.dailyRecord) {
    const dailySlot = getDailySlotKey(mutation.dailyRecord.language, mutation.dailyRecord.date);
    const existingDaily = current.dailyHistory[dailySlot];
    if (existingDaily) {
      return conflict("daily-slot", current);
    }
  }

  const archivistProfile = mergeReceipt(
    current.archivistProfile,
    mutation.update.archivistProfile,
    receipt,
  );
  const dailyHistory = mutation.dailyRecord
    ? {
        ...current.dailyHistory,
        [getDailySlotKey(mutation.dailyRecord.language, mutation.dailyRecord.date)]:
          mutation.dailyRecord,
      }
    : current.dailyHistory;

  return committed({
    ...current,
    profileRevision: current.profileRevision + 1,
    activeSession: null,
    pendingResultAttemptId: mutation.terminalAttempt.attemptId,
    terminalAttempts: appendTerminalAttempt(current.terminalAttempts, mutation.terminalAttempt),
    stats: mutation.update.stats,
    standardProgress: mutation.update.standardProgress,
    archivistProfile,
    onboarded: mutation.update.onboarded ?? current.onboarded,
    dailyHistory,
  });
}

function abandonAttempt(
  current: PersistedAggregateV2,
  mutation: AbandonAttemptMutation,
): AggregateMutationResult {
  const active = current.activeSession?.active;
  if (!active || active.revision !== mutation.expectedAttemptRevision) {
    return conflict("attempt-revision", current);
  }
  if (
    mutation.terminalAttempt.result !== "abandoned" ||
    mutation.terminalAttempt.commandId !== mutation.commandId ||
    !isTerminalAdvance(active, mutation.terminalAttempt)
  ) {
    return error(
      "invalid-mutation",
      "abandon must terminally advance the active attempt by one revision.",
    );
  }
  return committed({
    ...current,
    profileRevision: current.profileRevision + 1,
    activeSession: null,
    terminalAttempts: appendTerminalAttempt(current.terminalAttempts, mutation.terminalAttempt),
  });
}

function appendTerminalAttempt(
  current: Record<string, PersistedTerminalAttempt>,
  terminal: PersistedTerminalAttempt,
): Record<string, PersistedTerminalAttempt> {
  const entries = Object.entries({ ...current, [terminal.attemptId]: terminal });
  if (entries.length <= TERMINAL_ATTEMPT_HISTORY_LIMIT) return Object.fromEntries(entries);
  entries.sort(([idA, a], [idB, b]) => b.endedAt - a.endedAt || idA.localeCompare(idB));
  return Object.fromEntries(entries.slice(0, TERMINAL_ATTEMPT_HISTORY_LIMIT));
}

function mergeReceipt(
  current: ArchivistProfile,
  update: ArchivistProfile,
  receipt: RewardReceipt | undefined,
): ArchivistProfile {
  const previousReceipts = current.rewardReceipts ?? {};
  const updatedReceipts = update.rewardReceipts ?? {};
  const receipts = receipt?.awarded
    ? { ...previousReceipts, ...updatedReceipts, [receipt.rewardKey]: receipt }
    : { ...previousReceipts, ...updatedReceipts };
  const consumed = new Set([
    ...(current.consumedRewardKeys ?? []),
    ...(update.consumedRewardKeys ?? []),
  ]);
  if (receipt?.awarded) consumed.add(receipt.rewardKey);
  return { ...update, version: 2, rewardReceipts: receipts, consumedRewardKeys: [...consumed] };
}

function isSessionConsistent(session: PersistedActiveSession): boolean {
  if (
    session.puzzleId !== session.active.puzzleId ||
    !Number.isInteger(session.active.revision)
  ) {
    return false;
  }
  if (session.puzzleRef && !isValidPuzzleRef(session.puzzleRef, session.puzzleId)) return false;
  if (
    session.puzzleRef &&
    session.active.puzzleRef &&
    JSON.stringify(session.puzzleRef) !== JSON.stringify(session.active.puzzleRef)
  ) {
    return false;
  }
  if (
    session.puzzleSnapshot &&
    !isValidPuzzleSnapshot(session.puzzleSnapshot, session.puzzleId)
  ) {
    return false;
  }
  if (session.puzzleSnapshot) {
    const snapshotItems = session.puzzleSnapshot.groups.flatMap((group) => group.items);
    if (
      snapshotItems.length !== session.active.order.length ||
      snapshotItems.some((item) => !session.active.order.includes(item))
    ) {
      return false;
    }
  }
  return true;
}

function isTerminalAdvance(
  active: PersistedActiveAttempt,
  terminal: PersistedTerminalAttempt,
): boolean {
  return (
    terminal.attemptId === active.attemptId &&
    terminal.puzzleId === active.puzzleId &&
    terminal.revision === active.revision + 1 &&
    typeof terminal.commandId === "string" &&
    terminal.commandId.length > 0 &&
    Number.isFinite(terminal.endedAt)
  );
}

function sameTerminal(a: PersistedTerminalAttempt, b: PersistedTerminalAttempt): boolean {
  return (
    a.commandId === b.commandId &&
    a.attemptId === b.attemptId &&
    a.puzzleId === b.puzzleId &&
    a.revision === b.revision &&
    a.result === b.result &&
    a.endedAt === b.endedAt &&
    a.receiptId === b.receiptId &&
    JSON.stringify(a.rewardReceipt) === JSON.stringify(b.rewardReceipt) &&
    JSON.stringify(a.puzzleSnapshot) === JSON.stringify(b.puzzleSnapshot) &&
    a.mistakesUsed === b.mistakesUsed &&
    a.winkedGroupId === b.winkedGroupId &&
    JSON.stringify(a.solvedGroupIds) === JSON.stringify(b.solvedGroupIds)
  );
}

function sameReceipt(a: RewardReceipt, b: RewardReceipt): boolean {
  return a.receiptId === b.receiptId && a.rewardKey === b.rewardKey;
}

function sameDailyRecord(a: PersistedDailyRecord, b: PersistedDailyRecord): boolean {
  return (
    a.attemptId === b.attemptId &&
    a.entryId === b.entryId &&
    a.scheduleVersion === b.scheduleVersion &&
    JSON.stringify(a.puzzleRef) === JSON.stringify(b.puzzleRef) &&
    JSON.stringify(a.puzzleSnapshot) === JSON.stringify(b.puzzleSnapshot)
  );
}

function isCommittedFinalize(
  current: PersistedAggregateV2,
  mutation: FinalizeAttemptMutation,
): boolean {
  const terminal = current.terminalAttempts[mutation.terminalAttempt.attemptId];
  if (!terminal || !sameTerminal(terminal, mutation.terminalAttempt)) return false;
  if (mutation.receipt?.awarded) {
    const receipt = current.archivistProfile.rewardReceipts?.[mutation.receipt.rewardKey];
    if (!receipt || !sameReceipt(receipt, mutation.receipt)) return false;
  }
  if (mutation.dailyRecord) {
    const daily =
      current.dailyHistory[
        getDailySlotKey(mutation.dailyRecord.language, mutation.dailyRecord.date)
      ];
    if (!daily || !sameDailyRecord(daily, mutation.dailyRecord)) return false;
  }
  return true;
}

function getActiveAttemptId(current: PersistedAggregateV2): string | null {
  return current.activeSession?.active.attemptId ?? null;
}

function conflict(
  code: AggregateConflictCode,
  current: PersistedAggregateV2,
): AggregateConflict {
  return { ok: false, kind: "conflict", code, current };
}

function error(code: AggregateError["code"], message: string): AggregateError {
  return { ok: false, kind: "error", code, message };
}

function committed(state: PersistedAggregateV2): AggregateCommitted {
  return { ok: true, state, idempotent: false };
}

/** Minimal structural guard: malformed records are surfaced to recovery, never overwritten by defaults. */
export function isPersistedAggregateV2(value: unknown): value is PersistedAggregateV2 {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<PersistedAggregateV2>;
  if (
    !(
      candidate.schemaVersion === PERSISTED_AGGREGATE_SCHEMA_VERSION &&
      isNonNegativeInteger(candidate.profileRevision) &&
      candidate.activeSession !== undefined &&
      (candidate.palimpsestSession === undefined ||
        candidate.palimpsestSession === null ||
        isValidPalimpsestSession(candidate.palimpsestSession)) &&
      (candidate.pendingResultAttemptId === null ||
        typeof candidate.pendingResultAttemptId === "string") &&
      isValidTerminalAttempts(candidate.terminalAttempts) &&
      isValidStats(candidate.stats) &&
      isValidProgress(candidate.standardProgress) &&
      isValidDailyHistory(candidate.dailyHistory) &&
      typeof candidate.onboarded === "boolean" &&
      isValidProfile(candidate.archivistProfile)
    )
  ) {
    return false;
  }
  if (candidate.activeSession !== null) {
    const session = candidate.activeSession;
    if (
      !session ||
      !Number.isFinite(session.savedAt) ||
      !isSessionConsistent(session) ||
      !isValidAttempt(session.active, false)
    ) {
      return false;
    }
  }
  if (candidate.pendingResultAttemptId) {
    const pending = candidate.terminalAttempts[candidate.pendingResultAttemptId];
    if (!pending || pending.result === "abandoned" || candidate.activeSession !== null) {
      return false;
    }
    if (pending.receiptId) {
      const storedReceipt = Object.values(candidate.archivistProfile.rewardReceipts ?? {}).find(
        (receipt) => receipt.receiptId === pending.receiptId,
      );
      if (!storedReceipt) return false;
    }
  }
  return true;
}

/** Additive compatibility only; no counters or user-entered data are inferred. */
function normalizeAdditiveV2Fields(value: unknown): unknown {
  if (!isRecord(value) || value.schemaVersion !== PERSISTED_AGGREGATE_SCHEMA_VERSION) {
    return value;
  }
  let normalized: Record<string, unknown> = value;
  if (value.pendingResultAttemptId === undefined) {
    normalized = { ...normalized, pendingResultAttemptId: null };
  }
  if (value.palimpsestSession === undefined) {
    normalized = { ...normalized, palimpsestSession: null };
  }
  if (isRecord(value.dailyHistory)) {
    let changed = false;
    const dailyHistory = Object.fromEntries(
      Object.entries(value.dailyHistory).map(([key, rawRecord]) => {
        if (
          isRecord(rawRecord) &&
          (rawRecord.language === "en" ||
            rawRecord.language === "ru" ||
            rawRecord.language === "de") &&
          isRecord(rawRecord.puzzleRef) &&
          rawRecord.puzzleRef.language === undefined
        ) {
          changed = true;
          return [
            key,
            {
              ...rawRecord,
              puzzleRef: { ...rawRecord.puzzleRef, language: rawRecord.language },
            },
          ];
        }
        return [key, rawRecord];
      }),
    );
    if (changed) normalized = { ...normalized, dailyHistory };
  }
  return normalized;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function isStringArray(
  value: unknown,
  maxLength = Number.POSITIVE_INFINITY,
): value is string[] {
  return (
    Array.isArray(value) &&
    value.length <= maxLength &&
    value.every((item) => typeof item === "string")
  );
}

function isUniqueStringArray(
  value: unknown,
  maxLength = Number.POSITIVE_INFINITY,
): value is string[] {
  return isStringArray(value, maxLength) && new Set(value).size === value.length;
}

function isValidPalimpsestSession(value: unknown): value is PersistedPalimpsestSession {
  if (!isRecord(value)) return false;
  const stage = value.stage;
  const order = value.order;
  const selection = value.selection;
  const solvedGroupIds = value.solvedGroupIds;
  if (stage !== "obverse" && stage !== "obverse_done" && stage !== "reverse") return false;
  if (
    typeof value.puzzleId !== "string" ||
    value.puzzleId.length === 0 ||
    value.puzzleId.length > 120 ||
    (value.language !== "en" && value.language !== "ru" && value.language !== "de") ||
    !isUniqueStringArray(order, 16) ||
    order.length !== 16 ||
    !isUniqueStringArray(selection, 4) ||
    !isUniqueStringArray(solvedGroupIds, 4) ||
    !selection.every((word) => order.includes(word)) ||
    !solvedGroupIds.every((id) => /^[a-z0-9_-]{1,80}$/u.test(id)) ||
    !isNonNegativeInteger(value.mistakesUsed) ||
    value.mistakesUsed > 4 ||
    !Number.isFinite(value.savedAt)
  ) {
    return false;
  }
  return stage !== "obverse_done" || (solvedGroupIds.length === 4 && selection.length === 0);
}

function isValidRules(value: unknown): value is NonNullable<ActiveGame["rules"]> {
  if (!isRecord(value)) return false;
  return (
    value.version === 1 &&
    isNonNegativeInteger(value.maxIncorrectGuesses) &&
    value.maxIncorrectGuesses >= 1 &&
    value.maxIncorrectGuesses <= 4 &&
    typeof value.tabsEnabled === "boolean" &&
    (value.maxWinks === 0 || value.maxWinks === 1) &&
    (value.timerPresentation === "hidden" || value.timerPresentation === "optional")
  );
}

function isValidPuzzleRef(value: unknown, puzzleId?: string): value is PuzzleRef {
  if (!isRecord(value)) return false;
  return (
    (value.language === "en" || value.language === "ru" || value.language === "de") &&
    typeof value.puzzleId === "string" &&
    value.puzzleId.length > 0 &&
    (puzzleId === undefined || value.puzzleId === puzzleId) &&
    typeof value.lineageId === "string" &&
    value.lineageId.length > 0 &&
    typeof value.contentVersion === "string" &&
    value.contentVersion.length > 0
  );
}

function isValidPuzzleSnapshot(value: unknown, puzzleId: string): value is Puzzle {
  if (!isRecord(value) || value.id !== puzzleId) return false;
  if (typeof value.title !== "string" || value.title.length === 0) return false;
  if (
    value.difficulty !== "easy" &&
    value.difficulty !== "medium" &&
    value.difficulty !== "hard"
  ) {
    return false;
  }
  if (!Array.isArray(value.groups) || value.groups.length !== 4) return false;
  const groupIds = new Set<string>();
  const items = new Set<string>();
  for (const group of value.groups) {
    if (!isRecord(group) || typeof group.id !== "string" || groupIds.has(group.id))
      return false;
    if (
      typeof group.label !== "string" ||
      !Array.isArray(group.items) ||
      group.items.length !== 4
    ) {
      return false;
    }
    groupIds.add(group.id);
    for (const item of group.items) {
      if (typeof item !== "string" || item.length === 0 || items.has(item)) return false;
      items.add(item);
    }
  }
  return items.size === 16;
}

function isValidAttempt(value: unknown, terminal: boolean): boolean {
  if (!isRecord(value)) return false;
  const order = value.order;
  const selection = value.selection;
  const itemOrderIds = value.itemOrderIds;
  const selectionItemIds = value.selectionItemIds;
  const solvedGroupIds = value.solvedGroupIds;
  const startedAt = value.startedAt;
  const rules = value.rules;
  if (
    typeof value.attemptId !== "string" ||
    value.attemptId.length === 0 ||
    !isNonNegativeInteger(value.revision) ||
    typeof value.puzzleId !== "string" ||
    value.puzzleId.length === 0 ||
    !["daily", "standard", "zen"].includes(String(value.mode)) ||
    ![
      "daily",
      "practice",
      "onboarding",
      "zen",
      "archive",
      "mastery",
      "duel",
      "custom",
      "palimpsest",
    ].includes(String(value.context)) ||
    !isValidRules(rules) ||
    (value.puzzleRef !== undefined &&
      !isValidPuzzleRef(value.puzzleRef, value.puzzleId as string)) ||
    !isUniqueStringArray(order, 16) ||
    order.length !== 16 ||
    !isUniqueStringArray(selection, 4) ||
    !selection.every((id) => order.includes(id)) ||
    (itemOrderIds !== undefined &&
      (!isUniqueStringArray(itemOrderIds, 16) || itemOrderIds.length !== order.length)) ||
    (selectionItemIds !== undefined &&
      (!isUniqueStringArray(selectionItemIds, 4) ||
        !isUniqueStringArray(itemOrderIds, 16) ||
        selectionItemIds.length !== selection.length ||
        !selectionItemIds.every((id) => itemOrderIds.includes(id)))) ||
    !isUniqueStringArray(solvedGroupIds, 4) ||
    !isNonNegativeInteger(value.mistakesUsed) ||
    value.mistakesUsed > rules.maxIncorrectGuesses ||
    typeof startedAt !== "number" ||
    !Number.isFinite(startedAt) ||
    startedAt < 0 ||
    typeof value.countsToStats !== "boolean" ||
    !(value.winkedGroupId === null || typeof value.winkedGroupId === "string")
  ) {
    return false;
  }
  if (!terminal) return value.result === undefined && value.endedAt === undefined;
  if (
    !(
      typeof value.commandId === "string" &&
      value.commandId.length > 0 &&
      (value.result === "win" || value.result === "loss" || value.result === "abandoned") &&
      typeof value.endedAt === "number" &&
      Number.isFinite(value.endedAt) &&
      value.endedAt >= startedAt &&
      (value.receiptId === undefined || typeof value.receiptId === "string") &&
      (value.rewardReceipt === undefined || isValidRewardReceipt(value.rewardReceipt))
    )
  ) {
    return false;
  }
  if (value.result === "win" && solvedGroupIds.length !== 4) return false;
  if (value.result === "loss" && value.mistakesUsed < rules.maxIncorrectGuesses) return false;
  return true;
}

function isValidTerminalAttempts(
  value: unknown,
): value is Record<string, PersistedTerminalAttempt> {
  if (!isRecord(value)) return false;
  return Object.entries(value).every(([attemptId, attempt]) => {
    if (!isValidAttempt(attempt, true)) return false;
    const terminal = attempt as PersistedTerminalAttempt;
    return (
      terminal.attemptId === attemptId &&
      (terminal.puzzleSnapshot === undefined ||
        isValidPuzzleSnapshot(terminal.puzzleSnapshot, terminal.puzzleId))
    );
  });
}

function isValidRewardReceipt(value: unknown): value is RewardReceipt {
  if (!isRecord(value)) return false;
  return (
    value.schemaVersion === 2 &&
    typeof value.receiptId === "string" &&
    typeof value.rewardKey === "string" &&
    typeof value.awarded === "boolean" &&
    isNonNegativeInteger(value.xpGained) &&
    isNonNegativeInteger(value.prevLevel) &&
    isNonNegativeInteger(value.newLevel) &&
    typeof value.reason === "string"
  );
}

function isValidDailyHistory(value: unknown): value is DailyHistory {
  if (!isRecord(value)) return false;
  return Object.entries(value).every(([slot, record]) => {
    if (!isRecord(record)) return false;
    return (
      slot === `${String(record.language)}:${String(record.date)}` &&
      (record.language === "en" || record.language === "ru" || record.language === "de") &&
      typeof record.date === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(record.date) &&
      typeof record.entryId === "string" &&
      typeof record.scheduleVersion === "string" &&
      typeof record.puzzleId === "string" &&
      (record.result === "win" || record.result === "loss") &&
      isNonNegativeInteger(record.mistakesUsed) &&
      typeof record.durationMs === "number" &&
      Number.isFinite(record.durationMs) &&
      record.durationMs >= 0 &&
      typeof record.winkUsed === "boolean" &&
      typeof record.attemptId === "string" &&
      isRecord(record.puzzleRef) &&
      record.puzzleRef.language === record.language &&
      typeof record.puzzleRef.puzzleId === "string" &&
      record.puzzleRef.puzzleId === record.puzzleId &&
      typeof record.puzzleRef.lineageId === "string" &&
      typeof record.puzzleRef.contentVersion === "string" &&
      (record.puzzleSnapshot === undefined ||
        isValidPuzzleSnapshot(record.puzzleSnapshot, record.puzzleId))
    );
  });
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function isValidStats(value: unknown): value is Stats {
  if (!isRecord(value)) return false;
  return (
    isNonNegativeInteger(value.gamesPlayed) &&
    isNonNegativeInteger(value.wins) &&
    isNonNegativeInteger(value.losses) &&
    isNonNegativeInteger(value.currentStreak) &&
    isNonNegativeInteger(value.bestStreak) &&
    value.wins <= value.gamesPlayed &&
    value.losses <= value.gamesPlayed &&
    value.wins + value.losses <= value.gamesPlayed &&
    value.currentStreak <= value.bestStreak &&
    Array.isArray(value.solvedPuzzleIds) &&
    value.solvedPuzzleIds.every((id) => typeof id === "string") &&
    [
      "mediumWins",
      "mediumLosses",
      "totalMistakes",
      "winkUses",
      "flawlessWins",
      "mediumLossStreak",
      "hardWins",
      "hardLosses",
      "hardLossStreak",
      "zenStreak",
      "bestZenStreak",
    ].every((key) => value[key] === undefined || isNonNegativeInteger(value[key]))
  );
}

function isValidProgress(value: unknown): value is StandardProgress {
  if (!isRecord(value) || !isNonNegativeInteger(value.cursor)) return false;
  return (
    ["easyCursor", "mediumCursor", "hardCursor", "zenCursor", "selectionSequence"].every(
      (key) => value[key] === undefined || isNonNegativeInteger(value[key]),
    ) &&
    (value.seenLineageIds === undefined || isUniqueStringArray(value.seenLineageIds)) &&
    (value.completedStarterEntryIds === undefined ||
      isUniqueStringArray(value.completedStarterEntryIds)) &&
    (value.recentTopicTags === undefined || isStringArray(value.recentTopicTags, 2)) &&
    (value.recentItemValues === undefined || isStringArray(value.recentItemValues, 48))
  );
}

function isValidProfile(value: unknown): value is ArchivistProfile {
  if (!isRecord(value)) return false;
  return (
    (value.version === 1 || value.version === 2) &&
    isNonNegativeInteger(value.level) &&
    isNonNegativeInteger(value.xp) &&
    isNonNegativeInteger(value.ink) &&
    isNonNegativeInteger(value.wax) &&
    isNonNegativeInteger(value.prestige) &&
    isStringArray(value.collectedStampIds) &&
    isNonNegativeInteger(value.contractsAttempted) &&
    isNonNegativeInteger(value.contractsWon) &&
    (value.consumedRewardKeys === undefined || isStringArray(value.consumedRewardKeys)) &&
    (value.rewardReceipts === undefined ||
      (isRecord(value.rewardReceipts) &&
        Object.values(value.rewardReceipts).every(isValidRewardReceipt)))
  );
}

const DEFAULT_DB_NAME = "foldwink";
const DEFAULT_STORE_NAME = "game-aggregate";
const AGGREGATE_KEY = "profile";
/** One-slot pre-import recovery snapshot; written in the same transaction as replacement. */
export const PROFILE_IMPORT_RECOVERY_KEY = "profile:pre-import-recovery";
const DATABASE_VERSION = 1;

export interface IndexedDbGameRepositoryOptions {
  indexedDb?: IDBFactory;
  dbName?: string;
}

export class CorruptAggregateError extends Error {
  readonly code = "corrupt" as const;

  constructor(
    message: string,
    readonly raw: unknown,
  ) {
    super(message);
    this.name = "CorruptAggregateError";
  }
}

/**
 * Native browser IndexedDB adapter. Each commit reads, CAS-checks and writes
 * the aggregate through one readwrite transaction and one object-store key.
 */
export class IndexedDbGameRepository {
  private readonly factory: IDBFactory | undefined;
  private readonly dbName: string;
  private db: IDBDatabase | null = null;

  constructor(options: IndexedDbGameRepositoryOptions = {}) {
    this.factory =
      options.indexedDb ?? (typeof indexedDB === "undefined" ? undefined : indexedDB);
    this.dbName = options.dbName ?? DEFAULT_DB_NAME;
  }

  async open(): Promise<void> {
    if (this.db) return;
    if (!this.factory) throw new Error("IndexedDB is unavailable.");
    this.db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = this.factory!.open(this.dbName, DATABASE_VERSION);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(DEFAULT_STORE_NAME)) {
          request.result.createObjectStore(DEFAULT_STORE_NAME);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error("Could not open IndexedDB."));
      request.onblocked = () => reject(new Error("IndexedDB open is blocked by another tab."));
    });
  }

  async load(): Promise<PersistedAggregateV2 | null> {
    try {
      await this.open();
      const transaction = this.database().transaction(DEFAULT_STORE_NAME, "readonly");
      const value = await requestResult<unknown>(
        transaction.objectStore(DEFAULT_STORE_NAME).get(AGGREGATE_KEY),
      );
      await transactionComplete(transaction);
      if (value === undefined) return null;
      const normalized = normalizeAdditiveV2Fields(value);
      if (!isPersistedAggregateV2(normalized)) {
        throw new CorruptAggregateError(
          "IndexedDB aggregate is malformed or uses an unsupported schema.",
          value,
        );
      }
      return normalized;
    } catch (cause) {
      if (cause instanceof CorruptAggregateError) throw cause;
      throw toRepositoryError("load", cause);
    }
  }

  async commit(mutation: AggregateMutation): Promise<AggregateMutationResult> {
    try {
      await this.open();
      const transaction = this.database().transaction(DEFAULT_STORE_NAME, "readwrite");
      const store = transaction.objectStore(DEFAULT_STORE_NAME);
      const value = await requestResult<unknown>(store.get(AGGREGATE_KEY));
      if (value === undefined && mutation.kind === "importReplace") {
        const initial = createInitialImport(mutation);
        if (initial.ok) store.add(initial.state, AGGREGATE_KEY);
        await transactionComplete(transaction);
        return initial;
      }
      const normalized = normalizeAdditiveV2Fields(value);
      if (!isPersistedAggregateV2(normalized)) {
        await transactionComplete(transaction);
        return error(
          "invalid-aggregate",
          "No valid schema v2 aggregate is available to commit.",
        );
      }
      const result = applyAggregateMutation(normalized, mutation);
      if (result.ok) {
        if (mutation.kind === "importReplace")
          store.put(normalized, PROFILE_IMPORT_RECOVERY_KEY);
        store.put(result.state, AGGREGATE_KEY);
      }
      await transactionComplete(transaction);
      return result;
    } catch (cause) {
      return error(
        this.factory ? "storage-failure" : "unavailable",
        `IndexedDB commit failed: ${messageFromCause(cause)}`,
      );
    }
  }

  /** Reads the latest atomic pre-import snapshot, if one exists and is valid. */
  async loadImportRecovery(): Promise<PersistedAggregateV2 | null> {
    try {
      await this.open();
      const transaction = this.database().transaction(DEFAULT_STORE_NAME, "readonly");
      const value = await requestResult<unknown>(
        transaction.objectStore(DEFAULT_STORE_NAME).get(PROFILE_IMPORT_RECOVERY_KEY),
      );
      await transactionComplete(transaction);
      const normalized = normalizeAdditiveV2Fields(value);
      return isPersistedAggregateV2(normalized) ? normalized : null;
    } catch (cause) {
      throw toRepositoryError("load import recovery", cause);
    }
  }

  /** Restores the recovery snapshot using the same optimistic CAS boundary as any import. */
  async restoreImportRecovery(
    expectedProfileRevision: number,
    expectedActiveAttemptId: string | null,
  ): Promise<AggregateMutationResult> {
    const recovery = await this.loadImportRecovery();
    if (!recovery)
      return error("invalid-aggregate", "No valid pre-import recovery snapshot is available.");
    return this.commit({
      kind: "importReplace",
      commandId: `restore-recovery:${Date.now()}`,
      expectedProfileRevision,
      expectedActiveAttemptId,
      replacement: recovery,
    });
  }

  async clear(): Promise<void> {
    try {
      await this.open();
      const transaction = this.database().transaction(DEFAULT_STORE_NAME, "readwrite");
      const store = transaction.objectStore(DEFAULT_STORE_NAME);
      store.delete(AGGREGATE_KEY);
      store.delete(PROFILE_IMPORT_RECOVERY_KEY);
      await transactionComplete(transaction);
    } catch (cause) {
      throw toRepositoryError("clear", cause);
    }
  }

  async clearCorrupt(expectedFingerprint: string): Promise<"cleared" | "changed"> {
    try {
      await this.open();
      const transaction = this.database().transaction(DEFAULT_STORE_NAME, "readwrite");
      const store = transaction.objectStore(DEFAULT_STORE_NAME);
      const value = await requestResult<unknown>(store.get(AGGREGATE_KEY));
      const normalized = normalizeAdditiveV2Fields(value);
      if (
        value === undefined ||
        isPersistedAggregateV2(normalized) ||
        diagnosticFingerprint(value) !== expectedFingerprint
      ) {
        await transactionComplete(transaction);
        return "changed";
      }
      store.delete(AGGREGATE_KEY);
      await transactionComplete(transaction);
      return "cleared";
    } catch (cause) {
      throw toRepositoryError("clear corrupt", cause);
    }
  }

  close(): void {
    this.db?.close();
    this.db = null;
  }

  private database(): IDBDatabase {
    if (!this.db) throw new Error("IndexedDB has not been opened.");
    return this.db;
  }
}

/** A first migration/import has no prior aggregate, so it may establish revision 1 exactly once. */
function createInitialImport(mutation: ImportReplaceMutation): AggregateMutationResult {
  if (
    mutation.expectedProfileRevision !== 0 ||
    mutation.expectedActiveAttemptId !== null ||
    !isPersistedAggregateV2(mutation.replacement) ||
    mutation.replacement.profileRevision !== 0
  ) {
    return error(
      "invalid-mutation",
      "The first import must replace an empty revision-0 profile.",
    );
  }
  return committed({ ...mutation.replacement, profileRevision: 1 });
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed."));
  });
}

function transactionComplete(transaction: IDBTransaction): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onabort = () =>
      reject(transaction.error ?? new Error("IndexedDB transaction aborted."));
    transaction.onerror = () =>
      reject(transaction.error ?? new Error("IndexedDB transaction failed."));
  });
}

function toRepositoryError(operation: string, cause: unknown): Error {
  return new Error(`IndexedDB ${operation} failed: ${messageFromCause(cause)}`);
}

function messageFromCause(cause: unknown): string {
  return cause instanceof Error ? cause.message : String(cause);
}
