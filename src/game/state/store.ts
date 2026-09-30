import { create } from "zustand";
import type {
  ActiveGame,
  AppScreen,
  AttemptContext,
  DailyAttemptRef,
  GameMode,
  GameResult,
  PuzzleRef,
} from "../types/game";
import type { Puzzle } from "../types/puzzle";
import type { Stats, StandardProgress, DailyRecord } from "../types/stats";
import { INITIAL_STATS } from "../types/stats";
import { SELECTION_SIZE } from "../types/game";
import { resolveDailyEntry, type DailyEntryLookup } from "../../puzzles/daily";
import {
  getNextProgressionPuzzle,
  getOrCreatePlayerSeed,
  selectPracticePuzzle,
  type PracticeCandidate,
} from "../../puzzles/progression";
import {
  getEditorialRecord,
  getStarterManifest,
  type EditorialRecord,
  type PuzzleLanguage,
  type StarterManifest,
} from "../../puzzles/catalog";
import {
  flattenPuzzle,
  itemIdForValue,
  seedFromString,
  shuffleFlatItems,
} from "../engine/shuffle";
import { canSubmit, findMatchingGroup, guessSignature, isOneAway } from "../engine/submit";
import { applyCorrectGroup, applyIncorrectGuess, isLoss, isWin } from "../engine/progress";
import { calculateResultSummary, type ResultSummary } from "../engine/result";
import { canWinkGroup } from "../engine/foldwinkTabs";
import { addForegroundDelta, foregroundDelta } from "../timing/foreground";
import { applyGameResult } from "../../stats/stats";
import { todayLocal } from "../../utils/date";
import { getLangSync } from "../../i18n/useLanguage";
import { isSupporter } from "../../monetization/supporter";
import { trackEvent } from "../../analytics/eventLog";
import { getResearchAcquisition, recordQualifiedDay } from "../../analytics/researchCohort";
import { bucketDuration } from "../../share/challengeLink";
import type { RewardReceipt } from "../application/rewardPolicy";
import type { LegacyPassportDetails } from "../../persistence/gameRepository";
import {
  commitSolveReward,
  type CommitSolveRewardInput,
} from "../../progression/archivistProfile";

type FlashKind = "correct" | "incorrect" | "one-away" | "repeat" | null;
export type PersistenceIssue = "unavailable" | "corrupt" | "conflict" | "storage-error" | null;
export type ContentIssue = "unavailable" | null;

export interface DuelChallengeMetadata {
  source: "legacy" | "challenge-v2";
  creatorResult?: {
    result: GameResult;
    mistakesUsed: number;
    winkUsed: boolean;
    durationBucket?: "under-1m" | "1-3m" | "3-5m" | "over-5m";
  };
}

// How long the fully-painted board stays visible after the terminal
// submit before the Result screen takes over. Tuned in the audit top-10
// recommendation — 550–700 ms felt like the sweet spot between "this
// lingered" and "why am I still on the game".
const RESULT_HOLD_MS = 600;

export interface StoreState {
  screen: AppScreen;
  stats: Stats;
  progress: StandardProgress;
  todayDailyRecord: DailyRecord | null;
  poolSize: number;
  active: ActiveGame | null;
  puzzle: Puzzle | null;
  summary: ResultSummary | null;
  rewardReceipt: RewardReceipt | null;
  persistenceIssue: PersistenceIssue;
  contentIssue: ContentIssue;
  flash: FlashKind;
  streakDelta: number;
  newBest: boolean;
  onboarded: boolean;
  howToPlayOpen: boolean;
  duel: {
    puzzleId: string;
    challengerMistakes: number;
    challengerTimeSec: number;
    challenge: DuelChallengeMetadata;
  } | null;

  startStandard: () => void;
  startEasy: () => void;
  startMedium: () => void;
  startMastery: () => void;
  startHard: () => void;
  startDaily: () => void;
  startZen: () => void;
  startCustomPuzzle: (puzzle: Puzzle) => void;
  startDuel: (
    puzzleId: string,
    challengerMistakes: number,
    challengerTimeSec: number,
    challenge?: DuelChallengeMetadata,
  ) => void;
  collectStamp: (stampId: string) => boolean;
  updateProfileCosmetic: (field: "sealId" | "nibId" | "titleId", value: string) => boolean;
  importLegacyPassport: (details: LegacyPassportDetails) => Promise<boolean>;

  toggleSelection: (value: string) => void;
  clearSelection: () => void;
  reshuffleActive: () => void;
  submit: () => void;
  resumeActive: () => void;
  goToMenu: () => void;
  showStats: () => void;
  startNextSame: () => void;
  retryCurrent: () => void;
  openUnsavedResult: () => void;
  clearFlash: () => void;
  completeOnboarding: () => void;
  openHowToPlay: () => void;
  closeHowToPlay: () => void;
  winkTab: (groupId: string) => void;
  /** Lifecycle seam: flushes only a live monotonic foreground interval. */
  pauseActiveTiming: () => void;
  /** Starts a new non-persisted monotonic interval after visibility/focus. */
  resumeActiveTiming: () => void;
  /** Clears yesterday's in-memory Daily completion when an open tab rolls over. */
  refreshDaily: () => void;
}

