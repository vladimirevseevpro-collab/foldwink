import { IndexedDbGameRepository } from "./gameRepository";
import { diagnosticFingerprint, jsonSafeForDiagnostic } from "./diagnosticSerialization";

const RECOVERY_PREFIX = "foldwink:corrupt-aggregate-recovery:v1:";

export interface CorruptAggregateRecoverySnapshot {
  schemaVersion: 1;
  capturedAt: string;
  source: "indexeddb:foldwink/game-aggregate/profile";
  reason: string;
  rawFingerprint: string;
  raw: unknown;
}

let currentSnapshot: CorruptAggregateRecoverySnapshot | null = null;

export function preserveCorruptAggregate(raw: unknown, reason: string): void {
  const snapshot: CorruptAggregateRecoverySnapshot = {
    schemaVersion: 1,
    capturedAt: new Date().toISOString(),
    source: "indexeddb:foldwink/game-aggregate/profile",
    reason,
    rawFingerprint: diagnosticFingerprint(raw),
    raw: jsonSafeForDiagnostic(raw),
  };
  currentSnapshot = snapshot;
  try {
    if (typeof localStorage !== "undefined") {
      const suffix = snapshot.capturedAt.replaceAll(":", "-");
      localStorage.setItem(`${RECOVERY_PREFIX}${suffix}`, JSON.stringify(snapshot, null, 2));
    }
  } catch {
    // The in-memory snapshot still permits a diagnostic download this session.
  }
}

export function downloadCorruptAggregateSnapshot(): boolean {
  if (!currentSnapshot || typeof document === "undefined") return false;
  const blob = new Blob([JSON.stringify(currentSnapshot, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `foldwink-recovery-${currentSnapshot.capturedAt.slice(0, 10)}.json`;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
  return true;
}

export async function clearCorruptAggregate(): Promise<void> {
  if (!currentSnapshot) throw new Error("No corrupt aggregate snapshot is active.");
  const repository = new IndexedDbGameRepository();
  try {
    const result = await repository.clearCorrupt(currentSnapshot.rawFingerprint);
    if (result !== "cleared") {
      throw new Error("The recovery target changed in another tab.");
    }
  } finally {
    repository.close();
  }
}
