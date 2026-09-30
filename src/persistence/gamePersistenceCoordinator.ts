import type { CommitSolveRewardInput } from "../progression/archivistProfile";
import type { ArchivistProfile } from "../progression/types";
import { evaluateRewardPolicy, type RewardReceipt } from "../game/application/rewardPolicy";
import type { ActiveGame } from "../game/types/game";
import type { DailyRecord, StandardProgress, Stats } from "../game/types/stats";
import type { Puzzle } from "../game/types/puzzle";
import {
  applyAggregateMutation,
  type AggregateConflict,
  type AggregateMutation,
  type AggregateMutationResult,
  type PersistedActiveAttempt,
  type PersistedAggregateV2,
  type PersistedDailyRecord,
  type PersistedLanguage,
  type LegacyPassportDetails,
  type PersistedPalimpsestSession,
  type PersistedTerminalAttempt,
} from "./gameRepository";

export interface GameRepositoryWriter {
  commit(mutation: AggregateMutation): Promise<AggregateMutationResult>;
}

export interface CoordinatorCallbacks {
  onCommitted?: (state: PersistedAggregateV2) => void;
  onConflict?: (conflict: AggregateConflict) => void;
  onError?: (
    result: Exclude<AggregateMutationResult, { ok: true } | AggregateConflict>,
  ) => void;
}

export interface FinalizePersistenceInput {
  active: ActiveGame;
  puzzle: Puzzle;
  language: PersistedLanguage;
  stats: Stats;
  standardProgress: StandardProgress;
  onboarded: boolean;
  todayDailyRecord: DailyRecord | null;
  rewardReceipt: RewardReceipt | null;
}

function persistedActive(active: ActiveGame): PersistedActiveAttempt | null {
  if (!active.attemptId || !Number.isInteger(active.revision) || active.result) return null;
  const { result: _result, endedAt: _endedAt, ...inProgress } = active;
  return { ...inProgress, attemptId: active.attemptId, revision: active.revision! };
}

function profileWithReward(
  profile: ArchivistProfile,
  receipt: RewardReceipt | null,
): ArchivistProfile {
  if (!receipt?.awarded) return profile;
  return {
    ...profile,
    version: 2,
    xp: profile.xp + receipt.xpGained,
    level: Math.max(profile.level, receipt.newLevel),
    consumedRewardKeys: [
      ...new Set([...(profile.consumedRewardKeys ?? []), receipt.rewardKey]),
    ],
    rewardReceipts: { ...(profile.rewardReceipts ?? {}), [receipt.rewardKey]: receipt },
  };
}

function persistedDaily(
  input: FinalizePersistenceInput,
  attemptId: string,
): PersistedDailyRecord | undefined {
  const record = input.todayDailyRecord;
  if (input.active.mode !== "daily" || !input.active.countsToStats || !record) return undefined;
  const daily = input.active.daily;
  const puzzleRef = input.active.puzzleRef;
  const entryId = daily?.entryId ?? `legacy-daily:${input.language}:${record.date}`;
  return {
    ...record,
    language: input.language,
    entryId,
    scheduleVersion: daily?.scheduleVersion ?? "legacy-calendar-v1",
    puzzleRef: {
      language: puzzleRef?.language ?? input.language,
      puzzleId: puzzleRef?.puzzleId ?? input.puzzle.id,
      lineageId: puzzleRef?.lineageId ?? input.puzzle.id,
      contentVersion: puzzleRef?.contentVersion ?? "catalog-legacy-v1",
    },
    winkUsed: input.active.winkedGroupId !== null,
    attemptId,
    puzzleSnapshot: input.puzzle,
    receiptId: input.rewardReceipt?.awarded ? input.rewardReceipt.receiptId : undefined,
  };
}

/**
 * Serialises one tab's commands while IndexedDB supplies the real cross-tab
 * CAS boundary. Pure optimistic application lets rapid UI mutations keep
 * their exact revision order without issuing overlapping transactions.
 */
export class GamePersistenceCoordinator {
  private optimistic: PersistedAggregateV2;
  private queue: Promise<void> = Promise.resolve();
  private halted = false;

