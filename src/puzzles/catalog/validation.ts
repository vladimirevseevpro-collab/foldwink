import type {
  DailyManifest,
  EditorialManifest,
  EditorialRecord,
  PuzzleBand,
  PuzzleLanguage,
  PuzzleRef,
  StarterManifest,
  ValidationError,
  ValidationResult,
} from "./types";

const languages: readonly PuzzleLanguage[] = ["en", "ru", "de"];
const bands: readonly PuzzleBand[] = ["B0", "B1", "B2", "B3", "B4", "unrated"];
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const nonEmpty = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;
const has = (value: Record<string, unknown>, key: string): unknown => value[key];
const error = (path: string, message: string): ValidationError => ({ path, message });

function validateStringList(value: unknown, path: string): ValidationError[] {
  if (!Array.isArray(value) || value.some((item) => !nonEmpty(item))) {
    return [error(path, "must be an array of non-empty strings")];
  }
  return validateUnique(value, path);
}

function validateReview(value: unknown, path: string): ValidationError[] {
  if (value === null) return [];
  if (!isRecord(value)) return [error(path, "must be null or a review object")];
  const errors: ValidationError[] = [];
  if (!nonEmpty(value.reviewerId))
    errors.push(error(`${path}.reviewerId`, "must be a non-empty string"));
  if (!isDate(value.date))
    errors.push(error(`${path}.date`, "must be a valid YYYY-MM-DD date"));
  return errors;
}

export function validatePuzzleRef(
  input: unknown,
  path = "puzzleRef",
): ValidationResult<PuzzleRef> {
  if (!isRecord(input)) return { ok: false, errors: [error(path, "must be an object")] };
  const result: ValidationError[] = [];
  if (!languages.includes(has(input, "language") as PuzzleLanguage))
    result.push(error(`${path}.language`, "unsupported language"));
  for (const key of ["puzzleId", "lineageId", "contentVersion"])
    if (!nonEmpty(has(input, key)))
      result.push(error(`${path}.${key}`, "must be a non-empty string"));
  return result.length
    ? { ok: false, errors: result }
    : { ok: true, errors: [], value: input as unknown as PuzzleRef };
}

const validateUnique = (values: string[], path: string): ValidationError[] => {
  const seen = new Set<string>();
  return values.flatMap((value, index) =>
    seen.has(value)
      ? [error(`${path}[${index}]`, "duplicate identity")]
      : (seen.add(value), []),
  );
};

export function validateStarterManifest(input: unknown): ValidationResult<StarterManifest> {
  if (!isRecord(input)) return { ok: false, errors: [error("manifest", "must be an object")] };
  const errors: ValidationError[] = [];
  if (!languages.includes(has(input, "language") as PuzzleLanguage))
    errors.push(error("language", "unsupported language"));
  if (!nonEmpty(has(input, "catalogVersion")))
    errors.push(error("catalogVersion", "must be a non-empty string"));
  const entries = has(input, "entries");
  if (!Array.isArray(entries) || entries.length !== 6)
    errors.push(error("entries", "must contain exactly 6 entries"));
  const refs: PuzzleRef[] = [];
  if (Array.isArray(entries))
    entries.forEach((entry, index) => {
      if (!isRecord(entry)) {
        errors.push(error(`entries[${index}]`, "must be an object"));
        return;
      }
      if (!Number.isInteger(entry.order) || entry.order !== index + 1)
        errors.push(error(`entries[${index}].order`, "must be consecutive 1-based order"));
      if (
        !nonEmpty(entry.entryId) ||
        !nonEmpty(entry.role) ||
        !bands.includes(entry.band as PuzzleBand)
      )
        errors.push(error(`entries[${index}]`, "entryId, role and valid band are required"));
      const ref = validatePuzzleRef(entry.puzzleRef, `entries[${index}].puzzleRef`);
      if (!ref.ok) errors.push(...ref.errors);
      else refs.push(ref.value);
      if (ref.ok && ref.value.language !== input.language)
        errors.push(
          error(`entries[${index}].puzzleRef.language`, "must match manifest language"),
        );
    });
  errors.push(
    ...validateUnique(
      Array.isArray(entries)
        ? entries.map((entry) => (isRecord(entry) ? String(entry.entryId) : ""))
        : [],
      "entries.entryId",
    ),
  );
  errors.push(
    ...validateUnique(
      refs.map((ref) => ref.puzzleId),
      "entries.puzzleRef.puzzleId",
    ),
  );
  return errors.length
    ? { ok: false, errors }
    : { ok: true, errors: [], value: input as StarterManifest };
}

const isDate = (value: unknown): value is string => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
};

