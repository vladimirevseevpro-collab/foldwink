import { create } from "zustand";
import type { ActiveGame, AppScreen, GameMode, GameResult } from "../types/game";
import type { Puzzle } from "../types/puzzle";
import type { Stats, StandardProgress, DailyRecord } from "../types/stats";
import { INITIAL_STATS } from "../types/stats";
import { SELECTION_SIZE } from "../types/game";
import {
  PUZZLE_POOL,
  EASY_POOL,
  MEDIUM_POOL,
  HARD_POOL,
  getPuzzleById,
  getPuzzleByIndex,
  getEasyByIndex,
  getMediumByIndex,
  getHardByIndex,
  getEasyRampedByIndex,
  getMediumRampedByIndex,
  getHardRampedByIndex,
} from "../../puzzles/loader";
import { getDailyPuzzleId } from "../../puzzles/daily";
import { getNextProgressionPuzzle } from "../../puzzles/progression";
import { shuffleItems, seedFromString } from "../engine/shuffle";
import { canSubmit, findMatchingGroup, isOneAway } from "../engine/submit";
import { applyCorrectGroup, applyIncorrectGuess, isLoss, isWin } from "../engine/progress";
import { calculateResultSummary, type ResultSummary } from "../engine/result";
import { canWinkGroup } from "../engine/foldwinkTabs";
import { applyGameResult } from "../../stats/stats";
import { todayLocal } from "../../utils/date";
import { mediumReadiness, hardReadiness } from "../engine/readiness";
import { getLangSync } from "../../i18n/useLanguage";
import { isSupporter } from "../../monetization/supporter";
import { trackEvent } from "../../analytics/eventLog";

type FlashKind = "correct" | "incorrect" | "one-away" | null;

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
  flash: FlashKind;
  streakDelta: number;
  newBest: boolean;
  onboarded: boolean;
  howToPlayOpen: boolean;
  duel: {
    puzzleId: string;
    challengerMistakes: number;
    challengerTimeSec: number;
  } | null;

  startStandard: () => void;
  startEasy: () => void;
  startMedium: () => void;
  startHard: () => void;
  startDaily: () => void;
  startZen: () => void;
  startCustomPuzzle: (puzzle: Puzzle) => void;
  startDuel: (puzzleId: string, challengerMistakes: number, challengerTimeSec: number) => void;

  toggleSelection: (value: string) => void;
  clearSelection: () => void;
  reshuffleActive: () => void;
  submit: () => void;
  goToMenu: () => void;
  showStats: () => void;
  startNextSame: () => void;
  clearFlash: () => void;
  completeOnboarding: () => void;
  openHowToPlay: () => void;
  closeHowToPlay: () => void;
  winkTab: (groupId: string) => void;
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
  /**
   * Schedule a deferred action. The store uses this to hold the final
   * painted board visible for ~600 ms after a terminal submit before
   * flipping to the Result screen, so the win/loss climax lands on the
   * grid the player was looking at. Defaults to `setTimeout` in prod;
   * tests pass a fake scheduler that records calls.
   */
  scheduleTransition?: (cb: () => void, ms: number) => void;
  now: () => number;
  todayLocal: () => string;
  initialStats: Stats;
  initialProgress: StandardProgress;
  initialTodayDailyRecord: DailyRecord | null;
  initialOnboarded: boolean;
  initialActive?: ActiveGame | null;
  initialPuzzle?: Puzzle | null;
  initialScreen?: AppScreen;
}

export const defaultDeps: StoreDeps = {
  pool: PUZZLE_POOL,
  easyPool: EASY_POOL,
  mediumPool: MEDIUM_POOL,
  hardPool: HARD_POOL,
  getPuzzleById,
  getPuzzleByIndex,
  getEasyByIndex,
  getMediumByIndex,
  getHardByIndex,
  getEasyRampedByIndex,
  getMediumRampedByIndex,
  getHardRampedByIndex,
  scheduleTransition: (cb, ms) => {
    if (typeof window === "undefined") {
      cb();
      return;
    }
    window.setTimeout(cb, ms);
  },
  now: () => Date.now(),
  todayLocal,
  initialStats: INITIAL_STATS,
  initialProgress: { cursor: 0, easyCursor: 0, mediumCursor: 0, hardCursor: 0 },
  initialTodayDailyRecord: null,
  initialOnboarded: true,
  initialActive: null,
  initialPuzzle: null,
  initialScreen: "menu",
};

function resolveCursor(
  progress: StandardProgress,
  difficulty: "easy" | "medium" | "hard",
): number {
  if (difficulty === "easy") return progress.easyCursor ?? progress.cursor ?? 0;
  if (difficulty === "medium") return progress.mediumCursor ?? 0;
  return progress.hardCursor ?? 0;
}

export const selectDailyPlayedDate = (s: StoreState): string | null =>
  s.todayDailyRecord?.date ?? null;