  constructor(
    private readonly repository: GameRepositoryWriter,
    initial: PersistedAggregateV2,
    private readonly callbacks: CoordinatorCallbacks = {},
  ) {
    this.optimistic = initial;
  }

  snapshot(): PersistedAggregateV2 {
    return this.optimistic;
  }

  flush(): Promise<boolean> {
    return this.queue.then(() => !this.halted);
  }

  previewReward(input: CommitSolveRewardInput): RewardReceipt {
    const profile = this.optimistic.archivistProfile;
    return evaluateRewardPolicy({
      ...input,
      currentXp: profile.xp,
      currentLevel: profile.level,
      consumedRewardKeys: profile.consumedRewardKeys ?? [],
    }).receipt;
  }

  start(
    active: ActiveGame,
    puzzle: Puzzle,
    savedAt: number,
    standardProgress: StandardProgress,
  ): boolean {
    const candidate = persistedActive(active);
    if (!candidate || candidate.revision !== 0) return false;
    return this.enqueue({
      kind: "startAttempt",
      commandId: `start:${candidate.attemptId}`,
      expectedProfileRevision: this.optimistic.profileRevision,
      expectedActiveAttemptId: this.optimistic.activeSession?.active.attemptId ?? null,
      session: {
        active: candidate,
        puzzleId: puzzle.id,
        puzzleRef: candidate.puzzleRef,
        puzzleSnapshot: puzzle,
        savedAt,
      },
      standardProgress,
    });
  }

  save(active: ActiveGame, puzzle: Puzzle, savedAt: number): boolean {
    const candidate = persistedActive(active);
    const previous = this.optimistic.activeSession?.active;
    if (!candidate || !previous || candidate.attemptId !== previous.attemptId) return false;
    return this.enqueue({
      kind: "saveInProgress",
      commandId: `save:${candidate.attemptId}:${candidate.revision}`,
      expectedProfileRevision: this.optimistic.profileRevision,
      expectedActiveAttemptId: candidate.attemptId,
      expectedAttemptRevision: previous.revision,
      session: {
        active: candidate,
        puzzleId: puzzle.id,
        puzzleRef: candidate.puzzleRef,
        puzzleSnapshot: puzzle,
        savedAt,
      },
    });
  }

  finalize(input: FinalizePersistenceInput): boolean {
    const active = input.active;
    const attemptId = active.attemptId;
    const revision = active.revision;
    const result = active.result;
    const previous = this.optimistic.activeSession?.active;
    if (!attemptId || !Number.isInteger(revision) || !result || !active.endedAt || !previous) {
      return false;
    }
    const commandId = `finalize:${attemptId}:${revision}:${result}`;
    const terminal: PersistedTerminalAttempt = {
      ...active,
      attemptId,
      revision: revision!,
      commandId,
      result,
      endedAt: active.endedAt,
      receiptId: input.rewardReceipt?.awarded ? input.rewardReceipt.receiptId : undefined,
      rewardReceipt: input.rewardReceipt ?? undefined,
      puzzleSnapshot: input.puzzle,
    };
    return this.enqueue({
      kind: "finalizeAttempt",
      commandId,
      expectedProfileRevision: this.optimistic.profileRevision,
      expectedActiveAttemptId: attemptId,
      expectedAttemptRevision: previous.revision,
      terminalAttempt: terminal,
      update: {
        stats: input.stats,
        standardProgress: input.standardProgress,
        archivistProfile: profileWithReward(
          this.optimistic.archivistProfile,
          input.rewardReceipt,
        ),
        onboarded: input.onboarded,
      },
      receipt: input.rewardReceipt ?? undefined,
      dailyRecord: persistedDaily(input, attemptId),
    });
  }

  abandon(active: ActiveGame, endedAt: number): boolean {
    const attemptId = active.attemptId;
    const revision = active.revision;
    const previous = this.optimistic.activeSession?.active;
    if (
      !attemptId ||
      !Number.isInteger(revision) ||
      !previous ||
      previous.attemptId !== attemptId
    ) {
      return false;
    }
    const commandId = `abandon:${attemptId}:${revision! + 1}`;
    return this.enqueue({
      kind: "abandon",
      commandId,
      expectedProfileRevision: this.optimistic.profileRevision,
      expectedActiveAttemptId: attemptId,
      expectedAttemptRevision: previous.revision,
      terminalAttempt: {
        ...active,
        attemptId,
        commandId,
        revision: previous.revision + 1,
        result: "abandoned",
        endedAt,
      },
    });
  }

