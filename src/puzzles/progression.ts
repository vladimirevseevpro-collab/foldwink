import type { Puzzle } from "../game/types/puzzle";
import { fnv1a } from "../utils/hash";

const SEED_STORAGE_KEY = "foldwink:playerSeed";

/**
 * Returns or initializes a persistent, unique player seed for randomized
 * yet deterministic personal progression.
 */
export function getOrCreatePlayerSeed(): string | undefined {
  if (typeof window === "undefined" || typeof localStorage === "undefined") {
    return undefined;
  }
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

export interface ProgressionOptions {
  pool: readonly Puzzle[];
  solvedIds: readonly string[];
  cursor: number;
  difficulty: "easy" | "medium" | "hard";
  playerSeed?: string;
}

/**
 * Picks the next puzzle for a player in Standard mode:
 * 1. Step 0 (cursor = 0): Starter Puzzle 1 (hand-curated onboarding).
 * 2. Step 1 (cursor = 1): Starter Puzzle 2 (introducing twist mechanics).
 * 3. Step 2+ (cursor >= 2): Deterministic Seeded Pick from all remaining UNSOLVED puzzles in the tier.
 *    - Never repeats a solved puzzle until the entire tier pool is exhausted.
 *    - Uses (playerSeed + cursor) for stable personal shuffling across reloads.
 */
export function getNextProgressionPuzzle(opts: ProgressionOptions): Puzzle | undefined {
  const { pool, solvedIds, cursor, difficulty, playerSeed = getOrCreatePlayerSeed() } = opts;
  if (pool.length === 0) return undefined;

  // Onboarding guarantee: first 2 steps always give the hand-crafted starter puzzles
  if (cursor === 0 && pool[0]) {
    return pool[0];
  }
  if (cursor === 1 && pool[1]) {
    return pool[1];
  }

  // Filter for unsolved puzzles in this tier
  const solvedSet = new Set(solvedIds);
  const unsolved = pool.filter((p) => !solvedSet.has(p.id));

  // If player cleared the entire pool, wrap around to all candidates
  const candidates = unsolved.length > 0 ? unsolved : pool;

  if (!playerSeed) {
    const idx = ((cursor % candidates.length) + candidates.length) % candidates.length;
    return candidates[idx];
  }

  // Seeded deterministic index based on playerSeed + difficulty + cursor
  const seedString = `${playerSeed}:${difficulty}:${cursor}`;
  const hash = fnv1a(seedString);
  const selectedIndex = hash % candidates.length;

  return candidates[selectedIndex];
}
