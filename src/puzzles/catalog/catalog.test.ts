import { describe, expect, it } from "vitest";
import { createCatalogRegistry } from "./registry";
import {
  validateDailyManifest,
  validateEditorialManifest,
  validateStarterManifest,
} from "./validation";

const ref = (id: string, language: "en" | "ru" | "de" = "en") => ({
  language,
  puzzleId: id,
  lineageId: id,
  contentVersion: "catalog-v1",
});
const starter = {
  language: "en",
  catalogVersion: "catalog-v1",
  entries: Array.from({ length: 6 }, (_, index) => ({
    entryId: `s-${index + 1}`,
    order: index + 1,
    role: "practice",
    band: "B0",
    puzzleRef: ref(`p-${index + 1}`),
  })),
};

describe("catalog manifest validation", () => {
  it("accepts exactly six ordered starters", () =>
    expect(validateStarterManifest(starter).ok).toBe(true));
  it("rejects duplicate and non-consecutive starter entries", () => {
    const invalid = {
      ...starter,
      entries: starter.entries.map((entry, index) =>
        index === 1
          ? {
              ...entry,
              order: 1,
              puzzleRef:
                entry === starter.entries[0] ? entry.puzzleRef : starter.entries[0].puzzleRef,
            }
          : entry,
      ),
    };
    expect(validateStarterManifest(invalid).ok).toBe(false);
  });
  it("rejects daily gaps", () => {
    const result = validateDailyManifest({
      language: "en",
      scheduleVersion: "calendar-v1",
      entries: [
        { ...ref("p-1"), entryId: "d-1", date: "2026-01-01", scheduleVersion: "calendar-v1" },
        { ...ref("p-2"), entryId: "d-2", date: "2026-01-03", scheduleVersion: "calendar-v1" },
      ],
    });
    expect(result.ok).toBe(false);
  });

  it("accepts a 30-day immutable daily horizon", () => {
    const entries = Array.from({ length: 30 }, (_, index) => {
      const date = new Date(Date.UTC(2026, 8, 15 + index)).toISOString().slice(0, 10);
      return {
        ...ref(`p-${index + 1}`),
        entryId: `daily-en-${date}`,
        date,
        scheduleVersion: "calendar-2026-09-v1",
      };
    });
    expect(
      validateDailyManifest({
        language: "en",
        scheduleVersion: "calendar-2026-09-v1",
        entries,
      }).ok,
    ).toBe(true);
  });

  it("requires the full editorial readiness record", () => {
    const result = validateEditorialManifest({
      language: "en",
      catalogVersion: "catalog-2026-09-v1",
      records: [
        {
          puzzleRef: ref("p-1"),
          publicTier: "easy",
          band: "B0",
          vocabularyFamiliarity: "common",
          relationTypes: ["classification"],
          topicTags: ["everyday"],
          anchorGroupId: "group-a",
          ambiguityRisk: "low",
          tabReview: "not-applicable",
          mobileFit: "approved",
          authorReview: { reviewerId: "editor", date: "2026-09-14" },
          independentReview: { reviewerId: "validator", date: "2026-09-14" },
          playtest: null,
          status: "ready",
        },
      ],
    });
    expect(result.ok).toBe(true);

    const missingReview = {
      ...(result.ok ? result.value : {}),
      records: result.ok
        ? result.value.records.map(({ independentReview: _review, ...record }) => record)
        : [],
    };
    expect(validateEditorialManifest(missingReview).ok).toBe(false);
  });
  it("does not fall back to English", () => {
    const registry = createCatalogRegistry({ starters: [starter], daily: [], editorial: [] });
    expect(registry.getStarterManifest("ru")).toBeUndefined();
    expect(registry.getStarterManifest("en")?.language).toBe("en");
  });
});
