import type { Puzzle } from "../game/types/puzzle";
import {
  PUZZLE_POOL,
  EASY_POOL,
  MEDIUM_POOL,
  HARD_POOL,
  EASY_POOL_RAMPED,
  MEDIUM_POOL_RAMPED,
  HARD_POOL_RAMPED,
  getPuzzleById,
  getPuzzleByIndex,
  getEasyByIndex,
  getMediumByIndex,
  getHardByIndex,
  getEasyRampedByIndex,
  getMediumRampedByIndex,
  getHardRampedByIndex,
} from "./loader";
import {
  DE_PUZZLE_POOL,
  DE_EASY_POOL,
  DE_MEDIUM_POOL,
  DE_HARD_POOL,
  DE_EASY_POOL_RAMPED,
  DE_MEDIUM_POOL_RAMPED,
  DE_HARD_POOL_RAMPED,
  getDEPuzzleById,
  getDEPuzzleByIndex,
  getDEEasyByIndex,
  getDEMediumByIndex,
  getDEHardByIndex,
  getDEEasyRampedByIndex,
  getDEMediumRampedByIndex,
  getDEHardRampedByIndex,
  ensureDeLoaded,
} from "./loaderDe";
import {
  RU_PUZZLE_POOL,
  RU_EASY_POOL,
  RU_MEDIUM_POOL,
  RU_HARD_POOL,
  RU_EASY_POOL_RAMPED,
  RU_MEDIUM_POOL_RAMPED,
  RU_HARD_POOL_RAMPED,
  getRUPuzzleById,
  getRUPuzzleByIndex,
  getRUEasyByIndex,
  getRUMediumByIndex,
  getRUHardByIndex,
  getRUEasyRampedByIndex,
  getRUMediumRampedByIndex,
  getRUHardRampedByIndex,
  ensureRuLoaded,
} from "./loaderRu";
import { getLangSync } from "../i18n/useLanguage";
import type { Lang } from "../i18n/strings";

// One registry per language: every tier-level pool and lookup helper that
// used to live as `lang === "de" ? ... : lang === "ru" ? ...` fallback
// ladders at call sites now reads from here.
//
// Fallback contract (behaviour-preserving, **per-tier**, matches the
// pre-v0.7 appStore/MenuScreen rule): each tier falls back to EN
// **independently**. DE has no Hard content today (only Easy + Medium);
// without independent fallback, DE players would lose access to the
// English Hard puzzles the previous code exposed.
interface LangBundle {
  pool: readonly Puzzle[];
  easy: readonly Puzzle[];
  medium: readonly Puzzle[];
  hard: readonly Puzzle[];
  easyRamped: readonly Puzzle[];
  mediumRamped: readonly Puzzle[];
  hardRamped: readonly Puzzle[];
  getById: (id: string) => Puzzle | undefined;
  getByIndex: (i: number) => Puzzle | undefined;
  getEasyByIndex: (i: number) => Puzzle | undefined;
  getMediumByIndex: (i: number) => Puzzle | undefined;
  getHardByIndex: (i: number) => Puzzle | undefined;
  getEasyRampedByIndex: (i: number) => Puzzle | undefined;
  getMediumRampedByIndex: (i: number) => Puzzle | undefined;
  getHardRampedByIndex: (i: number) => Puzzle | undefined;
}

const EN_BUNDLE: LangBundle = {
  pool: PUZZLE_POOL,
  easy: EASY_POOL,
  medium: MEDIUM_POOL,
  hard: HARD_POOL,
  easyRamped: EASY_POOL_RAMPED,
  mediumRamped: MEDIUM_POOL_RAMPED,
  hardRamped: HARD_POOL_RAMPED,
  getById: getPuzzleById,
  getByIndex: getPuzzleByIndex,
  getEasyByIndex,
  getMediumByIndex,
  getHardByIndex,
  getEasyRampedByIndex,
  getMediumRampedByIndex,
  getHardRampedByIndex,
};

const DE_BUNDLE: LangBundle = {
  pool: DE_PUZZLE_POOL,
  easy: DE_EASY_POOL,
  medium: DE_MEDIUM_POOL,
  hard: DE_HARD_POOL,
  easyRamped: DE_EASY_POOL_RAMPED,
  mediumRamped: DE_MEDIUM_POOL_RAMPED,
  hardRamped: DE_HARD_POOL_RAMPED,
  getById: getDEPuzzleById,
  getByIndex: getDEPuzzleByIndex,
  getEasyByIndex: getDEEasyByIndex,
  getMediumByIndex: getDEMediumByIndex,
  getHardByIndex: getDEHardByIndex,
  getEasyRampedByIndex: getDEEasyRampedByIndex,
  getMediumRampedByIndex: getDEMediumRampedByIndex,
  getHardRampedByIndex: getDEHardRampedByIndex,
};

const RU_BUNDLE: LangBundle = {
  pool: RU_PUZZLE_POOL,
  easy: RU_EASY_POOL,
  medium: RU_MEDIUM_POOL,
  hard: RU_HARD_POOL,
  easyRamped: RU_EASY_POOL_RAMPED,
  mediumRamped: RU_MEDIUM_POOL_RAMPED,
  hardRamped: RU_HARD_POOL_RAMPED,
  getById: getRUPuzzleById,
  getByIndex: getRUPuzzleByIndex,
  getEasyByIndex: getRUEasyByIndex,
  getMediumByIndex: getRUMediumByIndex,
  getHardByIndex: getRUHardByIndex,
  getEasyRampedByIndex: getRUEasyRampedByIndex,
  getMediumRampedByIndex: getRUMediumRampedByIndex,
  getHardRampedByIndex: getRUHardRampedByIndex,
};

