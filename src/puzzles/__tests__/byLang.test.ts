import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import { currentBundle, ensureLangLoaded, langGetHardPool, langGetPool } from "../byLang";

// Sanity tests for the strict per-language bundle contract.
// Runtime content is fetched on demand. Keep this test entirely local while
// exercising the checked-in manifest/payload contract.

vi.mock("../../i18n/useLanguage", () => ({
  getLangSync: vi.fn(() => "en"),
}));

import { getLangSync } from "../../i18n/useLanguage";

describe("byLang strict locale contract", () => {
  beforeAll(async () => {
    vi.stubGlobal("fetch", async (url: string) => {
      const relative = url.replace(/^\.?\//u, "");
      const body = await readFile(join(process.cwd(), "public", relative), "utf8");
      return { ok: true, status: 200, text: async () => body };
    });
    await Promise.all([ensureLangLoaded("en"), ensureLangLoaded("de"), ensureLangLoaded("ru")]);
  });

  beforeEach(() => {
    vi.mocked(getLangSync).mockReset();
  });

  it("EN returns EN pools verbatim", () => {
    vi.mocked(getLangSync).mockReturnValue("en");
    const b = currentBundle();
    expect(b.pool.length).toBeGreaterThan(0);
    expect(b.hard.length).toBeGreaterThan(0);
  });

  it("DE does not expose another language's pool", () => {
    vi.mocked(getLangSync).mockReturnValue("de");
    const b = currentBundle();
    expect(b.easy.length).toBeGreaterThan(0);
    expect(b.pool.every((puzzle) => puzzle.id.startsWith("de-"))).toBe(true);
  });

  it("RU only exposes its own boot boards", () => {
    vi.mocked(getLangSync).mockReturnValue("ru");
    expect(currentBundle().pool.every((puzzle) => puzzle.id.startsWith("ru-"))).toBe(true);
  });

  it("langGetPool respects language switch", () => {
    vi.mocked(getLangSync).mockReturnValue("en");
    const en = langGetPool().length;
    vi.mocked(getLangSync).mockReturnValue("de");
    const de = langGetPool().length;
    expect(en).toBeGreaterThan(0);
    expect(de).toBeGreaterThan(0);
  });

  it("langGetHardPool remains selected-language only for DE", () => {
    vi.mocked(getLangSync).mockReturnValue("de");
    const hard = langGetHardPool();
    expect(hard.every((puzzle) => puzzle.id.startsWith("de-"))).toBe(true);
  });

  it("getById never resolves a puzzle from another language", () => {
    vi.mocked(getLangSync).mockReturnValue("en");
    const enBundle = currentBundle();
    vi.mocked(getLangSync).mockReturnValue("de");
    const deBundle = currentBundle();
    const sampleDe = deBundle.pool[0]?.id;
    expect(sampleDe).toBeDefined();

    vi.mocked(getLangSync).mockReturnValue("en");
    expect(enBundle.getById(sampleDe!)).toBeUndefined();
  });
});
