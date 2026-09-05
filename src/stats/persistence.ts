import { safeRead, safeWrite } from "../utils/storage";
import {
  INITIAL_STATS,
  type Stats,
  type StandardProgress,
  type DailyRecord,
} from "../game/types/stats";
import type { ActiveGame } from "../game/types/game";
import { applyGraceWaxProtection, type GraceWaxResult } from "./dailyRitual";
import { loadArchivistProfile, saveArchivistProfile } from "../progression/archivistProfile";

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
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(SESSION_KEY);
    }
  } catch {
    /* ignore */
  }
}

/**
 * Wipes every Foldwink-owned localStorage key: stats, progress, daily
 * history, onboarding flag, saved session, sound settings, haptics
 * settings, and the local analytics counter. Intended for user-initiated
 * full resets and for automated QA agents. Every key is namespaced with
 * `foldwink:` so we can scan defensively.
 */
export function clearAllLocalData(): void {
  if (typeof localStorage === "undefined") return;
  try {
    const toDelete: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("foldwink:")) toDelete.push(key);
    }
    for (const k of toDelete) localStorage.removeItem(k);
  } catch {
    /* ignore — storage unavailable */
  }
}
