import type { Puzzle } from "../game/types/puzzle";
import { getLangSync } from "../i18n/useLanguage";
import type { Lang } from "../i18n/strings";
import { RuntimeContentCatalog } from "./runtimeContent";

// Runtime content is deliberately outside the JavaScript module graph. The
// selected locale gets its 30-board boot asset; archive assets are fetched
// only for an explicit archived/referral/resume board.
const runtimeCatalog = new RuntimeContentCatalog();

export interface LangBundle {
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

function at(pool: readonly Puzzle[], index: number): Puzzle | undefined {
  if (pool.length === 0) return undefined;
  return pool[((index % pool.length) + pool.length) % pool.length];
}

function ramped(pool: readonly Puzzle[]): readonly Puzzle[] {
  return [...pool].sort((left, right) => {
    const leftRank = left.meta?.editorialRank ?? left.meta?.difficultyScore ?? 50;
    const rightRank = right.meta?.editorialRank ?? right.meta?.difficultyScore ?? 50;
    return leftRank === rightRank ? left.id.localeCompare(right.id) : leftRank - rightRank;
  });
}

function bundleFor(language: Lang): LangBundle {
  const pool = runtimeCatalog.getPool(language);
  const easy = pool.filter((puzzle) => puzzle.difficulty === "easy");
  const medium = pool.filter((puzzle) => puzzle.difficulty === "medium");
  const hard = pool.filter((puzzle) => puzzle.difficulty === "hard");
  const easyRamped = ramped(easy);
  const mediumRamped = ramped(medium);
  const hardRamped = ramped(hard);
  return {
    pool,
    easy,
    medium,
    hard,
    easyRamped,
    mediumRamped,
    hardRamped,
    getById: (id) => runtimeCatalog.getPuzzle(language, id),
    getByIndex: (index) => at(pool, index),
    getEasyByIndex: (index) => at(easy, index),
    getMediumByIndex: (index) => at(medium, index),
    getHardByIndex: (index) => at(hard, index),
    getEasyRampedByIndex: (index) => at(easyRamped, index),
    getMediumRampedByIndex: (index) => at(mediumRamped, index),
    getHardRampedByIndex: (index) => at(hardRamped, index),
  };
}

/** Load only the selected language manifest and its released 30-board boot asset. */
export function ensureLangLoaded(language: Lang): Promise<void> {
  return runtimeCatalog.ensureBoot(language);
}

/** Fetch and validate the one archive asset containing a specific published board. */
export function ensurePuzzleLoaded(language: Lang, puzzleId: string): Promise<void> {
  return runtimeCatalog.ensurePuzzle(language, puzzleId);
}

/** Bounded one-chunk prefetch used after a real practice/Zen progression step. */
export function ensureNextArchiveChunk(language: Lang): Promise<boolean> {
  return runtimeCatalog.ensureNextArchiveChunk(language);
}

export function isLangLoaded(language: Lang): boolean {
  return runtimeCatalog.isBootLoaded(language);
}

export function getRuntimeContentVersion(language: Lang): string | undefined {
  return runtimeCatalog.getContentVersion(language);
}

/** Verified catalogue total for product copy; unlike getPool(), this is not a lazy-load counter. */
export function getRuntimeCatalogSize(language: Lang): number | undefined {
  return runtimeCatalog.getCatalogSize(language);
}

export function currentBundle(): LangBundle {
  return bundleFor(getLangSync());
}

/** Strict per-language lookup. No EN fallback is ever permitted. */
export function langGetPuzzleByIdStrict(id: string): Puzzle | undefined {
  return bundleFor(getLangSync()).getById(id);
}

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
export function langGetPuzzleByIndex(index: number): Puzzle | undefined {
  return currentBundle().getByIndex(index);
}
export function langGetEasyByIndex(index: number): Puzzle | undefined {
  return currentBundle().getEasyByIndex(index);
}
export function langGetMediumByIndex(index: number): Puzzle | undefined {
  return currentBundle().getMediumByIndex(index);
}
export function langGetHardByIndex(index: number): Puzzle | undefined {
  return currentBundle().getHardByIndex(index);
}
export function langGetEasyRampedByIndex(index: number): Puzzle | undefined {
  return currentBundle().getEasyRampedByIndex(index);
}
export function langGetMediumRampedByIndex(index: number): Puzzle | undefined {
  return currentBundle().getMediumRampedByIndex(index);
}
export function langGetHardRampedByIndex(index: number): Puzzle | undefined {
  return currentBundle().getHardRampedByIndex(index);
}
