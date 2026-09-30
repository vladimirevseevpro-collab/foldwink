import type { ArchivistProfile } from "../progression/types";
import { getLevelFromXp } from "../progression/archivistProfile";
import { safeWrite } from "../utils/storage";
import {
  IndexedDbGameRepository,
  isPersistedAggregateV2,
  TERMINAL_ATTEMPT_HISTORY_LIMIT,
  type PersistedAggregateV2,
  type PersistedDailyRecord,
  type PersistedLanguage,
  type PersistedTerminalAttempt,
} from "./gameRepository";

export const PROFILE_BACKUP_VERSION = 1 as const;
export const PROFILE_BACKUP_KIND = "foldwink-profile-backup" as const;
export const PROFILE_BACKUP_MAX_BYTES = 2 * 1024 * 1024;
export const PROFILE_BACKUP_MAX_IDENTITY_MARKERS = 20_000;

export interface ProfileBackupEnvelope {
  version: typeof PROFILE_BACKUP_VERSION;
  kind: typeof PROFILE_BACKUP_KIND;
  aggregate: PersistedAggregateV2;
  language: PersistedLanguage;
  createdAt: number;
}

export type ProfileBackupErrorCode =
  | "invalid-json"
  | "oversized"
  | "unsupported-version"
  | "invalid-envelope"
  | "limits"
  | "empty"
  | "baseline-choice-required"
  | "conflict"
  | "storage-failure";

export class ProfileBackupError extends Error {
  constructor(
    readonly code: ProfileBackupErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ProfileBackupError";
  }
}

export interface BackupPreview {
  language: PersistedLanguage;
  createdAt: number;
  terminalAttempts: number;
  solvedMarkers: number;
  dailyRecords: number;
  collectionRecords: number;
  conflictingDailySlots: string[];
  currentLegacyBaseline: number;
  importedLegacyBaseline: number;
  requiresBaselineSelection: boolean;
}

export type BaselineChoice = "current" | "imported";
export type ProfileImportMode = "merge" | "replace";

export interface ProfileImportCommit {
  state: PersistedAggregateV2;
  preview: BackupPreview;
}

const textEncoder = new TextEncoder();

function encodedSize(value: string): number {
  return textEncoder.encode(value).byteLength;
}

function receiptXp(aggregate: PersistedAggregateV2): number {
  return Object.values(aggregate.archivistProfile.rewardReceipts ?? {}).reduce(
    (total, receipt) => total + (receipt.awarded ? receipt.xpGained : 0),
    0,
  );
}

function legacyBaseline(aggregate: PersistedAggregateV2): number {
  return Math.max(0, aggregate.archivistProfile.xp - receiptXp(aggregate));
}

function union(...arrays: (readonly string[] | undefined)[]): string[] {
  return [...new Set(arrays.flatMap((array) => array ?? []))];
}

function identityMarkerCount(aggregate: PersistedAggregateV2): number {
  const profile = aggregate.archivistProfile;
  return (
    aggregate.stats.solvedPuzzleIds.length +
    (aggregate.standardProgress.seenLineageIds?.length ?? 0) +
    (aggregate.standardProgress.completedStarterEntryIds?.length ?? 0) +
    profile.collectedStampIds.length +
    (profile.consumedRewardKeys?.length ?? 0) +
    Object.keys(profile.rewardReceipts ?? {}).length +
    Object.keys(aggregate.dailyHistory).length
  );
}

function assertLimits(aggregate: PersistedAggregateV2): void {
  if (Object.keys(aggregate.terminalAttempts).length > TERMINAL_ATTEMPT_HISTORY_LIMIT) {
    throw new ProfileBackupError("limits", "Backup contains too many terminal attempts.");
  }
  if (identityMarkerCount(aggregate) > PROFILE_BACKUP_MAX_IDENTITY_MARKERS) {
    throw new ProfileBackupError("limits", "Backup contains too many identity records.");
  }
}

function portableAggregate(aggregate: PersistedAggregateV2): PersistedAggregateV2 {
  const { playerSeed: _playerSeed, ...portableProfile } = aggregate.archivistProfile;
  return {
    ...aggregate,
    activeSession: null,
    palimpsestSession: null,
    pendingResultAttemptId: null,
    archivistProfile: portableProfile,
  };
}