  acknowledgeResult(attemptId: string): boolean {
    if (this.optimistic.pendingResultAttemptId !== attemptId) return false;
    return this.enqueue({
      kind: "acknowledgeResult",
      commandId: `ack-result:${attemptId}`,
      expectedProfileRevision: this.optimistic.profileRevision,
      expectedActiveAttemptId: null,
      expectedPendingResultAttemptId: attemptId,
    });
  }

  collectStamp(stampId: string): boolean {
    return this.enqueue({
      kind: "collectStamp",
      commandId: `collect-stamp:${stampId}`,
      expectedProfileRevision: this.optimistic.profileRevision,
      expectedActiveAttemptId: this.optimistic.activeSession?.active.attemptId ?? null,
      stampId,
    });
  }

  palimpsestSession(
    language: PersistedLanguage,
    puzzleId: string,
  ): PersistedPalimpsestSession | null {
    const session = this.optimistic.palimpsestSession ?? null;
    return session?.language === language && session.puzzleId === puzzleId ? session : null;
  }

  savePalimpsest(session: PersistedPalimpsestSession): boolean {
    return this.enqueue({
      kind: "savePalimpsest",
      commandId: `save-palimpsest:${session.language}:${session.puzzleId}:${session.savedAt}`,
      expectedProfileRevision: this.optimistic.profileRevision,
      expectedActiveAttemptId: this.optimistic.activeSession?.active.attemptId ?? null,
      session,
    });
  }

  /**
   * Atomically clears the resumable board and records the one cosmetic stamp.
   * The repository treats a previously completed record as idempotent.
   */
  completePalimpsest(language: PersistedLanguage, puzzleId: string): boolean {
    const session = this.palimpsestSession(language, puzzleId);
    if (!session) return false;
    const alreadyCollected =
      this.optimistic.archivistProfile.collectedStampIds.includes("stamp_palimpsest");
    const enqueued = this.enqueue({
      kind: "completePalimpsest",
      commandId: `complete-palimpsest:${language}:${puzzleId}`,
      expectedProfileRevision: this.optimistic.profileRevision,
      expectedActiveAttemptId: this.optimistic.activeSession?.active.attemptId ?? null,
      language,
      puzzleId,
      stampId: "stamp_palimpsest",
    });
    return enqueued && !alreadyCollected;
  }

  updateProfileCosmetic(field: "sealId" | "nibId" | "titleId", value: string): boolean {
    return this.enqueue({
      kind: "updateProfileCosmetic",
      commandId: `profile-cosmetic:${field}:${value}`,
      expectedProfileRevision: this.optimistic.profileRevision,
      expectedActiveAttemptId: this.optimistic.activeSession?.active.attemptId ?? null,
      field,
      value,
    });
  }

  async importLegacyPassport(details: LegacyPassportDetails): Promise<boolean> {
    const accepted = this.enqueue({
      kind: "importLegacyPassport",
      commandId: `legacy-passport:${Date.now()}`,
      expectedProfileRevision: this.optimistic.profileRevision,
      expectedActiveAttemptId: this.optimistic.activeSession?.active.attemptId ?? null,
      details,
    });
    return accepted ? this.flush() : false;
  }

  private enqueue(mutation: AggregateMutation): boolean {
    if (this.halted) return false;
    const optimistic = applyAggregateMutation(this.optimistic, mutation);
    if (!optimistic.ok) return false;
    this.optimistic = optimistic.state;
    this.queue = this.queue.then(async () => {
      if (this.halted) return;
      const result = await this.repository.commit(mutation);
      if (result.ok) {
        this.callbacks.onCommitted?.(result.state);
        return;
      }
      this.halted = true;
      if (result.kind === "conflict") {
        this.optimistic = result.current;
        this.callbacks.onConflict?.(result);
      } else {
        this.callbacks.onError?.(result);
      }
    });
    return true;
  }
}
