export type GameMode = "daily" | "standard" | "zen";
export type AppScreen = "menu" | "game" | "result" | "stats";
export type GameResult = "win" | "loss";
export type PuzzleLanguage = "en" | "ru" | "de";

export interface PuzzleRef {
  language: PuzzleLanguage;
  puzzleId: string;
  lineageId: string;
  contentVersion: string;
}

export interface DailyAttemptRef {
  date: string;
  scheduleVersion: string;
  entryId: string;
}

export type AttemptContext =
  | "daily"
  | "practice"
  | "onboarding"
  | "zen"
  | "mastery"
  | "archive"
  | "duel"
  | "custom"
  | "palimpsest";

export interface AttemptRules {
  version: 1;
  /** Terminal threshold: the normal game loses on the fourth unique miss. */
  maxIncorrectGuesses: number;
  tabsEnabled: boolean;
  maxWinks: 0 | 1;
  timerPresentation: "hidden" | "optional";
}

export interface ActiveGame {
  /** Present on every newly-created W1 attempt. Optional only while legacy sessions migrate. */
  attemptId?: string;
  context?: AttemptContext;
  revision?: number;
  rules?: AttemptRules;
  startedLocalDate?: string;
  /** Version-pinned identity for every W2+ attempt. Optional only on legacy restores. */
  puzzleRef?: PuzzleRef;
  /** Immutable daily slot identity. Present only for a scheduled Daily attempt. */
  daily?: DailyAttemptRef;
  /** Explicit starter manifest position used for completion/retry semantics. */
  starterEntryId?: string;
  /** Previous attempt when the player explicitly retries the same pinned board. */
  parentAttemptId?: string;
  puzzleId: string;
  mode: GameMode;
  order: string[];
  selection: string[];
  /** Stable item identities parallel to order/selection on every W2+ attempt. */
  itemOrderIds?: string[];
  selectionItemIds?: string[];
  solvedGroupIds: string[];
  mistakesUsed: number;
  /**
   * Persisted sum of monotonic foreground intervals.  Optional only for
   * legacy attempts, whose historical wall-clock duration remains readable.
   */
  elapsedActiveMs?: number;
  startedAt: number;
  endedAt?: number;
  result?: GameResult;
  countsToStats: boolean;
  /** Canonical signatures of unique incorrect quartets already consumed. */
  incorrectGuessSignatures?: string[];
  /**
   * The id of the group whose Foldwink Tab the player has chosen to WINK
   * this game. null if no wink has been used yet. One wink per puzzle,
   * medium puzzles only. Winking immediately reveals the full reveal hint
   * for that tab, regardless of the current progressive-reveal stage.
   */
  winkedGroupId: string | null;
}

export const MAX_MISTAKES = 4;
export const SELECTION_SIZE = 4;
export const MAX_WINKS_PER_GAME = 1;
