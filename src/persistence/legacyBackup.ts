import { safeRead, safeWrite } from "../utils/storage";
import type { LegacyPersistenceSnapshot } from "./legacyMigration";

export const LEGACY_MIGRATION_BACKUP_KEY = "foldwink:migration-backup:v1";

export interface LegacyMigrationBackup {
  version: 1;
  createdAt: number;
  snapshot: Omit<LegacyPersistenceSnapshot, "getPuzzleDifficulty">;
}

function isBackup(value: unknown): value is LegacyMigrationBackup {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<LegacyMigrationBackup>;
  return (
    candidate.version === 1 &&
    typeof candidate.createdAt === "number" &&
    !!candidate.snapshot &&
    typeof candidate.snapshot === "object"
  );
}

/** Keep one recoverable pre-migration snapshot; retries never overwrite it. */
export function saveLegacyMigrationBackupOnce(
  snapshot: LegacyPersistenceSnapshot,
  createdAt = Date.now(),
): LegacyMigrationBackup {
  const existing = safeRead<unknown>(LEGACY_MIGRATION_BACKUP_KEY, null);
  if (isBackup(existing)) return existing;
  const { getPuzzleDifficulty: _resolver, ...serializable } = snapshot;
  const backup: LegacyMigrationBackup = { version: 1, createdAt, snapshot: serializable };
  safeWrite(LEGACY_MIGRATION_BACKUP_KEY, backup);
  return backup;
}

export function loadLegacyMigrationBackup(): LegacyMigrationBackup | null {
  const value = safeRead<unknown>(LEGACY_MIGRATION_BACKUP_KEY, null);
  return isBackup(value) ? value : null;
}
