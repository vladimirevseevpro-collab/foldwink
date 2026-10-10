import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getDailyEntry } from "./catalog";
import { RuntimeContentCatalog } from "./runtimeContent";

const ROOT = process.cwd();
const digest = async (body: string) => createHash("sha256").update(body).digest("hex");

async function sourcePoolSize(language: "en" | "ru" | "de"): Promise<number> {
  const directory =
    language === "en" ? join(ROOT, "puzzles", "pool") : join(ROOT, "puzzles", language, "pool");
  return (await readdir(directory)).filter((file) => file.endsWith(".json")).length;
}

function localFetch(tamper = false) {
  return async (url: string) => {
    const relative = url.replace(/^\/?/u, "");
    const body = await readFile(join(ROOT, "public", relative), "utf8");
    return {
      ok: true,
      status: 200,
      text: async () => (tamper && /boot\.en\./u.test(url) ? `${body} ` : body),
    };
  };
}

describe("runtime content catalog", () => {
  it("loads only the selected boot payload, then its requested archive chunk", async () => {
    const catalog = new RuntimeContentCatalog(localFetch(), digest, "/");
    const poolSize = await sourcePoolSize("en");
    expect(catalog.getCatalogSize("en")).toBeUndefined();
    await catalog.ensureBoot("en");
    expect(catalog.getPool("en")).toHaveLength(30);
    expect(catalog.getCatalogSize("en")).toBe(poolSize);
    expect(catalog.getPuzzle("ru", "ru-0001")).toBeUndefined();

    await catalog.ensurePuzzle("en", "puzzle-0001");
    expect(catalog.getPuzzle("en", "puzzle-0001")?.id).toBe("puzzle-0001");
    expect(catalog.getPool("en").length).toBeGreaterThan(30);
    expect(catalog.getPool("en").length).toBeLessThanOrEqual(62);
    expect(catalog.getCatalogSize("en")).toBe(poolSize);
  });

  it("resolves daily entries across every published schedule", async () => {
    const catalog = new RuntimeContentCatalog(localFetch(), digest, "/");
    await catalog.ensureBoot("en");
    expect(getDailyEntry("en", "2026-09-14")?.puzzleId).toBe("puzzle-0004");
    expect(getDailyEntry("en", "2026-12-12")?.scheduleVersion).toBe(
      "daily-2026-10-14-2026-12-12-v1",
    );
    expect(getDailyEntry("en", "2026-12-13")).toBeUndefined();
  });

  it("rejects a payload whose bytes do not match the manifest hash", async () => {
    const catalog = new RuntimeContentCatalog(localFetch(true), digest, "/");
    await expect(catalog.ensureBoot("en")).rejects.toMatchObject({
      code: "integrity",
    });
  });
});