export function validateDailyManifest(input: unknown): ValidationResult<DailyManifest> {
  if (!isRecord(input)) return { ok: false, errors: [error("manifest", "must be an object")] };
  const errors: ValidationError[] = [];
  if (!languages.includes(input.language as PuzzleLanguage))
    errors.push(error("language", "unsupported language"));
  if (!nonEmpty(input.scheduleVersion))
    errors.push(error("scheduleVersion", "must be a non-empty string"));
  const entries = input.entries;
  if (!Array.isArray(entries) || entries.length < 30) {
    errors.push(error("entries", "must contain at least 30 consecutive entries"));
  }
  const dates: string[] = [];
  const ids: string[] = [];
  if (Array.isArray(entries))
    entries.forEach((entry, index) => {
      if (!isRecord(entry)) {
        errors.push(error(`entries[${index}]`, "must be an object"));
        return;
      }
      if (!isDate(entry.date))
        errors.push(error(`entries[${index}].date`, "must be a valid YYYY-MM-DD date"));
      else dates.push(entry.date);
      if (!nonEmpty(entry.entryId))
        errors.push(error(`entries[${index}].entryId`, "must be a non-empty string"));
      else ids.push(entry.entryId);
      if (entry.scheduleVersion !== input.scheduleVersion)
        errors.push(
          error(`entries[${index}].scheduleVersion`, "must match manifest scheduleVersion"),
        );
      const ref = validatePuzzleRef(entry, `entries[${index}]`);
      if (!ref.ok) errors.push(...ref.errors);
      else if (ref.value.language !== input.language)
        errors.push(error(`entries[${index}].language`, "must match manifest language"));
    });
  errors.push(
    ...validateUnique(dates, "entries.date"),
    ...validateUnique(ids, "entries.entryId"),
  );
  for (let i = 1; i < dates.length; i++)
    if (
      Date.parse(`${dates[i]}T00:00:00Z`) - Date.parse(`${dates[i - 1]}T00:00:00Z`) !==
      86_400_000
    )
      errors.push(error(`entries[${i}].date`, "dates must be consecutive and ordered"));
  return errors.length
    ? { ok: false, errors }
    : { ok: true, errors: [], value: input as DailyManifest };
}

export function validateEditorialRecord(
  input: unknown,
  path = "record",
): ValidationResult<EditorialRecord> {
  if (!isRecord(input)) return { ok: false, errors: [error(path, "must be an object")] };
  const errors: ValidationError[] = [];
  const ref = validatePuzzleRef(input.puzzleRef, `${path}.puzzleRef`);
  if (!ref.ok) errors.push(...ref.errors);
  const choices: Record<string, readonly string[]> = {
    publicTier: ["easy", "medium", "hard"],
    vocabularyFamiliarity: ["common", "mixed", "specialist"],
    ambiguityRisk: ["low", "review", "reject"],
    tabReview: ["not-applicable", "pending", "approved"],
    mobileFit: ["pending", "approved", "reject"],
    status: ["unreviewed", "candidate", "ready", "quarantined"],
  };
  for (const key of Object.keys(choices))
    if (!choices[key].includes(String(input[key])))
      errors.push(error(`${path}.${key}`, "invalid value"));
  if (!bands.includes(input.band as PuzzleBand))
    errors.push(error(`${path}.band`, "invalid band"));
  errors.push(...validateStringList(input.relationTypes, `${path}.relationTypes`));
  errors.push(...validateStringList(input.topicTags, `${path}.topicTags`));
  if (input.anchorGroupId !== null && !nonEmpty(input.anchorGroupId))
    errors.push(error(`${path}.anchorGroupId`, "must be null or a non-empty string"));
  errors.push(...validateReview(input.authorReview, `${path}.authorReview`));
  errors.push(...validateReview(input.independentReview, `${path}.independentReview`));
  if (input.playtest !== null) {
    if (!isRecord(input.playtest))
      errors.push(error(`${path}.playtest`, "must be null or a playtest object"));
    else {
      if (!nonEmpty(input.playtest.cohortId))
        errors.push(error(`${path}.playtest.cohortId`, "must be a non-empty string"));
      if (
        !Number.isInteger(input.playtest.firstAttemptCount) ||
        Number(input.playtest.firstAttemptCount) < 0
      )
        errors.push(
          error(`${path}.playtest.firstAttemptCount`, "must be a non-negative integer"),
        );
    }
  }
  return errors.length
    ? { ok: false, errors }
    : { ok: true, errors: [], value: input as EditorialRecord };
}

export function validateEditorialManifest(input: unknown): ValidationResult<EditorialManifest> {
  if (!isRecord(input)) return { ok: false, errors: [error("manifest", "must be an object")] };
  const errors: ValidationError[] = [];
  if (!languages.includes(input.language as PuzzleLanguage))
    errors.push(error("language", "unsupported language"));
  if (!nonEmpty(input.catalogVersion))
    errors.push(error("catalogVersion", "must be a non-empty string"));
  if (!Array.isArray(input.records)) errors.push(error("records", "must be an array"));
  const ids: string[] = [];
  if (Array.isArray(input.records))
    input.records.forEach((record, index) => {
      const result = validateEditorialRecord(record, `records[${index}]`);
      if (!result.ok) errors.push(...result.errors);
      else {
        ids.push(result.value.puzzleRef.puzzleId);
        if (result.value.puzzleRef.language !== input.language)
          errors.push(
            error(`records[${index}].puzzleRef.language`, "must match manifest language"),
          );
      }
    });
  errors.push(...validateUnique(ids, "records.puzzleRef.puzzleId"));
  return errors.length
    ? { ok: false, errors }
    : { ok: true, errors: [], value: input as EditorialManifest };
}
