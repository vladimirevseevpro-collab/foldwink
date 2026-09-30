import type {
  DailyManifest,
  EditorialManifest,
  StarterManifest,
  ValidationResult,
} from "./types";
import {
  validateDailyManifest,
  validateEditorialManifest,
  validateStarterManifest,
} from "./validation";

export type ManifestKind = "starter" | "daily" | "editorial";
export function loadManifest(
  input: unknown,
  kind: ManifestKind,
): ValidationResult<StarterManifest | DailyManifest | EditorialManifest> {
  if (kind === "starter") return validateStarterManifest(input);
  if (kind === "daily") return validateDailyManifest(input);
  return validateEditorialManifest(input);
}

export const loadStarterManifest = (input: unknown) => validateStarterManifest(input);
export const loadDailyManifest = (input: unknown) => validateDailyManifest(input);
export const loadEditorialManifest = (input: unknown) => validateEditorialManifest(input);