function bundleFor(lang: Lang): LangBundle {
  if (lang === "de") return DE_BUNDLE;
  if (lang === "ru") return RU_BUNDLE;
  return EN_BUNDLE;
}

// Strict per-language lookup — used by the session-resume path in
// appStore.ts. Unlike `currentBundle()`, this does NOT fall back to EN:
// a saved DE/RU session must only reopen its own language's puzzle,
// never a different-language substitute under localised chrome.
export function langGetPuzzleByIdStrict(id: string): Puzzle | undefined {
  return bundleFor(getLangSync()).getById(id);
}

// Kick the lazy loader for a language chunk. EN is eager and resolves
// immediately; DE/RU fetch their `import.meta.glob` entries via Vite's
// dynamic-import plumbing. Idempotent per language.
export function ensureLangLoaded(lang: Lang): Promise<void> {
  if (lang === "de") return ensureDeLoaded();
  if (lang === "ru") return ensureRuLoaded();
  return Promise.resolve();
}

// currentBundle returns a per-tier composite: every tier independently
// falls back to EN if the current-language tier is empty. This preserves
// the pre-refactor behaviour where DE (which has no Hard content) exposed
// the EN Hard pool to DE players.
export function currentBundle(): LangBundle {
  const lang = getLangSync();
  const b = bundleFor(lang);
  if (b === EN_BUNDLE) return b;
  return {
    pool: b.pool.length > 0 ? b.pool : EN_BUNDLE.pool,
    easy: b.easy.length > 0 ? b.easy : EN_BUNDLE.easy,
    medium: b.medium.length > 0 ? b.medium : EN_BUNDLE.medium,
    hard: b.hard.length > 0 ? b.hard : EN_BUNDLE.hard,
    easyRamped: b.easyRamped.length > 0 ? b.easyRamped : EN_BUNDLE.easyRamped,
    mediumRamped: b.mediumRamped.length > 0 ? b.mediumRamped : EN_BUNDLE.mediumRamped,
    hardRamped: b.hardRamped.length > 0 ? b.hardRamped : EN_BUNDLE.hardRamped,
    getById: (id) =>
      b.getById(id) ??
      EN_BUNDLE.getById(id) ??
      RU_BUNDLE.getById(id) ??
      DE_BUNDLE.getById(id),
    getByIndex: (i) => (b.pool.length > 0 ? b.getByIndex(i) : EN_BUNDLE.getByIndex(i)),
    getEasyByIndex: (i) => (b.easy.length > 0 ? b.getEasyByIndex(i) : EN_BUNDLE.getEasyByIndex(i)),
    getMediumByIndex: (i) =>
      b.medium.length > 0 ? b.getMediumByIndex(i) : EN_BUNDLE.getMediumByIndex(i),
    getHardByIndex: (i) => (b.hard.length > 0 ? b.getHardByIndex(i) : EN_BUNDLE.getHardByIndex(i)),
    getEasyRampedByIndex: (i) =>
      b.easyRamped.length > 0 ? b.getEasyRampedByIndex(i) : EN_BUNDLE.getEasyRampedByIndex(i),
    getMediumRampedByIndex: (i) =>
      b.mediumRamped.length > 0
        ? b.getMediumRampedByIndex(i)
        : EN_BUNDLE.getMediumRampedByIndex(i),
    getHardRampedByIndex: (i) =>
      b.hardRamped.length > 0 ? b.getHardRampedByIndex(i) : EN_BUNDLE.getHardRampedByIndex(i),
  };
}

// Language-aware getters that read `getLangSync()` each call, so switching
// the language takes effect on the next store action without recreating
// the store.
export function langGetPool(): readonly Puzzle[] {
  return currentBundle().pool;
}
export function langGetEasyPool(): readonly Puzzle[] {
  return currentBundle().easy;
}
export function langGetMediumPool(): readonly Puzzle[] {
  return currentBundle().medium;
}
export function langGetHardPool(): readonly Puzzle[] {
  return currentBundle().hard;
}

export function langGetPuzzleById(id: string): Puzzle | undefined {
  return currentBundle().getById(id);
}
export function langGetPuzzleByIndex(i: number): Puzzle | undefined {
  return currentBundle().getByIndex(i);
}
export function langGetEasyByIndex(i: number): Puzzle | undefined {
  return currentBundle().getEasyByIndex(i);
}
export function langGetMediumByIndex(i: number): Puzzle | undefined {
  return currentBundle().getMediumByIndex(i);
}
export function langGetHardByIndex(i: number): Puzzle | undefined {
  return currentBundle().getHardByIndex(i);
}
export function langGetEasyRampedByIndex(i: number): Puzzle | undefined {
  return currentBundle().getEasyRampedByIndex(i);
}
export function langGetMediumRampedByIndex(i: number): Puzzle | undefined {
  return currentBundle().getMediumRampedByIndex(i);
}
export function langGetHardRampedByIndex(i: number): Puzzle | undefined {
  return currentBundle().getHardRampedByIndex(i);
}
