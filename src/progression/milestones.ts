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
      en: "Solve one official puzzle.",
      ru: "Решите одну официальную задачу.",
      de: "Löse ein offizielles Rätsel.",
    },
  },
  {
    id: "milestone_five_notes",
    threshold: 5,
    color: "#6d9f87",
    label: { en: "Five Notes", ru: "Пять заметок", de: "Fünf Notizen" },
    detail: {
      en: "File five unique solutions.",
      ru: "Сохраните пять уникальных решений.",
      de: "Archiviere fünf einzigartige Lösungen.",
    },
  },
  {
    id: "milestone_ten_dispatches",
    threshold: 10,
    color: "#7b88b8",
    label: { en: "Ten Dispatches", ru: "Десять депеш", de: "Zehn Depeschen" },
    detail: {
      en: "File ten unique solutions.",
      ru: "Сохраните десять уникальных решений.",
      de: "Archiviere zehn einzigartige Lösungen.",
    },
  },
  {
    id: "milestone_quarter_archive",
    threshold: 25,
    color: "#a777b0",
    label: { en: "Quarter Archive", ru: "Четверть архива", de: "Viertelarchiv" },
    detail: {
      en: "Build a collection of 25 unique solutions.",
      ru: "Соберите 25 уникальных решений.",
      de: "Sammle 25 einzigartige Lösungen.",
    },
  },
  {
    id: "milestone_bound_volume",
    threshold: 50,
    color: "#bd744d",
    label: { en: "Bound Volume", ru: "Переплетённый том", de: "Gebundener Band" },
    detail: {
      en: "Build a collection of 50 unique solutions.",
      ru: "Соберите 50 уникальных решений.",
      de: "Sammle 50 einzigartige Lösungen.",
    },
  },
  {
    id: "milestone_century_archive",
    threshold: 100,
    color: "#d5b65a",
    label: { en: "Century Archive", ru: "Архив сотни", de: "Jahrhundertarchiv" },
    detail: {
      en: "Preserve 100 unique solutions.",
      ru: "Сохраните 100 уникальных решений.",
      de: "Bewahre 100 einzigartige Lösungen.",
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
