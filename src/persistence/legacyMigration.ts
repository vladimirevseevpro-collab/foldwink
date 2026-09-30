import type { ActiveGame, AttemptContext, AttemptRules } from "../game/types/game";
import type { PuzzleDifficulty } from "../game/types/puzzle";
import type { DailyRecord, StandardProgress, Stats } from "../game/types/stats";
import type { ArchivistProfile } from "../progression/types";
import {
  PERSISTED_AGGREGATE_SCHEMA_VERSION,
  getDailySlotKey,
  type PersistedActiveAttempt,
  type PersistedAggregateV2,
  type PersistedDailyRecord,
  type PersistedLanguage,
} from "./gameRepository";

export const LEGACY_IMPORT_SCHEDULE_VERSION = "legacy-local-v1";
export const LEGACY_IMPORT_CONTENT_VERSION = "legacy-local-import";

export interface LegacyPersistenceSnapshot {
  language: PersistedLanguage;
  stats: Stats;
  standardProgress: StandardProgress;
  dailyHistory: Record<string, DailyRecord>;
  onboarded: boolean;
  archivistProfile: ArchivistProfile;
  activeSession: { active: ActiveGame; puzzleId: string; savedAt: number } | null;
  getPuzzleDifficulty?: (puzzleId: string) => PuzzleDifficulty | undefined;
}

function contextFor(active: ActiveGame): AttemptContext {
  if (active.context) return active.context;
  if (active.mode === "daily") return "daily";
  if (active.mode === "zen") return "zen";
  return "practice";
}

function rulesFor(active: ActiveGame, difficulty: PuzzleDifficulty | undefined): AttemptRules {
  if (active.rules) return active.rules;
  const tabsEnabled = difficulty === "medium";
  return {
    version: 1,
    maxIncorrectGuesses: 4,
    tabsEnabled,
    maxWinks: tabsEnabled ? 1 : 0,
    timerPresentation: "optional",
  };
}

function legacyAttemptId(active: ActiveGame): string {
  return `legacy-attempt:${active.mode}:${active.puzzleId}:${Math.max(0, active.startedAt)}`;
}

function derivedRevision(active: ActiveGame): number {
  if (Number.isInteger(active.revision) && (active.revision ?? -1) >= 0) {
    return active.revision!;
  }
  return Math.max(
    1,
    active.solvedGroupIds.length +
      active.mistakesUsed +
      (active.winkedGroupId ? 1 : 0) +
      (active.selection.length > 0 ? 1 : 0),
  );
}

function migrateActiveSession(
  snapshot: LegacyPersistenceSnapshot,
): PersistedAggregateV2["activeSession"] {
  const session = snapshot.activeSession;
  if (!session || session.active.result || session.active.puzzleId !== session.puzzleId)
    return null;
  const active = session.active;
  const attemptId = active.attemptId || legacyAttemptId(active);
  const migrated: PersistedActiveAttempt = {
    ...active,
    attemptId,
    context: contextFor(active),
    revision: derivedRevision(active),
    rules: rulesFor(active, snapshot.getPuzzleDifficulty?.(active.puzzleId)),
    startedLocalDate: active.startedLocalDate,
    incorrectGuessSignatures: Array.isArray(active.incorrectGuessSignatures)
      ? [...new Set(active.incorrectGuessSignatures)]
      : [],
    result: undefined,
    endedAt: undefined,
  };
  return { active: migrated, puzzleId: session.puzzleId, savedAt: session.savedAt };
}

function migrateDailyRecord(
  language: PersistedLanguage,
  date: string,
  record: DailyRecord,
): PersistedDailyRecord {
  const puzzleId = record.puzzleId;
  const entryId = `legacy-daily:${language}:${date}`;
  return {
    ...record,
    date,
    language,
    entryId,
    scheduleVersion: LEGACY_IMPORT_SCHEDULE_VERSION,
    puzzleRef: {
      language,
      puzzleId,
      lineageId: puzzleId,
      contentVersion: LEGACY_IMPORT_CONTENT_VERSION,
    },
    winkUsed: false,
    attemptId: `${entryId}:${puzzleId}`,
  };
}

/**
 * Pure, deterministic one-way mapping. Calling it repeatedly with the same
 * legacy snapshot produces the same aggregate; only the repository decides
 * whether the import has already been committed.
 */
export function migrateLegacySnapshot(
  snapshot: LegacyPersistenceSnapshot,
): PersistedAggregateV2 {
  const dailyHistory: PersistedAggregateV2["dailyHistory"] = {};
  for (const [key, record] of Object.entries(snapshot.dailyHistory)) {
    if (!record || typeof record !== "object") continue;
    const date = record.date || key;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !record.puzzleId) continue;
    dailyHistory[getDailySlotKey(snapshot.language, date)] = migrateDailyRecord(
      snapshot.language,
      date,
      record,
    );
  }

  return {
    schemaVersion: PERSISTED_AGGREGATE_SCHEMA_VERSION,
    profileRevision: 0,
    activeSession: migrateActiveSession(snapshot),
    pendingResultAttemptId: null,
    terminalAttempts: {},
    stats: snapshot.stats,
    standardProgress: snapshot.standardProgress,
    dailyHistory,
    onboarded: snapshot.onboarded,
    archivistProfile: {
      ...snapshot.archivistProfile,
      version: 2,
      consumedRewardKeys: [...(snapshot.archivistProfile.consumedRewardKeys ?? [])],
      rewardReceipts: { ...(snapshot.archivistProfile.rewardReceipts ?? {}) },
      migrationReceipts: [...(snapshot.archivistProfile.migrationReceipts ?? [])],
    },
  };
}