export function exportProfile(
  aggregate: PersistedAggregateV2,
  language: PersistedLanguage,
  createdAt = Date.now(),
): string {
  if (!isPersistedAggregateV2(aggregate)) {
    throw new ProfileBackupError("invalid-envelope", "Aggregate is not schema v2.");
  }
  assertLimits(aggregate);
  const envelope: ProfileBackupEnvelope = {
    version: PROFILE_BACKUP_VERSION,
    kind: PROFILE_BACKUP_KIND,
    aggregate: portableAggregate(aggregate),
    language,
    createdAt,
  };
  const json = JSON.stringify(envelope);
  if (encodedSize(json) > PROFILE_BACKUP_MAX_BYTES) {
    throw new ProfileBackupError("oversized", "Backup exceeds 2 MiB.");
  }
  return json;
}

export function parseProfileBackup(input: string | unknown): ProfileBackupEnvelope {
  if (typeof input === "string" && encodedSize(input) > PROFILE_BACKUP_MAX_BYTES) {
    throw new ProfileBackupError("oversized", "Backup exceeds 2 MiB.");
  }

  let value: unknown;
  try {
    value = typeof input === "string" ? JSON.parse(input) : input;
  } catch {
    throw new ProfileBackupError("invalid-json", "Backup is not valid JSON.");
  }
  if (!value || typeof value !== "object") {
    throw new ProfileBackupError("invalid-envelope", "Backup envelope is malformed.");
  }

  const candidate = value as Partial<ProfileBackupEnvelope>;
  if (candidate.version !== PROFILE_BACKUP_VERSION) {
    throw new ProfileBackupError("unsupported-version", "Unsupported backup version.");
  }
  if (
    candidate.kind !== PROFILE_BACKUP_KIND ||
    !isPersistedAggregateV2(candidate.aggregate) ||
    (candidate.language !== "en" &&
      candidate.language !== "ru" &&
      candidate.language !== "de") ||
    typeof candidate.createdAt !== "number" ||
    !Number.isFinite(candidate.createdAt) ||
    candidate.createdAt < 0
  ) {
    throw new ProfileBackupError("invalid-envelope", "Backup envelope is malformed.");
  }

  let serialized: string;
  try {
    serialized = typeof input === "string" ? input : JSON.stringify(value);
  } catch {
    throw new ProfileBackupError("invalid-envelope", "Backup envelope cannot be serialized.");
  }
  if (encodedSize(serialized) > PROFILE_BACKUP_MAX_BYTES) {
    throw new ProfileBackupError("oversized", "Backup exceeds 2 MiB.");
  }
  assertLimits(candidate.aggregate);

  return {
    version: PROFILE_BACKUP_VERSION,
    kind: PROFILE_BACKUP_KIND,
    aggregate: portableAggregate(candidate.aggregate),
    language: candidate.language,
    createdAt: candidate.createdAt,
  };
}

export function previewProfileBackup(
  current: PersistedAggregateV2,
  imported: ProfileBackupEnvelope,
): BackupPreview {
  const conflictingDailySlots = Object.keys(imported.aggregate.dailyHistory)
    .filter((slot) => current.dailyHistory[slot])
    .sort();
  const currentLegacyBaseline = legacyBaseline(current);
  const importedLegacyBaseline = legacyBaseline(imported.aggregate);
  return {
    language: imported.language,
    createdAt: imported.createdAt,
    terminalAttempts: Object.keys(imported.aggregate.terminalAttempts).length,
    solvedMarkers: imported.aggregate.stats.solvedPuzzleIds.length,
    dailyRecords: Object.keys(imported.aggregate.dailyHistory).length,
    collectionRecords: imported.aggregate.archivistProfile.collectedStampIds.length,
    conflictingDailySlots,
    currentLegacyBaseline,
    importedLegacyBaseline,
    requiresBaselineSelection: currentLegacyBaseline !== importedLegacyBaseline,
  };
}

