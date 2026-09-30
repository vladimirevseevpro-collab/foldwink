import type { DailyEntry, PuzzleLanguage } from "./catalog";
import { getDailyEntry } from "./catalog";

export type DailyEntryLookup = (
  language: PuzzleLanguage,
  date: string,
) => DailyEntry | undefined;

/**
 * Resolves an immutable published Daily slot. It deliberately has no pool,
 * unlock, stats or random inputs, so two players on the same language/date
 * receive the same version-pinned payload reference.
 */
export function resolveDailyEntry(
  language: PuzzleLanguage,
  date: string,
  lookup: DailyEntryLookup = getDailyEntry,
): DailyEntry | undefined {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return undefined;
  const entry = lookup(language, date);
  if (!entry || entry.language !== language || entry.date !== date) return undefined;
  return entry;
}
