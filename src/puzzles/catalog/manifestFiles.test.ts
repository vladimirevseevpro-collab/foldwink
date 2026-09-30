import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { PuzzleLanguage } from "./types";
import {
  validateDailyManifest,
  validateEditorialManifest,
  validateStarterManifest,
} from "./validation";

const ROOT = process.cwd();
const MANIFESTS = path.join(ROOT, "puzzles", "manifests");

function readJson(file: string): unknown {
  return JSON.parse(fs.readFileSync(path.join(MANIFESTS, file), "utf8"));
}

function puzzleDirectory(language: PuzzleLanguage): string {
  const pool =
    language === "en" ? path.join("puzzles", "pool") : path.join("puzzles", language, "pool");
  return path.join(ROOT, pool);
}

function puzzleExists(language: PuzzleLanguage, puzzleId: string): boolean {
  const directory = puzzleDirectory(language);
  const direct = path.join(directory, `${puzzleId}.json`);
  if (fs.existsSync(direct)) return true;
  return fs.readdirSync(directory, { withFileTypes: true }).some((entry) => {
    if (!entry.isFile() || !entry.name.endsWith(".json")) return false;
    try {
      return (
        JSON.parse(fs.readFileSync(path.join(directory, entry.name), "utf8")).id === puzzleId
      );
    } catch {
      return false;
    }
  });
}

describe("checked-in release-entry manifests", () => {
  for (const language of ["en", "ru", "de"] as const) {
    it(`${language} starters reference reviewed same-language payloads`, () => {
      const starterResult = validateStarterManifest(readJson(`starters.${language}.json`));
      const editorialResult = validateEditorialManifest(readJson(`editorial.${language}.json`));
      expect(starterResult.ok).toBe(true);
      expect(editorialResult.ok).toBe(true);
      if (!starterResult.ok || !editorialResult.ok) return;

      const editorialById = new Map(
        editorialResult.value.records.map((record) => [record.puzzleRef.puzzleId, record]),
      );
      for (const entry of starterResult.value.entries) {
        const record = editorialById.get(entry.puzzleRef.puzzleId);
        expect(puzzleExists(language, entry.puzzleRef.puzzleId)).toBe(true);
        expect(
          record,
          `missing editorial record for ${entry.puzzleRef.puzzleId}`,
        ).toBeDefined();
        expect(record?.ambiguityRisk).toBe("low");
        expect(record?.band).toBe(entry.band);
        expect(record?.independentReview).not.toBeNull();
        expect(record?.status).not.toBe("quarantined");
      }
    });

    it(`${language} daily calendar has 30 reviewed same-language payloads`, () => {
      const dailyResult = validateDailyManifest(readJson(`daily.${language}.2026-09-14.json`));
      const editorialResult = validateEditorialManifest(readJson(`editorial.${language}.json`));
      expect(dailyResult.ok).toBe(true);
      expect(editorialResult.ok).toBe(true);
      if (!dailyResult.ok || !editorialResult.ok) return;

      expect(dailyResult.value.entries).toHaveLength(30);
      expect(new Set(dailyResult.value.entries.map((entry) => entry.puzzleId)).size).toBe(30);
      const editorialById = new Map(
        editorialResult.value.records.map((record) => [record.puzzleRef.puzzleId, record]),
      );
      for (const entry of dailyResult.value.entries) {
        const record = editorialById.get(entry.puzzleId);
        expect(puzzleExists(language, entry.puzzleId)).toBe(true);
        expect(record, `missing editorial record for ${entry.puzzleId}`).toBeDefined();
        expect(record?.puzzleRef.language).toBe(language);
        expect(record?.ambiguityRisk).toBe("low");
        expect(record?.independentReview).not.toBeNull();
        expect(record?.mobileFit).toBe("approved");
        expect(record?.status).toBe("ready");
      }
      if (language === "en") {
        expect(
          new Set(
            dailyResult.value.entries.map((entry) => editorialById.get(entry.puzzleId)?.band),
          ),
        ).toEqual(new Set(["B0", "B1", "B2", "B3", "B4"]));
      }
    });
  }
});
