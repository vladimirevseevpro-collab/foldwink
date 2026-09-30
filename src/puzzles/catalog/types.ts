import type { PuzzleLanguage, PuzzleRef } from "../../game/types/game";

export type { PuzzleLanguage, PuzzleRef } from "../../game/types/game";
export type PuzzleBand = "B0" | "B1" | "B2" | "B3" | "B4" | "unrated";
export type PublicTier = "easy" | "medium" | "hard";
export type AmbiguityRisk = "low" | "review" | "reject";
export type TabReview = "not-applicable" | "pending" | "approved";
export type MobileFit = "pending" | "approved" | "reject";
export type EditorialStatus = "unreviewed" | "candidate" | "ready" | "quarantined";
export type VocabularyFamiliarity = "common" | "mixed" | "specialist";
export type ReviewRecord = { reviewerId: string; date: string };
export type PlaytestRecord = { cohortId: string; firstAttemptCount: number };

export type StarterEntry = {
  entryId: string;
  order: number;
  role: string;
  band: PuzzleBand;
  puzzleRef: PuzzleRef;
};

export type StarterManifest = {
  language: PuzzleLanguage;
  catalogVersion: string;
  entries: StarterEntry[];
};

export type DailyEntry = PuzzleRef & {
  entryId: string;
  date: string;
  scheduleVersion: string;
};

export type DailyManifest = {
  language: PuzzleLanguage;
  scheduleVersion: string;
  entries: DailyEntry[];
};

export type EditorialRecord = {
  puzzleRef: PuzzleRef;
  publicTier: PublicTier;
  band: PuzzleBand;
  vocabularyFamiliarity: VocabularyFamiliarity;
  relationTypes: string[];
  topicTags: string[];
  anchorGroupId: string | null;
  ambiguityRisk: AmbiguityRisk;
  tabReview: TabReview;
  mobileFit: MobileFit;
  authorReview: ReviewRecord | null;
  independentReview: ReviewRecord | null;
  playtest: PlaytestRecord | null;
  status: EditorialStatus;
};

export type EditorialManifest = {
  language: PuzzleLanguage;
  catalogVersion: string;
  records: EditorialRecord[];
};

export type ValidationError = { path: string; message: string };
export type ValidationResult<T> =
  | { ok: true; value: T; errors: [] }
  | { ok: false; value?: undefined; errors: ValidationError[] };