export interface StoreDeps {
  pool: readonly Puzzle[];
  easyPool: readonly Puzzle[];
  mediumPool: readonly Puzzle[];
  hardPool: readonly Puzzle[];
  /** Current-language pools (read fresh each call, so language switching
   *  takes effect on the next action without recreating the store). */
  getPool?: () => readonly Puzzle[];
  getEasyPool?: () => readonly Puzzle[];
  getMediumPool?: () => readonly Puzzle[];
  getHardPool?: () => readonly Puzzle[];
  getPuzzleById: (id: string) => Puzzle | undefined;
  getPuzzleByIndex: (i: number) => Puzzle | undefined;
  getEasyByIndex: (i: number) => Puzzle | undefined;
  getMediumByIndex: (i: number) => Puzzle | undefined;
  getHardByIndex: (i: number) => Puzzle | undefined;
  /**
   * Standard-mode cursor readers. Use the difficulty-ramped order so the
   * player walks easy→hard inside each tier. Daily mode still uses the
   * id-sorted pools via `getPool`/`getEasyPool`/etc. so the daily puzzle
   * remains deterministic across versions. Optional because test fixtures
   * rarely care about ramp — they fall back to the id-sorted getters.
   */
  getEasyRampedByIndex?: (i: number) => Puzzle | undefined;
  getMediumRampedByIndex?: (i: number) => Puzzle | undefined;
  getHardRampedByIndex?: (i: number) => Puzzle | undefined;
  /** Immutable date + language schedule lookup. No pool or unlock fallback. */
  getDailyEntry?: DailyEntryLookup;
  getStarterManifest?: (language: PuzzleLanguage) => StarterManifest | undefined;
  getEditorialRecord?: (
    language: PuzzleLanguage,
    puzzleId: string,
  ) => EditorialRecord | undefined;
  getPlayerSeed?: () => string | undefined;
  /**
   * Schedule a deferred action. The store uses this to hold the final
   * painted board visible for ~600 ms after a terminal submit before
   * flipping to the Result screen, so the win/loss climax lands on the
   * grid the player was looking at. Defaults to `setTimeout` in prod;
   * tests pass a fake scheduler that records calls.
   */
  scheduleTransition?: (cb: () => void, ms: number) => void;
  now: () => number;
  /** Runtime-only monotonic source. Its values are never persisted. */
  monotonicNow?: () => number;
  todayLocal: () => string;
  initialStats: Stats;
  initialProgress: StandardProgress;
  initialTodayDailyRecord: DailyRecord | null;
  initialOnboarded: boolean;
  initialActive?: ActiveGame | null;
  initialPuzzle?: Puzzle | null;
  initialScreen?: AppScreen;
  initialSummary?: ResultSummary | null;
  initialRewardReceipt?: RewardReceipt | null;
  initialPersistenceIssue?: PersistenceIssue;
  initialContentIssue?: ContentIssue;
  createAttemptId?: () => string;
  commitReward?: (input: CommitSolveRewardInput) => RewardReceipt;
  commitCollectible?: (stampId: string) => boolean;
  commitProfileCosmetic?: (field: "sealId" | "nibId" | "titleId", value: string) => boolean;
  commitLegacyPassport?: (details: LegacyPassportDetails) => Promise<boolean>;
}

let fallbackAttemptSequence = 0;

function createAttemptId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  fallbackAttemptSequence += 1;
  return `attempt-${Date.now().toString(36)}-${fallbackAttemptSequence.toString(36)}`;
}

export const defaultDeps: StoreDeps = {
  // The application injects selected-language runtime content. Keeping the
  // standalone store defaults empty prevents unit-test imports (and any
  // accidental fallback path) from statically bundling the EN authoring pool.
  pool: [],
  easyPool: [],
  mediumPool: [],
  hardPool: [],
  getPuzzleById: () => undefined,
  getPuzzleByIndex: () => undefined,
  getEasyByIndex: () => undefined,
  getMediumByIndex: () => undefined,
  getHardByIndex: () => undefined,
  getEasyRampedByIndex: () => undefined,
  getMediumRampedByIndex: () => undefined,
  getHardRampedByIndex: () => undefined,
  getStarterManifest,
  getEditorialRecord,
  getPlayerSeed: getOrCreatePlayerSeed,
  scheduleTransition: (cb, ms) => {
    if (typeof window === "undefined") {
      cb();
      return;
    }
    window.setTimeout(cb, ms);
  },
  now: () => Date.now(),
  monotonicNow: () =>
    typeof performance !== "undefined" && typeof performance.now === "function"
      ? performance.now()
      : 0,
  todayLocal,
  initialStats: INITIAL_STATS,
  initialProgress: { cursor: 0, easyCursor: 0, mediumCursor: 0, hardCursor: 0 },
  initialTodayDailyRecord: null,
  initialOnboarded: true,
  initialActive: null,
  initialPuzzle: null,
  initialScreen: "menu",
  initialSummary: null,
  initialRewardReceipt: null,
  initialPersistenceIssue: null,
  createAttemptId,
  commitReward: commitSolveReward,
};

function resolveCursor(
  progress: StandardProgress,
  difficulty: "easy" | "medium" | "hard",
): number {
  if (difficulty === "easy") return progress.easyCursor ?? progress.cursor ?? 0;
  if (difficulty === "medium") return progress.mediumCursor ?? 0;
  return progress.hardCursor ?? 0;
}

function recordNewSelection(
  progress: StandardProgress,
  puzzleRef: PuzzleRef,
  puzzle?: Puzzle,
  editorial?: EditorialRecord,
): StandardProgress {
  const leadingTopic = editorial?.topicTags[0];
  const recentItems = puzzle?.groups.flatMap((group) => group.items) ?? [];
  return {
    ...progress,
    selectionSequence: (progress.selectionSequence ?? 0) + 1,
    seenLineageIds: [...new Set([...(progress.seenLineageIds ?? []), puzzleRef.lineageId])],
    recentTopicTags: leadingTopic
      ? [...(progress.recentTopicTags ?? []), leadingTopic].slice(-2)
      : progress.recentTopicTags,
    recentItemValues:
      recentItems.length > 0
        ? [...(progress.recentItemValues ?? []), ...recentItems].slice(-48)
        : progress.recentItemValues,
  };
}