function mergeTerminalAttempts(
  current: Record<string, PersistedTerminalAttempt>,
  imported: Record<string, PersistedTerminalAttempt>,
): Record<string, PersistedTerminalAttempt> {
  return Object.fromEntries(
    Object.entries({ ...imported, ...current })
      .sort(
        ([idA, attemptA], [idB, attemptB]) =>
          attemptB.endedAt - attemptA.endedAt || idA.localeCompare(idB),
      )
      .slice(0, TERMINAL_ATTEMPT_HISTORY_LIMIT),
  );
}

function mergeProfileFields(
  current: PersistedAggregateV2,
  imported: PersistedAggregateV2,
  choice: BaselineChoice,
): ArchivistProfile {
  const source = choice === "imported" ? imported.archivistProfile : current.archivistProfile;
  // Local receipts are authoritative on a key collision; a foreign file may not rewrite history.
  const receipts = {
    ...(imported.archivistProfile.rewardReceipts ?? {}),
    ...(current.archivistProfile.rewardReceipts ?? {}),
  };
  const consumedRewardKeys = union(
    current.archivistProfile.consumedRewardKeys,
    imported.archivistProfile.consumedRewardKeys,
    Object.keys(receipts),
  );
  const xp =
    (choice === "imported" ? legacyBaseline(imported) : legacyBaseline(current)) +
    Object.values(receipts).reduce(
      (total, receipt) => total + (receipt.awarded ? receipt.xpGained : 0),
      0,
    );
  const derivedLevel = getLevelFromXp(xp);

  return {
    ...source,
    version: 2,
    playerSeed: current.archivistProfile.playerSeed,
    activeContract: null,
    xp,
    level: Math.max(source.level, derivedLevel),
    collectedStampIds: union(
      current.archivistProfile.collectedStampIds,
      imported.archivistProfile.collectedStampIds,
    ),
    consumedRewardKeys,
    rewardReceipts: receipts,
    migrationReceipts: union(
      current.archivistProfile.migrationReceipts,
      imported.archivistProfile.migrationReceipts,
    ),
  };
}

export function mergeProfile(
  current: PersistedAggregateV2,
  imported: PersistedAggregateV2,
  choice: BaselineChoice = "current",
): PersistedAggregateV2 {
  const source = choice === "imported" ? imported : current;
  const merged: PersistedAggregateV2 = {
    ...source,
    profileRevision: current.profileRevision,
    activeSession: current.activeSession,
    palimpsestSession: current.palimpsestSession ?? null,
    pendingResultAttemptId: current.pendingResultAttemptId,
    terminalAttempts: mergeTerminalAttempts(
      current.terminalAttempts,
      imported.terminalAttempts,
    ),
    stats: {
      ...source.stats,
      solvedPuzzleIds: union(current.stats.solvedPuzzleIds, imported.stats.solvedPuzzleIds),
    },
    standardProgress: {
      ...source.standardProgress,
      seenLineageIds: union(
        current.standardProgress.seenLineageIds,
        imported.standardProgress.seenLineageIds,
      ),
      completedStarterEntryIds: union(
        current.standardProgress.completedStarterEntryIds,
        imported.standardProgress.completedStarterEntryIds,
      ),
    },
    dailyHistory: { ...imported.dailyHistory, ...current.dailyHistory },
    onboarded: current.onboarded || imported.onboarded,
    archivistProfile: mergeProfileFields(current, imported, choice),
  };
  assertLimits(merged);
  return merged;
}

export function replaceProfile(
  current: PersistedAggregateV2,
  imported: PersistedAggregateV2,
): PersistedAggregateV2 {
  return {
    ...portableAggregate(imported),
    profileRevision: current.profileRevision,
    archivistProfile: {
      ...imported.archivistProfile,
      version: 2,
      playerSeed: current.archivistProfile.playerSeed,
      activeContract: null,
    },
  };
}

function createCommandId(): string {
  return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? `profile-import:${crypto.randomUUID()}`
    : `profile-import:${Date.now()}:${Math.random().toString(36).slice(2)}`;
}

