export type PuzzleDifficulty = "easy" | "medium" | "hard";

/**
 * Editorial metadata added in 0.4.1 to support the disciplined scale-to-500
 * content pipeline. Every field is optional — the earliest puzzles pre-
 * date this schema and continue to validate cleanly without any migration.
 *
 * New puzzles authored under `docs/content/BATCH_WORKFLOW.md` should fill in
 * as many fields as are known. The validator surfaces coverage stats but
 * never fails a puzzle for missing meta.
 */
export interface PuzzleMeta {
  /** Broad domain, e.g. "astronomy", "geography", "music", "everyday-objects". */
  theme?: string;
  /** Shape of the categories. "classification" = plain recognition,
   *  "wordplay" = shared affix/pun, "attribute" = colour/origin/form, etc. */
  categoryType?: "classification" | "wordplay" | "attribute" | "thematic" | "mixed";
  /** Editorial notes on the false-trail design, if any. Free text. */
  falseTrail?: string;
  /** Explicit word-play flag — even for borderline attribute/wordplay mediums. */
  wordplay?: boolean;
  /** Editor's assessment of fairness risk, 0–3 (0 = safe, 3 = fragile). */
  fairnessRisk?: 0 | 1 | 2 | 3;
  /** Editor's assessment of repetition risk vs. the rest of the pool, 0–3. */
  repetitionRisk?: 0 | 1 | 2 | 3;
  /** Free-text tags for future filtering (e.g. "seasonal", "reserve"). */
  tags?: string[];
  /** Batch id the puzzle was drafted in, e.g. "batch-01". */
  batch?: string;
  /** Editorial status: "approved" is the default; others document workflow state. */
  status?: "approved" | "needs-review" | "pilot";
  /**
   * Heuristic within-tier difficulty (0–100, ascending = easier→harder).
   * Populated by `scripts/score-puzzles.mjs`. Drives the standard-mode
   * ramp: the ramped pools in `loader*.ts` sort by this field. Daily mode
   * ignores it on purpose — the daily puzzle must stay deterministic by
   * id ordering.
   */
  difficultyScore?: number;
  /**
   * GPT perceived within-tier difficulty (1–100), produced by
   * `scripts/phase-e-gpt-ranking.mjs` via a codex CLI pass. Raw signal —
   * the blended `editorialRank` is what the loader actually sorts by.
   */
  gptDifficulty?: number;
  /** GPT's one-sentence rationale for the `gptDifficulty` rating. */
  gptRationale?: string;
  /**
   * Blended editorial difficulty rank (0–100, ascending = easier→harder).
   * Computed as `round(0.4 * difficultyScore + 0.6 * gptDifficulty)` by
   * `scripts/phase-e-blend.mjs`. The loader prefers this over
   * `difficultyScore` when present — so the standard-mode ramp reflects
   * both the heuristic and GPT's perception. Falls back to
   * `difficultyScore` for puzzles without a GPT rating (e.g. new drafts).
   */
  editorialRank?: number;
}

export interface PuzzleGroup {
  id: string;
  label: string;
  items: [string, string, string, string];
  /**
   * Optional short keyword used by the Foldwink Tabs reveal mechanic on medium
   * puzzles. Defaults to `label` when absent. For word-play groups like
   * `"___ FLY"` you typically set `revealHint: "FLY"`.
   */
  revealHint?: string;
}

export interface Puzzle {
  id: string;
  title: string;
  difficulty: PuzzleDifficulty;
  groups: [PuzzleGroup, PuzzleGroup, PuzzleGroup, PuzzleGroup];
  editorialSummary?: string;
  meta?: PuzzleMeta;
}

export interface FlatItem {
  /** Stable within one version-pinned payload; never derived from display text. */
  id: string;
  value: string;
  groupId: string;
}