function initialActive(
  puzzle: Puzzle,
  mode: GameMode,
  seedExtra: string,
  countsToStats: boolean,
  now: number,
): ActiveGame {
  const seed = seedFromString(puzzle.id + "|" + seedExtra);
  return {
    puzzleId: puzzle.id,
    mode,
    order: shuffleItems(puzzle, seed),
    selection: [],
    solvedGroupIds: [],
    mistakesUsed: 0,
    startedAt: now,
    countsToStats,
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
  return create<StoreState>((set, get) => ({
    screen: deps.initialScreen ?? "menu",
    stats: deps.initialStats,
    progress: deps.initialProgress,
    todayDailyRecord: deps.initialTodayDailyRecord,
    poolSize: deps.pool.length,
    active: deps.initialActive ?? null,
    puzzle: deps.initialPuzzle ?? null,
    summary: null,
    flash: null,
    streakDelta: 0,
    newBest: false,
    onboarded: deps.initialOnboarded,
    howToPlayOpen: false,
    duel: null,

    startStandard: () => {
      get().startEasy();
    },

    startEasy: () => {
      const progress = get().progress;
      const stats = get().stats;
      const cursor = resolveCursor(progress, "easy");
      const pool = deps.getEasyPool ? deps.getEasyPool() : deps.easyPool;
      const targetPool = pool.length > 0 ? pool : deps.getPool ? deps.getPool() : deps.pool;
      const progressionPuzzle = getNextProgressionPuzzle({
        pool: targetPool,
        solvedIds: stats.solvedPuzzleIds,
        cursor,
        difficulty: "easy",
      });
      const rampedGetter = deps.getEasyRampedByIndex ?? deps.getEasyByIndex;
      const puzzle = progressionPuzzle ?? rampedGetter(cursor) ?? deps.getPuzzleByIndex(cursor);
      if (!puzzle) return;
      const active = initialActive(puzzle, "standard", String(deps.now()), true, deps.now());
      set({
        screen: "game",
        puzzle,
        active,
        summary: null,
        flash: null,
        streakDelta: 0,
        newBest: false,
        duel: null,
      });
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
      const cursor = resolveCursor(progress, "medium");
      const pool = deps.getMediumPool ? deps.getMediumPool() : deps.mediumPool;
      const progressionPuzzle = getNextProgressionPuzzle({
        pool,
        solvedIds: stats.solvedPuzzleIds,
        cursor,
        difficulty: "medium",
      });
      const rampedGetter = deps.getMediumRampedByIndex ?? deps.getMediumByIndex;
      const puzzle = progressionPuzzle ?? rampedGetter(cursor);
      if (!puzzle) return;
      const active = initialActive(puzzle, "standard", String(deps.now()), true, deps.now());
      set({
        screen: "game",
        puzzle,
        active,
        summary: null,
        flash: null,
        streakDelta: 0,
        newBest: false,
        duel: null,
      });
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
      const cursor = resolveCursor(progress, "hard");
      const pool = deps.getHardPool ? deps.getHardPool() : deps.hardPool;
      const progressionPuzzle = getNextProgressionPuzzle({
        pool,
        solvedIds: stats.solvedPuzzleIds,
        cursor,
        difficulty: "hard",
      });
      const rampedGetter = deps.getHardRampedByIndex ?? deps.getHardByIndex;
      const puzzle = progressionPuzzle ?? rampedGetter(cursor);
      if (!puzzle) return;
      const active = initialActive(puzzle, "standard", String(deps.now()), true, deps.now());
      set({
        screen: "game",
        puzzle,
        active,
        summary: null,
        flash: null,
        streakDelta: 0,
        newBest: false,
        duel: null,
      });
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
      const easyPool = deps.getEasyPool ? deps.getEasyPool() : deps.easyPool;
      const mediumPool = deps.getMediumPool ? deps.getMediumPool() : deps.mediumPool;
      const hardPool = deps.getHardPool ? deps.getHardPool() : deps.hardPool;
      const pool = deps.getPool ? deps.getPool() : deps.pool;
      if (pool.length === 0) return;
      // Daily must respect the player's unlock ladder. A locked-Medium player
      // should never be dropped into a Medium puzzle via daily — that breaks
      // the progression contract and surfaces Foldwink Tabs + Wink before
      // the player has unlocked the explainer for them. So we build the
      // daily-eligible pool from the tiers the player has actually unlocked
      // and only then deterministic-pick by date.
      const stats = get().stats;
      const med = mediumReadiness(stats);
      const hard = hardReadiness(stats, hardPool.length);
      const eligible: Puzzle[] = [...easyPool];
      if (med.unlocked) eligible.push(...mediumPool);
      if (hard.unlocked && hard.hasContent) eligible.push(...hardPool);
      // Safety net: if a test fixture has no easy puzzles, fall back to the
      // full pool so the action remains usable.
      const candidates = eligible.length > 0 ? eligible : [...pool];
      const date = deps.todayLocal();
      const id = getDailyPuzzleId(date, candidates);
      const puzzle = deps.getPuzzleById(id);
      if (!puzzle) return;
      const alreadyPlayed = get().todayDailyRecord?.date === date;
      const active = initialActive(puzzle, "daily", date, !alreadyPlayed, deps.now());
      set({
        screen: "game",
        puzzle,
        active,
        summary: null,
        flash: null,
        streakDelta: 0,
        newBest: false,
        duel: null,
      });
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
      const active = initialActive(puzzle, "zen", String(deps.now()), false, deps.now());
      set({
        screen: "game",
        puzzle,
        active,
        summary: null,
        flash: null,
        streakDelta: 0,
        newBest: false,
        duel: null,
      });
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
      const active = initialActive(customPuzzle, "standard", String(deps.now()), false, deps.now());
      set({
        screen: "game",
        puzzle: customPuzzle,
        active,
        summary: null,
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

    startDuel: (puzzleId: string, challengerMistakes: number, challengerTimeSec: number) => {

      let puzzle = deps.getPuzzleById(puzzleId);
      if (!puzzle && deps.getPool) {
        const fullPool = deps.getPool();
        puzzle = fullPool.find((p) => p.id === puzzleId);
      }
      if (!puzzle) return;
      const active = initialActive(puzzle, "standard", String(deps.now()), false, deps.now());
      set({
        screen: "game",
        puzzle,
        active,
        summary: null,
        flash: null,
        streakDelta: 0,
        newBest: false,
        duel: {
          puzzleId,
          challengerMistakes,
          challengerTimeSec,
        },
      });
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
      if (already) {
        set({
          active: { ...active, selection: active.selection.filter((v) => v !== value) },
        });
        return;
      }
      if (active.selection.length >= SELECTION_SIZE) return;
      set({ active: { ...active, selection: [...active.selection, value] } });
    },

    clearSelection: () => {
      const { active } = get();
      if (!active || active.result) return;
      set({ active: { ...active, selection: [] } });
    },

    reshuffleActive: () => {
      const { active, puzzle } = get();
      if (!active || !puzzle || active.result) return;
      const current = active.order;
      // Fisher–Yates using Math.random. Not deterministic — reshuffle is a
      // cosmetic reset, not a rerollable game event.
      const next = current.slice();
      for (let i = next.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [next[i], next[j]] = [next[j], next[i]];
      }
      set({ active: { ...active, order: next } });
    },

    submit: () => {
      const state = get();
      const { active, puzzle, stats, progress } = state;
      if (!active || !puzzle || active.result) return;
      if (!canSubmit(active.selection)) return;
      const matched = findMatchingGroup(active.selection, puzzle);
      let next: ActiveGame;
      let flash: FlashKind;
      if (matched) {
        next = applyCorrectGroup(active, matched.id, matched.items);
        flash = "correct";
      } else {
        next = applyIncorrectGuess(active);
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

      let nextStats = stats;
      let nextProgress = progress;
      let nextTodayDailyRecord = state.todayDailyRecord;
      let streakDelta = 0;
      let newBest = false;

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
              ...progress,
              easyCursor: nextEasy,
              cursor: nextEasy, // keep legacy field in sync
            };
          } else if (puzzle.difficulty === "medium") {
            const nextMedium = (progress.mediumCursor ?? 0) + 1;
            nextProgress = { ...progress, mediumCursor: nextMedium };
          } else {
            const nextHard = (progress.hardCursor ?? 0) + 1;
            nextProgress = { ...progress, hardCursor: nextHard };
          }
        }
        if (active.mode === "daily") {
          const date = deps.todayLocal();
          nextTodayDailyRecord = {
            date,
            puzzleId: puzzle.id,
            result,
            mistakesUsed: summary.mistakesUsed,
            durationMs: summary.durationMs,
          };
        }
      } else if (active.mode === "zen" && result === "win") {
        const pool = deps.getPool ? deps.getPool() : deps.pool;
        const nextZen = ((progress.zenCursor ?? 0) + 1) % Math.max(1, pool.length);
        nextProgress = { ...progress, zenCursor: nextZen };
        const curZenStreak = (stats.zenStreak ?? 0) + 1;
        const bestZen = Math.max(stats.bestZenStreak ?? 0, curZenStreak);
        nextStats = { ...stats, zenStreak: curZenStreak, bestZenStreak: bestZen };
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
        flash,
        streakDelta,
        newBest,
      });
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

    goToMenu: () => {
      set({
        screen: "menu",
        active: null,
        puzzle: null,
        summary: null,
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
      if (active.mode === "zen") {
        get().startZen();
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


    clearFlash: () => set({ flash: null }),

    completeOnboarding: () => set({ onboarded: true }),

    openHowToPlay: () => set({ howToPlayOpen: true }),

    closeHowToPlay: () => set({ howToPlayOpen: false }),

    winkTab: (groupId: string) => {
      const { active, puzzle } = get();
      if (!active || !puzzle || active.result) return;
      if (!canWinkGroup(puzzle, active.solvedGroupIds, active.winkedGroupId, groupId)) return;
      set({ active: { ...active, winkedGroupId: groupId } });
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
