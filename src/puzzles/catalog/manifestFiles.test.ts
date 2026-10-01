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

function dailyManifestFiles(language: PuzzleLanguage): string[] {
  return fs
    .readdirSync(MANIFESTS)
    .filter((file) => file.startsWith(`daily.${language}.`) && file.endsWith(".json"))
    .sort();
}

function puzzleIdSet(language: PuzzleLanguage): Set<string> {
  const directory = puzzleDirectory(language);
  const ids = new Set<string>();
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".json")) continue;
    ids.add(JSON.parse(fs.readFileSync(path.join(directory, entry.name), "utf8")).id);
  }
  return ids;
}

describe("published daily horizon", () => {
  for (const language of ["en", "ru", "de"] as const) {
    it(`${language} every daily manifest resolves to same-language editorial records`, () => {
      const editorialResult = validateEditorialManifest(readJson(`editorial.${language}.json`));
      expect(editorialResult.ok).toBe(true);
      if (!editorialResult.ok) return;

      const editorialById = new Map(
        editorialResult.value.records.map((record) => [record.puzzleRef.puzzleId, record]),
      );
      const poolIds = puzzleIdSet(language);
      const dates = new Set<string>();
      let entries = 0;
      for (const file of dailyManifestFiles(language)) {
        const result = validateDailyManifest(readJson(file));
        expect(result.ok, `${file} is not a valid daily manifest`).toBe(true);
        if (!result.ok) continue;
        entries += result.value.entries.length;
        for (const entry of result.value.entries) {
          expect(entry.language).toBe(language);
          expect(dates.has(entry.date), `duplicate daily date ${entry.date}`).toBe(false);
          dates.add(entry.date);
          expect(poolIds.has(entry.puzzleId), `missing pool board ${entry.puzzleId}`).toBe(
            true,
          );
          const record = editorialById.get(entry.puzzleId);
          expect(record, `missing editorial record for ${entry.puzzleId}`).toBeDefined();
          expect(record?.puzzleRef.language).toBe(language);
          expect(record?.status).not.toBe("quarantined");
        }
      }
      expect(entries).toBeGreaterThanOrEqual(90);
    });
  }
});

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
