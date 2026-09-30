import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { RuntimeContentCatalog } from "./runtimeContent";

const ROOT = process.cwd();
const digest = async (body: string) => createHash("sha256").update(body).digest("hex");

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
    expect(catalog.getCatalogSize("en")).toBeUndefined();
    await catalog.ensureBoot("en");
    expect(catalog.getPool("en")).toHaveLength(30);
    expect(catalog.getCatalogSize("en")).toBe(1000);
    expect(catalog.getPuzzle("ru", "ru-0001")).toBeUndefined();

    await catalog.ensurePuzzle("en", "puzzle-0001");
    expect(catalog.getPuzzle("en", "puzzle-0001")?.id).toBe("puzzle-0001");
    expect(catalog.getPool("en").length).toBeGreaterThan(30);
    expect(catalog.getPool("en").length).toBeLessThanOrEqual(62);
    expect(catalog.getCatalogSize("en")).toBe(1000);
  });

  it("rejects a payload whose bytes do not match the manifest hash", async () => {
    const catalog = new RuntimeContentCatalog(localFetch(true), digest, "/");
    await expect(catalog.ensureBoot("en")).rejects.toMatchObject({
      code: "integrity",
    });
  });
});
