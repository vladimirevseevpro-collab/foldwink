import type { GameResult, PuzzleLanguage, PuzzleRef } from "./game";
import type { Puzzle, PuzzleDifficulty } from "./puzzle";

/**
 * A single completed attempt. Added in 0.4.2 for the progression readiness
 * model — we keep the last N entries (FIFO) to derive time and confidence
 * signals without running a full stats ledger.
 */
export interface RecentSolve {
  difficulty: PuzzleDifficulty;
  result: GameResult;
  mistakesUsed: number;
  durationMs: number;
}

/** Maximum entries kept in `Stats.recentSolves`. */
export const RECENT_SOLVES_LIMIT = 10;

export interface Stats {
  gamesPlayed: number;
  wins: number;
  losses: number;
  currentStreak: number;
  bestStreak: number;
  solvedPuzzleIds: string[];
  /** Aggregate counters added in Sprint 4. All optional for backwards-compat with older saved blobs. */
  mediumWins?: number;
  mediumLosses?: number;
  totalMistakes?: number;
  winkUses?: number;
  flawlessWins?: number;
  /** Consecutive medium losses — reset on any medium win. 0.4.2. */
  mediumLossStreak?: number;
  /** Rolling log of the last completed attempts (max `RECENT_SOLVES_LIMIT`). 0.4.2. */
  recentSolves?: RecentSolve[];
  /** Hard tier counters added in 0.4.3. Zero until the first Hard puzzle ships. */
  hardWins?: number;
  hardLosses?: number;
  hardLossStreak?: number;
  zenStreak?: number;
  bestZenStreak?: number;
}

export interface DailyRecord {
  date: string;
  puzzleId: string;
  result: GameResult;
  mistakesUsed: number;
  durationMs: number;
  graceWaxUsed?: boolean;
  /** W2 identity fields are optional only for legacy localStorage records. */
  language?: PuzzleLanguage;
  entryId?: string;
  scheduleVersion?: string;
  puzzleRef?: PuzzleRef;
  puzzleSnapshot?: Puzzle;
  attemptId?: string;
}

export interface StandardProgress {
  /**
   * Legacy field. Since 0.4.2 the effective easy-mode cursor lives in
   * `easyCursor`; `cursor` is preserved as a fallback for old saved state.
   */
  cursor: number;
  /** Easy-mode cursor added in 0.4.2. Falls back to `cursor` if absent. */
  easyCursor?: number;
  /** Medium-mode cursor added in 0.4.2. Defaults to 0. */
  mediumCursor?: number;
  /** Hard-mode cursor added in 0.4.3. Defaults to 0. */
  hardCursor?: number;
  /** Zen-mode sequential cursor for unlimited 500+ archive play. */
  zenCursor?: number;
  /** Increments whenever a new practice selection is committed, including after a loss. */
  selectionSequence?: number;
  /** Seen is intentionally distinct from solved; abandon/loss still records exposure. */
  seenLineageIds?: string[];
  /** Explicit manifest positions completed by a terminal win or loss. */
  completedStarterEntryIds?: string[];
  /** Leading topic tag for the last two newly selected practice boards. */
  recentTopicTags?: string[];
  /** Item vocabulary for the last three newly selected practice boards. */
  recentItemValues?: string[];
}

export const INITIAL_STATS: Stats = {
  gamesPlayed: 0,
  wins: 0,
  losses: 0,
  currentStreak: 0,
  bestStreak: 0,
  solvedPuzzleIds: [],
  mediumWins: 0,
  mediumLosses: 0,
  totalMistakes: 0,
  winkUses: 0,
  flawlessWins: 0,
  mediumLossStreak: 0,
  recentSolves: [],
  hardWins: 0,
  hardLosses: 0,
  hardLossStreak: 0,
};