function selectCatalogPractice(
  deps: StoreDeps,
  progress: StandardProgress,
  language: PuzzleLanguage,
  tier: "easy" | "medium" | "hard",
  pool: readonly Puzzle[],
): PracticeCandidate | undefined {
  if (!deps.getEditorialRecord) return undefined;
  const candidates = pool.flatMap((puzzle): PracticeCandidate[] => {
    const editorial = deps.getEditorialRecord?.(language, puzzle.id);
    return editorial ? [{ puzzle, puzzleRef: editorial.puzzleRef, editorial }] : [];
  });
  if (candidates.length === 0) return undefined;
  return selectPracticePuzzle({
    language,
    tier,
    followStarterPath: false,
    starters: [],
    completedStarterEntryIds: progress.completedStarterEntryIds ?? [],
    seenLineageIds: progress.seenLineageIds ?? [],
    recentTopicTags: progress.recentTopicTags ?? [],
    recentItemValues: progress.recentItemValues ?? [],
    selectionSequence: progress.selectionSequence ?? 0,
    playerSeed: deps.getPlayerSeed?.() ?? "local-player",
    catalogVersion: candidates[0].puzzleRef.contentVersion,
    candidates,
  }).candidate;
}

export const selectDailyPlayedDate = (s: StoreState): string | null =>
  s.todayDailyRecord?.date ?? null;

function initialActive(
  puzzle: Puzzle,
  mode: GameMode,
  seedExtra: string,
  countsToStats: boolean,
  now: number,
  startedLocalDate: string,
  context: AttemptContext,
  attemptId: string,
  puzzleRef?: PuzzleRef,
  daily?: DailyAttemptRef,
  firstAttempt = true,
): ActiveGame {
  const lang = getLangSync();
  const acquisition = getResearchAcquisition();
  const qualified = recordQualifiedDay(startedLocalDate, acquisition);
  if (qualified.isReturnDay) {
    trackEvent({
      name: "return_observed",
      props: {
        surface: "game",
        context: "game",
        source_bucket: acquisition === "invited" ? "campaign" : "direct",
        lang,
      },
    });
  }
  trackEvent({
    name: "attempt_started",
    props: {
      surface: "game",
      context: "game",
      mode,
      tier: puzzle.difficulty,
      difficulty: puzzle.difficulty,
      first_attempt: firstAttempt ? "yes" : "no",
      lang,
    },
  });
  const seed = seedFromString(puzzle.id + "|" + seedExtra);
  const shuffledItems = shuffleFlatItems(puzzle, seed);
  return {
    attemptId,
    context,
    revision: 0,
    rules: {
      version: 1,
      maxIncorrectGuesses: 4,
      tabsEnabled: puzzle.difficulty === "medium",
      maxWinks: puzzle.difficulty === "medium" ? 1 : 0,
      timerPresentation: mode === "zen" ? "hidden" : "optional",
    },
    startedLocalDate,
    puzzleRef: puzzleRef ?? {
      language: getLangSync(),
      puzzleId: puzzle.id,
      lineageId: puzzle.id,
      contentVersion: context === "custom" ? "custom-v1" : "catalog-legacy-v1",
    },
    daily,
    puzzleId: puzzle.id,
    mode,
    order: shuffledItems.map((item) => item.value),
    selection: [],
    itemOrderIds: shuffledItems.map((item) => item.id),
    selectionItemIds: [],
    solvedGroupIds: [],
    mistakesUsed: 0,
    elapsedActiveMs: 0,
    startedAt: now,
    countsToStats,
    incorrectGuessSignatures: [],
    winkedGroupId: null,
  };
}

function finalizeIfEnded(
  active: ActiveGame,
  puzzle: Puzzle,
  now: number,
): { active: ActiveGame; ended: boolean } {
  if (isWin(active, puzzle)) {
    return { active: { ...active, result: "win", endedAt: now }, ended: true };
  }
  if (isLoss(active)) {
    return { active: { ...active, result: "loss", endedAt: now }, ended: true };
  }
  return { active, ended: false };
}

