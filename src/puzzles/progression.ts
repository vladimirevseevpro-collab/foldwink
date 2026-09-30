import type { Puzzle } from "../game/types/puzzle";
import type {
  EditorialRecord,
  PuzzleBand,
  PuzzleLanguage,
  PuzzleRef,
  StarterEntry,
} from "./catalog";
import { fnv1a } from "../utils/hash";

const SEED_STORAGE_KEY = "foldwink:playerSeed";

export interface PracticeCandidate {
  puzzle: Puzzle;
  puzzleRef: PuzzleRef;
  editorial: EditorialRecord;
}

export interface PracticeSelectionInput {
  language: PuzzleLanguage;
  tier: "easy" | "medium" | "hard";
  recommendedBand?: PuzzleBand;
  followStarterPath: boolean;
  starters: readonly StarterEntry[];
  completedStarterEntryIds: readonly string[];
  seenLineageIds: readonly string[];
  recentTopicTags: readonly string[];
  recentItemValues: readonly string[];
  selectionSequence: number;
  playerSeed: string;
  catalogVersion: string;
  candidates: readonly PracticeCandidate[];
}

export type PracticeSelection = {
  candidate?: PracticeCandidate;
  starterEntry?: StarterEntry;
  source: "starter" | "catalog" | "none";
  diversityRelaxed: boolean;
  repeatsExhaustedCatalog: boolean;
  bandUnavailable: boolean;
};

function itemVocabulary(puzzle: Puzzle): Set<string> {
  return new Set(
    puzzle.groups
      .flatMap((group) => group.items)
      .map((item) => item.trim().toLocaleLowerCase()),
  );
}

function overlapsRecentVocabulary(puzzle: Puzzle, recent: Set<string>): boolean {
  return [...itemVocabulary(puzzle)].some((item) => recent.has(item));
}

/**
 * Pure W2 selection policy. All state, seed and catalog data are injected;
 * this function never reads or writes storage and never changes language or tier.
 */
export function selectPracticePuzzle(input: PracticeSelectionInput): PracticeSelection {
  if (input.followStarterPath) {
    const completed = new Set(input.completedStarterEntryIds);
    const starterEntry = [...input.starters]
      .sort((a, b) => a.order - b.order)
      .find((entry) => !completed.has(entry.entryId));
    if (starterEntry) {
      const candidate = input.candidates.find(
        (item) =>
          item.puzzleRef.language === input.language &&
          item.puzzleRef.puzzleId === starterEntry.puzzleRef.puzzleId,
      );
      if (candidate) {
        return {
          candidate,
          starterEntry,
          source: "starter",
          diversityRelaxed: false,
          repeatsExhaustedCatalog: false,
          bandUnavailable: false,
        };
      }
    }
  }

  const sameTier = input.candidates.filter(
    (item) =>
      item.puzzleRef.language === input.language &&
      item.puzzle.difficulty === input.tier &&
      item.editorial.status === "ready" &&
      item.editorial.ambiguityRisk === "low" &&
      item.editorial.mobileFit === "approved",
  );
  const bandCandidates = input.recommendedBand
    ? sameTier.filter((item) => item.editorial.band === input.recommendedBand)
    : sameTier;
  if (bandCandidates.length === 0) {
    return {
      source: "none",
      diversityRelaxed: false,
      repeatsExhaustedCatalog: false,
      bandUnavailable: sameTier.length > 0 && Boolean(input.recommendedBand),
    };
  }

  const seen = new Set(input.seenLineageIds);
  const unseen = bandCandidates.filter((item) => !seen.has(item.puzzleRef.lineageId));
  const repeatsExhaustedCatalog = unseen.length === 0;
  const noveltyPool = unseen.length > 0 ? unseen : bandCandidates;

  const recentTopics = new Set(input.recentTopicTags.slice(-2));
  const recentItems = new Set(
    input.recentItemValues.slice(-48).map((item) => item.trim().toLocaleLowerCase()),
  );
  const diverse = noveltyPool.filter(
    (item) =>
      !item.editorial.topicTags.some((topic) => recentTopics.has(topic)) &&
      !overlapsRecentVocabulary(item.puzzle, recentItems),
  );
  const diversityRelaxed = diverse.length === 0 && noveltyPool.length > 0;
  const selectable = (diverse.length > 0 ? diverse : noveltyPool)
    .slice()
    .sort((a, b) => a.puzzleRef.puzzleId.localeCompare(b.puzzleRef.puzzleId));
  const seed = [
    input.catalogVersion,
    input.language,
    input.tier,
    input.recommendedBand ?? "any",
    input.selectionSequence,
    input.playerSeed,
  ].join(":");
  const candidate = selectable[fnv1a(seed) % selectable.length];
  return {
    candidate,
    source: candidate ? "catalog" : "none",
    diversityRelaxed,
    repeatsExhaustedCatalog,
    bandUnavailable: false,
  };
}

/** Storage adapter for the passport/backup surface; never used by the pure selector. */
export function getOrCreatePlayerSeed(): string | undefined {
  if (typeof window === "undefined" || typeof localStorage === "undefined") return undefined;
  try {
    let seed = localStorage.getItem(SEED_STORAGE_KEY);
    if (!seed) {
      seed = `pld_${Math.random().toString(36).substring(2, 11)}_${Date.now().toString(36)}`;
      localStorage.setItem(SEED_STORAGE_KEY, seed);
    }
    return seed;
  } catch {
    return undefined;
  }
}

export function setPlayerSeed(seed: string): void {
  if (typeof window === "undefined" || typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(SEED_STORAGE_KEY, seed);
  } catch {
    // Storage failure is surfaced by the caller's backup/import flow.
  }
}

/** Compatibility selector for un-migrated callers. Pure and free of pool-order starter magic. */
export interface ProgressionOptions {
  pool: readonly Puzzle[];
  solvedIds: readonly string[];
  cursor: number;
  difficulty: "easy" | "medium" | "hard";
  playerSeed?: string;
}

export function getNextProgressionPuzzle(opts: ProgressionOptions): Puzzle | undefined {
  const { pool, solvedIds, cursor, difficulty, playerSeed } = opts;
  const tier = pool
    .filter((puzzle) => puzzle.difficulty === difficulty)
    .slice()
    .sort((a, b) => a.id.localeCompare(b.id));
  if (tier.length === 0) return undefined;
  const solved = new Set(solvedIds);
  const preferred = tier[((cursor % tier.length) + tier.length) % tier.length];
  if (!playerSeed && preferred && !solved.has(preferred.id)) return preferred;
  const unseen = tier.filter((puzzle) => !solved.has(puzzle.id));
  const candidates = (unseen.length > 0 ? unseen : tier)
    .slice()
    .sort((a, b) => a.id.localeCompare(b.id));
  if (!playerSeed) return candidates[0];
  const seed = playerSeed ? `${playerSeed}:${difficulty}:${cursor}` : `${difficulty}:${cursor}`;
  return candidates[fnv1a(seed) % candidates.length];
}
