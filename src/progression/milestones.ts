import type { Stats } from "../game/types/stats";

export interface CollectionMilestone {
  id: string;
  threshold: number;
  color: string;
  label: { en: string; ru: string; de: string };
  detail: { en: string; ru: string; de: string };
}

/**
 * Six deterministic collection pages. They are derived from unique solved
 * puzzle identities, so replay/custom/duel/Palimpsest cannot farm them.
 */
export const COLLECTION_MILESTONES: readonly CollectionMilestone[] = [
  {
    id: "milestone_first_folio",
    threshold: 1,
    color: "#c58a3a",
    label: { en: "First Folio", ru: "Первый лист", de: "Erstes Blatt" },
    detail: {
      en: "Solve your first puzzle.",
      ru: "Реши первый пазл.",
      de: "Löse dein erstes Rätsel.",
    },
  },
  {
    id: "milestone_five_notes",
    threshold: 5,
    color: "#6d9f87",
    label: { en: "Five Notes", ru: "Пять заметок", de: "Fünf Notizen" },
    detail: {
      en: "Solve five different puzzles.",
      ru: "Реши пять разных пазлов.",
      de: "Löse fünf verschiedene Rätsel.",
    },
  },
  {
    id: "milestone_ten_dispatches",
    threshold: 10,
    color: "#7b88b8",
    label: { en: "Ten Dispatches", ru: "Десять депеш", de: "Zehn Depeschen" },
    detail: {
      en: "Solve ten different puzzles.",
      ru: "Реши десять разных пазлов.",
      de: "Löse zehn verschiedene Rätsel.",
    },
  },
  {
    id: "milestone_quarter_archive",
    threshold: 25,
    color: "#a777b0",
    label: { en: "Quarter Archive", ru: "Четверть архива", de: "Viertelarchiv" },
    detail: {
      en: "Solve 25 different puzzles.",
      ru: "Реши 25 разных пазлов.",
      de: "Löse 25 verschiedene Rätsel.",
    },
  },
  {
    id: "milestone_bound_volume",
    threshold: 50,
    color: "#bd744d",
    label: { en: "Bound Volume", ru: "Переплетённый том", de: "Gebundener Band" },
    detail: {
      en: "Solve 50 different puzzles.",
      ru: "Реши 50 разных пазлов.",
      de: "Löse 50 verschiedene Rätsel.",
    },
  },
  {
    id: "milestone_century_archive",
    threshold: 100,
    color: "#d5b65a",
    label: { en: "Century Archive", ru: "Сотня в архиве", de: "Jahrhundertarchiv" },
    detail: {
      en: "Solve 100 different puzzles.",
      ru: "Реши 100 разных пазлов.",
      de: "Löse 100 verschiedene Rätsel.",
    },
  },
] as const;

export function uniqueSolvedCount(stats: Pick<Stats, "solvedPuzzleIds">): number {
  return new Set(stats.solvedPuzzleIds).size;
}

export function earnedCollectionMilestones(
  stats: Pick<Stats, "solvedPuzzleIds">,
): readonly CollectionMilestone[] {
  const count = uniqueSolvedCount(stats);
  return COLLECTION_MILESTONES.filter((milestone) => count >= milestone.threshold);
}

export function nextCollectionMilestone(
  stats: Pick<Stats, "solvedPuzzleIds">,
): CollectionMilestone | null {
  const count = uniqueSolvedCount(stats);
  return COLLECTION_MILESTONES.find((milestone) => count < milestone.threshold) ?? null;
}

export function newlyEarnedCollectionMilestone(
  stats: Pick<Stats, "solvedPuzzleIds">,
): CollectionMilestone | null {
  const count = uniqueSolvedCount(stats);
  return COLLECTION_MILESTONES.find((milestone) => milestone.threshold === count) ?? null;
}
