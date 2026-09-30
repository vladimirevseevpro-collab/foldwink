import { clearFoldwinkNamespace, safeRead, safeWrite, safeRemove } from "../utils/storage";

import {
  INITIAL_STATS,
  type Stats,
  type StandardProgress,
  type DailyRecord,
} from "../game/types/stats";
import type { ActiveGame } from "../game/types/game";
import { applyGraceWaxProtection, type GraceWaxResult } from "./dailyRitual";
import { loadArchivistProfile, saveArchivistProfile } from "../progression/archivistProfile";
import { IndexedDbGameRepository } from "../persistence/gameRepository";

const STATS_KEY = "foldwink:stats";
const PROGRESS_KEY = "foldwink:progress";
const DAILY_KEY = "foldwink:daily";
const ONBOARDED_KEY = "foldwink:onboarded";
const SESSION_KEY = "foldwink:active-session";

export function loadStats(): Stats {
  const s = safeRead<Stats>(STATS_KEY, INITIAL_STATS);
  return {
    ...INITIAL_STATS,
    ...s,
    solvedPuzzleIds: Array.isArray(s.solvedPuzzleIds) ? s.solvedPuzzleIds : [],
  };
}

export function saveStats(stats: Stats): void {
  safeWrite(STATS_KEY, stats);
}

export function loadProgress(): StandardProgress {
  return safeRead<StandardProgress>(PROGRESS_KEY, { cursor: 0 });
}

export function saveProgress(p: StandardProgress): void {
  safeWrite(PROGRESS_KEY, p);
}

export type DailyHistory = Record<string, DailyRecord>;

export function loadDailyHistory(): DailyHistory {
  return safeRead<DailyHistory>(DAILY_KEY, {});
}

export function saveDailyHistory(h: DailyHistory): void {
  safeWrite(DAILY_KEY, h);
}

export function checkAndProtectDailyStreakWithGraceWax(today: string): GraceWaxResult {
  const history = loadDailyHistory();
  const profile = loadArchivistProfile();
  const res = applyGraceWaxProtection(history, today, profile);
  if (res.result.applied) {
    saveDailyHistory(res.history);
    saveArchivistProfile({ ...profile, wax: res.waxRemaining });
  }
  return res.result;
}

export function loadOnboarded(): boolean {
  return safeRead<boolean>(ONBOARDED_KEY, false);
}

export function saveOnboarded(v: boolean): void {
  safeWrite(ONBOARDED_KEY, v);
}

/**
 * Mid-game persistence. A single active session is saved on every game-
 * screen mutation and cleared on menu / result transitions. On app init,
 * `loadActiveSession` returns the most recent session; the caller verifies
 * the puzzle id is still in the pool before restoring.
 */

export interface StoredSession {
  active: ActiveGame;
  puzzleId: string;
  savedAt: number;
}

export function loadActiveSession(): StoredSession | null {
  return safeRead<StoredSession | null>(SESSION_KEY, null);
}

export function saveActiveSession(session: StoredSession): void {
  safeWrite(SESSION_KEY, session);
}

export function clearActiveSession(): void {
  safeRemove(SESSION_KEY);
}

/**
 * Wipes every Foldwink-owned adapter entry and CacheStorage cache, then the
 * IndexedDB aggregate. It is only invoked after the explicit UI confirmation;
 * callers receive false rather than claiming success after an aborted store.
 */
export async function clearAllLocalData(): Promise<boolean> {
  const adapterResult = await clearFoldwinkNamespace();
  const repository = new IndexedDbGameRepository();
  let indexedDbCleared = false;
  try {
    await repository.clear();
    indexedDbCleared = true;
  } catch {
    /* The caller receives false and must not claim a completed reset. */
  } finally {
    repository.close();
  }
  return adapterResult.ok && indexedDbCleared;
}