export function createStore(deps: StoreDeps = defaultDeps) {
  let foregroundInterval: { attemptId: string; startedMonotonicMs: number } | null = null;

  const resetForegroundInterval = (active: ActiveGame | null): void => {
    const attemptId = active?.attemptId;
    if (!attemptId) {
      foregroundInterval = null;
      return;
    }
    foregroundInterval = {
      attemptId,
      startedMonotonicMs: deps.monotonicNow?.() ?? 0,
    };
  };

  const captureForegroundElapsed = (active: ActiveGame): ActiveGame => {
    const interval = foregroundInterval;
    if (!interval || !active.attemptId || interval.attemptId !== active.attemptId)
      return active;
    const now = deps.monotonicNow?.() ?? interval.startedMonotonicMs;
    const delta = foregroundDelta(interval.startedMonotonicMs, now);
    foregroundInterval = { ...interval, startedMonotonicMs: now };
    if (delta <= 0) return active;
    return { ...active, elapsedActiveMs: addForegroundDelta(active.elapsedActiveMs, delta) };
  };

  return create<StoreState>((set, get) => ({
    screen: deps.initialScreen ?? "menu",
    stats: deps.initialStats,
    progress: deps.initialProgress,
    todayDailyRecord: deps.initialTodayDailyRecord,
    poolSize: deps.pool.length,
    active: deps.initialActive ?? null,
    puzzle: deps.initialPuzzle ?? null,
    summary: deps.initialSummary ?? null,
    rewardReceipt: deps.initialRewardReceipt ?? null,
    persistenceIssue: deps.initialPersistenceIssue ?? null,
    contentIssue: deps.initialContentIssue ?? null,
    flash: null,
    streakDelta: 0,
    newBest: false,
    onboarded: deps.initialOnboarded,
    howToPlayOpen: false,
    duel: null,

    startStandard: () => {
      const state = get();
      const language = getLangSync();
      const manifest = (deps.getStarterManifest ?? getStarterManifest)(language);
      const completed = new Set(state.progress.completedStarterEntryIds ?? []);
      const entry = manifest?.entries
        .slice()
        .sort((a, b) => a.order - b.order)
        .find((candidate) => !completed.has(candidate.entryId));
      if (!entry) {
        state.startEasy();
        return;
      }
      const puzzle = deps.getPuzzleById(entry.puzzleRef.puzzleId);
      if (!puzzle) return;
      const now = deps.now();
      const active = initialActive(
        puzzle,
        "standard",
        `${entry.entryId}:${state.progress.selectionSequence ?? 0}`,
        true,
        now,
        deps.todayLocal(),
        "onboarding",
        (deps.createAttemptId ?? createAttemptId)(),
        entry.puzzleRef,
      );
      active.starterEntryId = entry.entryId;
      set({
        screen: "game",
        puzzle,
        active,
        progress: recordNewSelection(
          state.progress,
          entry.puzzleRef,
          puzzle,
          deps.getEditorialRecord?.(language, puzzle.id),
        ),
        summary: null,
        rewardReceipt: null,
        flash: null,
        streakDelta: 0,
        newBest: false,
        duel: null,
      });
      resetForegroundInterval(active);
    },

    startEasy: () => {
      const progress = get().progress;
      const stats = get().stats;
      const language = getLangSync();
      const cursor = resolveCursor(progress, "easy");
      const pool = deps.getEasyPool ? deps.getEasyPool() : deps.easyPool;
      const targetPool = pool.length > 0 ? pool : deps.getPool ? deps.getPool() : deps.pool;
      const catalogSelection = selectCatalogPractice(
        deps,
        progress,
        language,
        "easy",
        targetPool,
      );
      const progressionPuzzle = getNextProgressionPuzzle({
        pool: targetPool,
        solvedIds: stats.solvedPuzzleIds,
        cursor,
        difficulty: "easy",
      });
      const rampedGetter = deps.getEasyRampedByIndex ?? deps.getEasyByIndex;
      const puzzle =
        catalogSelection?.puzzle ??
        progressionPuzzle ??
        rampedGetter(cursor) ??
        deps.getPuzzleByIndex(cursor);
      if (!puzzle) return;
      const now = deps.now();
      const active = initialActive(
        puzzle,
        "standard",
        String(now),
        true,
        now,
        deps.todayLocal(),
        "practice",
        (deps.createAttemptId ?? createAttemptId)(),
        catalogSelection?.puzzleRef,
      );
      set({
        screen: "game",
        puzzle,
        active,
        progress: recordNewSelection(
          progress,
          active.puzzleRef!,
          puzzle,
          catalogSelection?.editorial,
        ),
        summary: null,
        rewardReceipt: null,
        flash: null,
        streakDelta: 0,
        newBest: false,
        duel: null,
      });
      resetForegroundInterval(active);
      trackEvent({
        name: "mode_start",
        props: {
          surface: "menu",
          mode: "standard",
          difficulty: "easy",
          lang: getLangSync(),
        },
      });
    },

    startMedium: () => {
      const progress = get().progress;
      const stats = get().stats;
      const language = getLangSync();
      const cursor = resolveCursor(progress, "medium");
      const pool = deps.getMediumPool ? deps.getMediumPool() : deps.mediumPool;
      const catalogSelection = selectCatalogPractice(deps, progress, language, "medium", pool);
      const progressionPuzzle = getNextProgressionPuzzle({
        pool,
        solvedIds: stats.solvedPuzzleIds,
        cursor,
        difficulty: "medium",
      });
      const rampedGetter = deps.getMediumRampedByIndex ?? deps.getMediumByIndex;
      const puzzle = catalogSelection?.puzzle ?? progressionPuzzle ?? rampedGetter(cursor);
      if (!puzzle) return;
      const now = deps.now();
      const active = initialActive(
        puzzle,
        "standard",
        String(now),
        true,
        now,
        deps.todayLocal(),
        "practice",
        (deps.createAttemptId ?? createAttemptId)(),
        catalogSelection?.puzzleRef,
      );
      set({
        screen: "game",
        puzzle,
        active,
        progress: recordNewSelection(
          progress,
          active.puzzleRef!,
          puzzle,
          catalogSelection?.editorial,
        ),
        summary: null,
        rewardReceipt: null,
        flash: null,
        streakDelta: 0,
        newBest: false,
        duel: null,
      });
      resetForegroundInterval(active);
      trackEvent({
        name: "mode_start",
        props: {
          surface: "menu",
          mode: "standard",
          difficulty: "medium",
          lang: getLangSync(),
        },
      });
    },

    startMastery: () => {
      const progress = get().progress;
      const stats = get().stats;
      const cursor = resolveCursor(progress, "medium");
      const pool = deps.getMediumPool ? deps.getMediumPool() : deps.mediumPool;
      const puzzle = getNextProgressionPuzzle({
        pool,
        solvedIds: stats.solvedPuzzleIds,
        cursor,
        difficulty: "medium",
      });
      if (!puzzle) return;
      const now = deps.now();
      const active = initialActive(
        puzzle,
        "standard",
        String(now),
        false,
        now,
        deps.todayLocal(),
        "mastery",
        (deps.createAttemptId ?? createAttemptId)(),
      );
      active.rules = { ...active.rules!, maxIncorrectGuesses: 2 };
      set({
        screen: "game",
        puzzle,
        active,
        summary: null,
        rewardReceipt: null,
        flash: null,
        streakDelta: 0,
        newBest: false,
        duel: null,
      });
      resetForegroundInterval(active);
      trackEvent({
        name: "mode_start",
        props: {
          surface: "menu",
          mode: "standard",
          difficulty: "medium",
          lang: getLangSync(),
        },
      });
    },

    startHard: () => {
      const progress = get().progress;
      const stats = get().stats;
      const language = getLangSync();
      const cursor = resolveCursor(progress, "hard");
      const pool = deps.getHardPool ? deps.getHardPool() : deps.hardPool;
      const catalogSelection = selectCatalogPractice(deps, progress, language, "hard", pool);
      const progressionPuzzle = getNextProgressionPuzzle({
        pool,
        solvedIds: stats.solvedPuzzleIds,
        cursor,
        difficulty: "hard",
      });
      const rampedGetter = deps.getHardRampedByIndex ?? deps.getHardByIndex;
      const puzzle = catalogSelection?.puzzle ?? progressionPuzzle ?? rampedGetter(cursor);
      if (!puzzle) return;
      const now = deps.now();
      const active = initialActive(
        puzzle,
        "standard",
        String(now),
        true,
        now,
        deps.todayLocal(),
        "practice",
        (deps.createAttemptId ?? createAttemptId)(),
        catalogSelection?.puzzleRef,
      );
      set({
        screen: "game",
        puzzle,
        active,
        progress: recordNewSelection(
          progress,
          active.puzzleRef!,
          puzzle,
          catalogSelection?.editorial,
        ),
        summary: null,
        rewardReceipt: null,
        flash: null,
        streakDelta: 0,
        newBest: false,
        duel: null,
      });
      resetForegroundInterval(active);
      trackEvent({
        name: "mode_start",
        props: {
          surface: "menu",
          mode: "standard",
          difficulty: "hard",
          lang: getLangSync(),
        },
      });
    },

    startDaily: () => {
      const date = deps.todayLocal();
      const language = getLangSync();
      const previousRecord = get().todayDailyRecord;
      const pinnedReplay =
        previousRecord?.date === date &&
        previousRecord.language === language &&
        previousRecord.entryId &&
        previousRecord.scheduleVersion &&
        previousRecord.puzzleRef &&
        previousRecord.puzzleSnapshot
          ? previousRecord
          : null;
      const entry = pinnedReplay
        ? {
            ...pinnedReplay.puzzleRef!,
            entryId: pinnedReplay.entryId!,
            date,
            scheduleVersion: pinnedReplay.scheduleVersion!,
          }
        : resolveDailyEntry(language, date, deps.getDailyEntry);
      if (!entry) return;
      const puzzle = pinnedReplay?.puzzleSnapshot ?? deps.getPuzzleById(entry.puzzleId);
      if (!puzzle) return;
      const alreadyPlayed = previousRecord?.date === date;
      const now = deps.now();
      const active = initialActive(
        puzzle,
        "daily",
        date,
        !alreadyPlayed,
        now,
        date,
        "daily",
        (deps.createAttemptId ?? createAttemptId)(),
        {
          language: entry.language,
          puzzleId: entry.puzzleId,
          lineageId: entry.lineageId,
          contentVersion: entry.contentVersion,
        },
        {
          date: entry.date,
          scheduleVersion: entry.scheduleVersion,
          entryId: entry.entryId,
        },
      );
      set({
        screen: "game",
        puzzle,
        active,
        summary: null,
        rewardReceipt: null,
        flash: null,
        streakDelta: 0,
        newBest: false,
        duel: null,
      });
      resetForegroundInterval(active);
      trackEvent({
        name: "mode_start",
        props: {
          surface: "menu",
          mode: "daily",
          difficulty: puzzle.difficulty,
          lang: getLangSync(),
        },
      });
    },

    startZen: () => {
      const progress = get().progress;
      const pool = deps.getPool ? deps.getPool() : deps.pool;
      if (pool.length === 0) return;
      const cursor = (progress.zenCursor ?? 0) % pool.length;
      const puzzle = pool[cursor] ?? pool[0];
      if (!puzzle) return;
      const now = deps.now();
      const active = initialActive(
        puzzle,
        "zen",
        String(now),
        false,
        now,
        deps.todayLocal(),
        "zen",
        (deps.createAttemptId ?? createAttemptId)(),
      );
      set({
        screen: "game",
        puzzle,
        active,
        summary: null,
        rewardReceipt: null,
        flash: null,
        streakDelta: 0,
        newBest: false,
        duel: null,
      });
      resetForegroundInterval(active);
      trackEvent({
        name: "mode_start",
        props: {
          surface: "menu",
          mode: "zen",
          difficulty: puzzle.difficulty,
          lang: getLangSync(),
        },
      });
    },

    startCustomPuzzle: (customPuzzle: Puzzle) => {
      if (!customPuzzle) return;
      const now = deps.now();
      const active = initialActive(
        customPuzzle,
        "standard",
        String(now),
        false,
        now,
        deps.todayLocal(),
        "custom",
        (deps.createAttemptId ?? createAttemptId)(),
      );
      set({
        screen: "game",
        puzzle: customPuzzle,
        active,
        summary: null,
        rewardReceipt: null,
        flash: null,
        streakDelta: 0,
        newBest: false,
        duel: null,
      });
      trackEvent({
        name: "mode_start",
        props: {
          surface: "app",
          mode: "standard",
          difficulty: customPuzzle.difficulty,
          lang: getLangSync(),
        },
      });
    },

    startDuel: (
      puzzleId: string,
      challengerMistakes: number,
      challengerTimeSec: number,
      challenge = { source: "legacy" },
    ) => {
      let puzzle = deps.getPuzzleById(puzzleId);
      if (!puzzle && deps.getPool) {
        const fullPool = deps.getPool();
        puzzle = fullPool.find((p) => p.id === puzzleId);
      }
      if (!puzzle) return;
      const language = getLangSync();
      const puzzleRef = (deps.getEditorialRecord ?? getEditorialRecord)(
        language,
        puzzle.id,
      )?.puzzleRef;
      const now = deps.now();
      const active = initialActive(
        puzzle,
        "standard",
        String(now),
        false,
        now,
        deps.todayLocal(),
        "duel",
        (deps.createAttemptId ?? createAttemptId)(),
        puzzleRef,
      );
      set({
        screen: "game",
        puzzle,
        active,
        summary: null,
        rewardReceipt: null,
        flash: null,
        streakDelta: 0,
        newBest: false,
        duel: {
          puzzleId,
          challengerMistakes,
          challengerTimeSec,
          challenge,
        },
      });
      resetForegroundInterval(active);
      trackEvent({
        name: "mode_start",
        props: {
          surface: "menu",
          mode: "standard",
          difficulty: puzzle.difficulty,
          lang: getLangSync(),
        },
      });
    },

    collectStamp: (stampId: string) => deps.commitCollectible?.(stampId) ?? false,
    updateProfileCosmetic: (field, value) =>
      deps.commitProfileCosmetic?.(field, value) ?? false,
    importLegacyPassport: (details) =>
      deps.commitLegacyPassport?.(details) ?? Promise.resolve(false),

    toggleSelection: (value: string) => {
      const { active, puzzle } = get();
      if (!active || !puzzle) return;
      if (active.result) return;
      if (active.solvedGroupIds.length > 0) {
        const solvedItems = new Set<string>();
        for (const g of puzzle.groups) {
          if (active.solvedGroupIds.includes(g.id)) {
            for (const it of g.items) solvedItems.add(it);
          }
        }
        if (solvedItems.has(value)) return;
      }
      const already = active.selection.includes(value);
      const itemId = itemIdForValue(puzzle, value);
      if (!itemId) return;
      if (already) {
        set({
          active: {
            ...active,
            revision: (active.revision ?? 0) + 1,
            selection: active.selection.filter((v) => v !== value),
            selectionItemIds: (active.selectionItemIds ?? []).filter((id) => id !== itemId),
          },
        });
        return;
      }
      if (active.selection.length >= SELECTION_SIZE) return;
      set({
        active: {
          ...active,
          revision: (active.revision ?? 0) + 1,
          selection: [...active.selection, value],
          selectionItemIds: [...(active.selectionItemIds ?? []), itemId],
        },
      });
    },

    clearSelection: () => {
      const { active } = get();
      if (!active || active.result) return;
      set({
        active: {
          ...active,
          revision: (active.revision ?? 0) + 1,
          selection: [],
          selectionItemIds: [],
        },
      });
    },

    reshuffleActive: () => {
      const { active, puzzle } = get();
      if (!active || !puzzle || active.result) return;
      const next = active.order.map((value, index) => ({
        value,
        id: active.itemOrderIds?.[index] ?? itemIdForValue(puzzle, value) ?? "",
      }));
      // Fisher–Yates using Math.random. This is a cosmetic reorder, but the
      // display value and its stable identity always move as one pair.
      for (let i = next.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [next[i], next[j]] = [next[j], next[i]];
      }
      set({
        active: {
          ...active,
          revision: (active.revision ?? 0) + 1,
          order: next.map((item) => item.value),
          itemOrderIds: next.map((item) => item.id),
        },
      });
    },

    submit: () => {
      const state = get();
      const { active: currentActive, puzzle, stats, progress } = state;
      const active = currentActive ? captureForegroundElapsed(currentActive) : null;
      if (!active || !puzzle || active.result) return;
      if (!canSubmit(active.selection)) return;
      const matched = findMatchingGroup(active.selection, puzzle);
      const signature = guessSignature(
        active.selectionItemIds?.length === SELECTION_SIZE
          ? active.selectionItemIds
          : active.selection,
      );
      if (!matched && signature && active.incorrectGuessSignatures?.includes(signature)) {
        // Keep a captured live timing delta in memory even though this guess
        // intentionally does not advance game revision or consume a mistake.
        set(active === currentActive ? { flash: "repeat" } : { active, flash: "repeat" });
        trackEvent({
          name: "round_submit",
          props: {
            surface: "game",
            mode: active.mode,
            difficulty: puzzle.difficulty,
            outcome: "repeat",
            lang: getLangSync(),
          },
        });
        return;
      }
      let next: ActiveGame;
      let flash: FlashKind;
      if (matched) {
        const itemIds = flattenPuzzle(puzzle)
          .filter((item) => item.groupId === matched.id)
          .map((item) => item.id);
        next = applyCorrectGroup(active, matched.id, matched.items, itemIds);
        flash = "correct";
        if (next.solvedGroupIds.length === 1) {
          trackEvent({
            name: "first_group_solved",
            props: {
              surface: "game",
              context: "game",
              mode: active.mode,
              tier: puzzle.difficulty,
              difficulty: puzzle.difficulty,
              duration_bucket: bucketDuration(active.elapsedActiveMs ?? 0),
              first_attempt: active.parentAttemptId ? "no" : "yes",
              lang: getLangSync(),
            },
          });
        }
      } else {
        next = applyIncorrectGuess(active, signature ?? undefined);
        flash = isOneAway(active.selection, puzzle) ? "one-away" : "incorrect";
      }
      trackEvent({
        name: "round_submit",
        props: {
          surface: "game",
          mode: active.mode,
          difficulty: puzzle.difficulty,
          outcome:
            flash === "correct" ? "correct" : flash === "one-away" ? "one_away" : "incorrect",
          lang: getLangSync(),
        },
      });
      const finalized = finalizeIfEnded(next, puzzle, deps.now());
      if (!finalized.ended || !finalized.active.result) {
        set({ active: finalized.active, flash });
        return;
      }

      const result: GameResult = finalized.active.result;
      const endedAt = finalized.active.endedAt ?? deps.now();
      const summary = calculateResultSummary(finalized.active, endedAt);
      const rewardReceipt = deps.commitReward
        ? deps.commitReward({
            language: getLangSync(),
            lineageId: puzzle.id,
            context: active.context ?? (active.mode === "daily" ? "daily" : "practice"),
            result,
            officialLineage: active.context !== "custom" && active.context !== "duel",
          })
        : null;
      recordQualifiedDay(
        active.startedLocalDate ?? deps.todayLocal(),
        getResearchAcquisition(),
        result === "win" || result === "loss",
      );
      trackEvent({
        name: "attempt_completed",
        props: {
          surface: "game",
          context: "game",
          mode: active.mode,
          tier: puzzle.difficulty,
          difficulty: puzzle.difficulty,
          duration_bucket: bucketDuration(summary.durationMs),
          first_attempt: active.parentAttemptId ? "no" : "yes",
          outcome: result,
          lang: getLangSync(),
        },
      });
      if (rewardReceipt)
        trackEvent({
          name: "reward_presented",
          props: {
            surface: "result",
            context: "result",
            mode: active.mode,
            tier: puzzle.difficulty,
            difficulty: puzzle.difficulty,
            lang: getLangSync(),
          },
        });

      let nextStats = stats;
      let nextProgress = progress;
      let nextTodayDailyRecord = state.todayDailyRecord;
      let streakDelta = 0;
      let newBest = false;

      if (active.starterEntryId) {
        nextProgress = {
          ...nextProgress,
          completedStarterEntryIds: [
            ...new Set([
              ...(nextProgress.completedStarterEntryIds ?? []),
              active.starterEntryId,
            ]),
          ],
        };
      }

      if (active.countsToStats) {
        nextStats = applyGameResult(stats, result, {
          puzzleId: puzzle.id,
          difficulty: puzzle.difficulty,
          mistakesUsed: summary.mistakesUsed,
          winkUsed: active.winkedGroupId !== null,
          durationMs: summary.durationMs,
        });
        if (result === "win") streakDelta = nextStats.currentStreak - stats.currentStreak;
        newBest = result === "win" && nextStats.bestStreak > stats.bestStreak;

        if (active.mode === "standard" && result === "win") {
          if (puzzle.difficulty === "easy") {
            const nextEasy = (progress.easyCursor ?? progress.cursor ?? 0) + 1;
            nextProgress = {
              ...nextProgress,
              easyCursor: nextEasy,
              cursor: nextEasy, // keep legacy field in sync
            };
          } else if (puzzle.difficulty === "medium") {
            const nextMedium = (progress.mediumCursor ?? 0) + 1;
            nextProgress = { ...nextProgress, mediumCursor: nextMedium };
          } else {
            const nextHard = (progress.hardCursor ?? 0) + 1;
            nextProgress = { ...nextProgress, hardCursor: nextHard };
          }
        }
        if (active.mode === "daily") {
          const date = active.startedLocalDate ?? deps.todayLocal();
          nextTodayDailyRecord = {
            date,
            puzzleId: puzzle.id,
            result,
            mistakesUsed: summary.mistakesUsed,
            durationMs: summary.durationMs,
            language: active.puzzleRef?.language ?? getLangSync(),
            entryId: active.daily?.entryId,
            scheduleVersion: active.daily?.scheduleVersion,
            puzzleRef: active.puzzleRef,
            puzzleSnapshot: puzzle,
            attemptId: active.attemptId,
          };
        }
      } else if (active.mode === "zen") {
        if (result === "win") {
          const pool = deps.getPool ? deps.getPool() : deps.pool;
          const nextZen = ((progress.zenCursor ?? 0) + 1) % Math.max(1, pool.length);
          nextProgress = { ...progress, zenCursor: nextZen };
          const curZenStreak = (stats.zenStreak ?? 0) + 1;
          const bestZen = Math.max(stats.bestZenStreak ?? 0, curZenStreak);
          nextStats = { ...stats, zenStreak: curZenStreak, bestZenStreak: bestZen };
          streakDelta = 1;
          newBest = curZenStreak > (stats.bestZenStreak ?? 0);
        } else {
          // On loss, current Zen streak resets to 0 while best streak is preserved
          nextStats = { ...stats, zenStreak: 0 };
          streakDelta = -(stats.zenStreak ?? 0);
          newBest = false;
        }
      }

      // Two-phase terminal write: keep the board visible for ~600 ms so the
      // win/loss climax lands on the fully-painted grid, then flip to the
      // result screen. Stats + progress + summary commit immediately so
      // persistence observers fire on time; only `screen` is deferred.
      set({
        active: finalized.active,
        stats: nextStats,
        progress: nextProgress,
        todayDailyRecord: nextTodayDailyRecord,
        summary,
        rewardReceipt,
        flash,
        streakDelta,
        newBest,
      });
      foregroundInterval = null;
      trackEvent({
        name: "round_finish",
        props: {
          surface: "game",
          mode: active.mode,
          difficulty: puzzle.difficulty,
          outcome: result,
          has_support_flag: isSupporter() ? "yes" : "no",
          lang: getLangSync(),
        },
      });
      const schedule = deps.scheduleTransition ?? ((cb) => cb());
      const currentScreen = get().screen;
      schedule(() => {
        // Guard against a race: if the player already navigated elsewhere
        // (quit-to-menu, etc.) before the delay fires, don't overwrite
        // their intent.
        const now = get();
        if (now.screen !== currentScreen) return;
        if (!now.active || !now.active.result) return;
        set({ screen: "result" });
      }, RESULT_HOLD_MS);
    },

    resumeActive: () => {
      const { active, puzzle } = get();
      if (!active || !puzzle || active.result) return;
      const acquisition = getResearchAcquisition();
      const qualified = recordQualifiedDay(deps.todayLocal(), acquisition);
      if (qualified.isReturnDay) {
        trackEvent({
          name: "return_observed",
          props: {
            surface: "game",
            context: "game",
            source_bucket: acquisition === "invited" ? "campaign" : "direct",
            lang: getLangSync(),
          },
        });
      }
      set({ screen: "game", flash: null });
      resetForegroundInterval(active);
    },

    goToMenu: () => {
      const leavingState = get();
      const leaving = leavingState.active;
      if (leaving && !leaving.result) {
        trackEvent({
          name: "attempt_abandoned",
          props: {
            surface: "game",
            context: "game",
            mode: leaving.mode,
            difficulty: leavingState.puzzle?.difficulty,
            tier: leavingState.puzzle?.difficulty,
            duration_bucket: bucketDuration(leaving.elapsedActiveMs ?? 0),
            first_attempt: leaving.parentAttemptId ? "no" : "yes",
            lang: getLangSync(),
          },
        });
      }
      foregroundInterval = null;
      set({
        screen: "menu",
        active: null,
        puzzle: null,
        summary: null,
        rewardReceipt: null,
        flash: null,
        streakDelta: 0,
        newBest: false,
        duel: null,
      });
    },

    showStats: () => {
      set({ screen: "stats", flash: null });
    },

    startNextSame: () => {
      const { active, puzzle } = get();
      if (!active) {
        get().goToMenu();
        return;
      }
      if (active.mode === "daily") {
        get().goToMenu();
        return;
      }
      trackEvent({
        name: "next_puzzle_started",
        props: {
          surface: "result",
          context: "result",
          mode: active.mode,
          difficulty: puzzle?.difficulty,
          tier: puzzle?.difficulty,
          outcome: active.result,
          lang: getLangSync(),
        },
      });
      if (active.mode === "zen") {
        get().startZen();
        return;
      }
      if (active.starterEntryId) {
        get().startStandard();
        return;
      }
      // Preserve difficulty across "next puzzle" in standard flow.
      if (puzzle?.difficulty === "hard") {
        get().startHard();
        return;
      }
      if (puzzle?.difficulty === "medium") {
        get().startMedium();
        return;
      }
      get().startEasy();
    },

    retryCurrent: () => {
      const state = get();
      const previous = state.active;
      const puzzle = state.puzzle;
      if (!previous?.result || !previous.attemptId || !puzzle) return;
      const now = deps.now();
      const active = initialActive(
        puzzle,
        previous.mode,
        `retry:${previous.attemptId}`,
        previous.mode === "daily" ? false : previous.countsToStats,
        now,
        deps.todayLocal(),
        previous.context ?? (previous.mode === "daily" ? "daily" : "practice"),
        (deps.createAttemptId ?? createAttemptId)(),
        previous.puzzleRef,
        previous.daily,
        false,
      );
      active.parentAttemptId = previous.attemptId;
      active.starterEntryId = previous.starterEntryId;
      set({
        screen: "game",
        active,
        summary: null,
        rewardReceipt: null,
        flash: null,
        streakDelta: 0,
        newBest: false,
      });
      resetForegroundInterval(active);
    },

    openUnsavedResult: () => {
      const { active, summary } = get();
      if (!active?.result || !summary) return;
      set({ screen: "result" });
    },

    clearFlash: () => set({ flash: null }),

    pauseActiveTiming: () => {
      const { active, screen } = get();
      if (!active || active.result || screen !== "game") {
        foregroundInterval = null;
        return;
      }
      const timed = captureForegroundElapsed(active);
      foregroundInterval = null;
      if (timed === active) return;
      // This is a durable lifecycle checkpoint, so it gets its own revision.
      set({ active: { ...timed, revision: (active.revision ?? 0) + 1 } });
    },

    resumeActiveTiming: () => {
      const { active, screen } = get();
      if (!active || active.result || screen !== "game") return;
      resetForegroundInterval(active);
    },

    refreshDaily: () => {
      const current = get().todayDailyRecord;
      if (current && current.date !== deps.todayLocal()) {
        set({ todayDailyRecord: null });
      }
    },

    completeOnboarding: () => set({ onboarded: true }),

    openHowToPlay: () => set({ howToPlayOpen: true }),

    closeHowToPlay: () => set({ howToPlayOpen: false }),

    winkTab: (groupId: string) => {
      const { active, puzzle } = get();
      if (!active || !puzzle || active.result) return;
      if (!canWinkGroup(puzzle, active.solvedGroupIds, active.winkedGroupId, groupId)) return;
      set({
        active: {
          ...active,
          revision: (active.revision ?? 0) + 1,
          winkedGroupId: groupId,
        },
      });
      trackEvent({
        name: "wink_used",
        props: {
          surface: "game",
          mode: active.mode,
          difficulty: puzzle.difficulty,
          lang: getLangSync(),
        },
      });
    },
  }));
}
