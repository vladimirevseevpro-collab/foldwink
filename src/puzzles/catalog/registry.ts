import type {
  DailyEntry,
  DailyManifest,
  EditorialManifest,
  EditorialRecord,
  PuzzleLanguage,
  StarterManifest,
} from "./types";
import {
  validateDailyManifest,
  validateEditorialManifest,
  validateStarterManifest,
} from "./validation";

export type CatalogInputs = { starters: unknown[]; daily: unknown[]; editorial: unknown[] };
export type CatalogRegistry = {
  getStarterManifest: (language: PuzzleLanguage) => StarterManifest | undefined;
  getDailyEntry: (language: PuzzleLanguage, date: string) => DailyEntry | undefined;
  getEditorialRecord: (
    language: PuzzleLanguage,
    puzzleId: string,
  ) => EditorialRecord | undefined;
};

const dev = (): boolean => typeof import.meta.env !== "undefined" && import.meta.env.DEV;
function findOne<T>(
  items: unknown[],
  validate: (item: unknown) => {
    ok: boolean;
    value?: T;
    errors: { path: string; message: string }[];
  },
  language: PuzzleLanguage,
): T | undefined {
  const matches = items.filter(
    (item) => (item as { language?: unknown })?.language === language,
  );
  if (matches.length !== 1) {
    if (dev() && matches.length > 1) throw new Error(`Duplicate ${language} catalog manifest`);
    return undefined;
  }
  const result = validate(matches[0]);
  if (!result.ok) {
    if (dev())
      throw new Error(result.errors.map((item) => `${item.path}: ${item.message}`).join("; "));
    return undefined;
  }
  return result.value;
}

export function createCatalogRegistry(inputs: CatalogInputs): CatalogRegistry {
  return {
    getStarterManifest: (language) =>
      findOne<StarterManifest>(inputs.starters, validateStarterManifest, language),
    getDailyEntry: (language, date) => {
      const manifest = findOne<DailyManifest>(inputs.daily, validateDailyManifest, language);
      return manifest?.entries.find((entry) => entry.date === date);
    },
    getEditorialRecord: (language, puzzleId) => {
      const manifest = findOne<EditorialManifest>(
        inputs.editorial,
        validateEditorialManifest,
        language,
      );
      return manifest?.records.find((record) => record.puzzleRef.puzzleId === puzzleId);
    },
  };
}

// Production catalog data arrives with the selected-language runtime
// manifest. Do not glob authoring manifests here: that would put all three
// locales (including their editorial records) on the initial JS path.
const runtimeByLanguage = new Map<PuzzleLanguage, CatalogRegistry>();

export function installRuntimeCatalog(inputs: {
  starters: unknown;
  daily: unknown;
  editorial: unknown;
}): void {
  const language = (inputs.starters as { language?: unknown })?.language;
  if (language !== "en" && language !== "ru" && language !== "de") return;
  runtimeByLanguage.set(
    language,
    createCatalogRegistry({
      starters: [inputs.starters],
      daily: [inputs.daily],
      editorial: [inputs.editorial],
    }),
  );
}

export const getStarterManifest = (language: PuzzleLanguage) =>
  runtimeByLanguage.get(language)?.getStarterManifest(language);
export const getDailyEntry = (language: PuzzleLanguage, date: string) =>
  runtimeByLanguage.get(language)?.getDailyEntry(language, date);
export const getEditorialRecord = (language: PuzzleLanguage, puzzleId: string) =>
  runtimeByLanguage.get(language)?.getEditorialRecord(language, puzzleId);
