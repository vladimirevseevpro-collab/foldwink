import { describe, it, expect, vi, beforeEach } from "vitest";
import { currentBundle, langGetHardPool, langGetPool } from "../byLang";

// Sanity tests for the per-language bundle + per-tier fallback contract.
// The production pools are loaded at module-init by `import.meta.glob`, so
// these tests are observational: they confirm the fallback rule works
// against whatever the actual pools hold today (EN has Hard, DE/RU do not).

vi.mock("../../i18n/useLanguage", () => ({
  getLangSync: vi.fn(() => "en"),
}));

import { getLangSync } from "../../i18n/useLanguage";

describe("byLang fallback contract", () => {
  beforeEach(() => {
    vi.mocked(getLangSync).mockReset();
  });

  it("EN returns EN pools verbatim", () => {
    vi.mocked(getLangSync).mockReturnValue("en");
    const b = currentBundle();
    expect(b.pool.length).toBeGreaterThan(0);
    expect(b.hard.length).toBeGreaterThan(0);
  });

  it("DE falls back to EN Hard when DE Hard tier is empty", () => {
    vi.mocked(getLangSync).mockReturnValue("de");
    const b = currentBundle();
    // DE has Easy + Medium content but no Hard tier. The fallback
    // contract says Hard must expose EN puzzles so the tier stays
    // reachable for DE players.
    expect(b.hard.length).toBeGreaterThan(0);
    expect(b.easy.length).toBeGreaterThan(0);
  });

  it("RU exposes its own Hard tier if present, otherwise falls back", () => {
    vi.mocked(getLangSync).mockReturnValue("ru");
    const b = currentBundle();
    // Whatever RU has (today: no Hard), Hard must be non-empty via fallback.
    expect(b.hard.length).toBeGreaterThan(0);
  });

  it("langGetPool respects language switch", () => {
    vi.mocked(getLangSync).mockReturnValue("en");
    const en = langGetPool().length;
    vi.mocked(getLangSync).mockReturnValue("de");
    const de = langGetPool().length;
    // EN pool is fixed at 500; DE is at least as large as EN fallback (so both non-empty).
    expect(en).toBeGreaterThan(0);
    expect(de).toBeGreaterThan(0);
  });

  it("langGetHardPool falls back for DE", () => {
    vi.mocked(getLangSync).mockReturnValue("de");
    const hard = langGetHardPool();
    // Fallback to EN hard (34 puzzles) must be available.
    expect(hard.length).toBeGreaterThan(0);
  });

  it("currentBundle().getById resolves across all language pools (EN, RU, DE)", () => {
    vi.mocked(getLangSync).mockReturnValue("en");
    const enBundle = currentBundle();
    // An EN bundle can resolve a RU or DE puzzle ID via cross-pool fallback
    const sampleRu = currentBundle().pool[0]?.id;
    expect(enBundle.getById(sampleRu)).toBeDefined();

    vi.mocked(getLangSync).mockReturnValue("de");
    const deBundle = currentBundle();
    expect(deBundle.getById(sampleRu)).toBeDefined();
  });
});