function writeCompatibilityMirror(
  state: PersistedAggregateV2,
  language: PersistedLanguage,
): void {
  const daily = Object.fromEntries(
    Object.values(state.dailyHistory)
      .filter((record) => record.language === language)
      .map((record) => [record.date, record]),
  ) as Record<string, PersistedDailyRecord>;
  safeWrite("foldwink:stats", state.stats);
  safeWrite("foldwink:progress", state.standardProgress);
  safeWrite("foldwink:daily", daily);
  safeWrite("foldwink:onboarded", state.onboarded);
  safeWrite("foldwink:archivistProfile", state.archivistProfile);
  safeWrite("foldwink:active-session", state.activeSession);
}

export async function readCurrentProfileBackup(language: PersistedLanguage): Promise<string> {
  const repository = new IndexedDbGameRepository();
  try {
    const current = await repository.load();
    if (!current) throw new ProfileBackupError("empty", "No profile is available to export.");
    return exportProfile(current, language);
  } catch (error) {
    if (error instanceof ProfileBackupError) throw error;
    throw new ProfileBackupError(
      "storage-failure",
      error instanceof Error ? error.message : "Could not read the profile.",
    );
  } finally {
    repository.close();
  }
}

export async function hasProfileImportRecovery(): Promise<boolean> {
  const repository = new IndexedDbGameRepository();
  try {
    return Boolean(await repository.loadImportRecovery());
  } catch {
    return false;
  } finally {
    repository.close();
  }
}

export async function restoreLastProfileImport(
  language: PersistedLanguage,
): Promise<PersistedAggregateV2> {
  const repository = new IndexedDbGameRepository();
  try {
    const current = await repository.load();
    if (!current) throw new ProfileBackupError("empty", "No local profile is available.");
    const result = await repository.restoreImportRecovery(
      current.profileRevision,
      current.activeSession?.active.attemptId ?? null,
    );
    if (!result.ok) {
      throw new ProfileBackupError(
        result.kind === "conflict" ? "conflict" : "storage-failure",
        result.kind === "conflict"
          ? "The profile changed in another tab. Reload before restoring."
          : result.message,
      );
    }
    writeCompatibilityMirror(result.state, language);
    return result.state;
  } catch (error) {
    if (error instanceof ProfileBackupError) throw error;
    throw new ProfileBackupError(
      "storage-failure",
      error instanceof Error ? error.message : "Could not restore the previous profile.",
    );
  } finally {
    repository.close();
  }
}

export async function commitProfileImport(
  envelope: ProfileBackupEnvelope,
  mode: ProfileImportMode,
  baselineChoice?: BaselineChoice,
): Promise<ProfileImportCommit> {
  const repository = new IndexedDbGameRepository();
  try {
    const current = await repository.load();
    if (!current) throw new ProfileBackupError("empty", "No local profile is available.");
    const preview = previewProfileBackup(current, envelope);
    if (mode === "merge" && preview.requiresBaselineSelection && !baselineChoice) {
      throw new ProfileBackupError(
        "baseline-choice-required",
        "Choose which legacy XP baseline to keep before merging.",
      );
    }
    const replacement =
      mode === "merge"
        ? mergeProfile(current, envelope.aggregate, baselineChoice ?? "current")
        : replaceProfile(current, envelope.aggregate);
    const result = await repository.commit({
      kind: "importReplace",
      commandId: createCommandId(),
      expectedProfileRevision: current.profileRevision,
      expectedActiveAttemptId: current.activeSession?.active.attemptId ?? null,
      replacement,
    });
    if (!result.ok) {
      throw new ProfileBackupError(
        result.kind === "conflict" ? "conflict" : "storage-failure",
        result.kind === "conflict"
          ? "The profile changed in another tab. Review the import again."
          : result.message,
      );
    }
    writeCompatibilityMirror(result.state, envelope.language);
    return { state: result.state, preview };
  } catch (error) {
    if (error instanceof ProfileBackupError) throw error;
    throw new ProfileBackupError(
      "storage-failure",
      error instanceof Error ? error.message : "Could not import the profile.",
    );
  } finally {
    repository.close();
  }
}

export const serializeProfileBackup = exportProfile;
export const parseBackup = parseProfileBackup;
export const previewImport = previewProfileBackup;
export const mergeImport = mergeProfile;
export const replaceImport = replaceProfile;
