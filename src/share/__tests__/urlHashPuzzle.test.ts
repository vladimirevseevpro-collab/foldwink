import { describe, expect, it } from "vitest";
import {
  CUSTOM_PUZZLE_DECODED_MAX_BYTES,
  CUSTOM_PUZZLE_TOKEN_MAX_CHARS,
  decodePuzzleFromHash,
  decodeSharedPuzzleFromHash,
  encodePuzzleToHash,
  validateAndBuildSharedPuzzle,
} from "../urlHashPuzzle";
import type { Puzzle } from "../../game/types/puzzle";

const samplePuzzle: Puzzle = {
  id: "puzzle-test-01",
  title: "Coffee & Pastries",
  difficulty: "medium",
  groups: [
    {
      id: "g1",
      label: "Espresso Drinks",
      items: ["Latte", "Cappuccino", "Macchiato", "Americano"],
      revealHint: "COFFEE",
    },
    {
      id: "g2",
      label: "French Pastries",
      items: ["Croissant", "Éclair", "Macaron", "Brioche"],
    },
    { id: "g3", label: "Syrup Flavors", items: ["Vanilla", "Caramel", "Hazelnut", "Lavender"] },
    {
      id: "g4",
      label: "Barista Tools",
      items: ["Tamper", "Portafilter", "Pitcher", "Knockbox"],
    },
  ],
};

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/gu, "-").replace(/\//gu, "_").replace(/=+$/u, "");
}

async function deflatePayload(value: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  const stream = new Blob([bytes.buffer])
    .stream()
    .pipeThrough(new CompressionStream("deflate"));
  return `p=${toBase64Url(new Uint8Array(await new Response(stream).arrayBuffer()))}`;
}

describe("urlHashPuzzle", () => {
  it("writes v2 and round-trips it through the compatibility wrapper", async () => {
    const hash = await encodePuzzleToHash(samplePuzzle);
    const result = await decodeSharedPuzzleFromHash(`#${hash}`);
    expect(result).toMatchObject({ ok: true, payload: { v: 2, kind: "custom-puzzle" } });
    const decoded = await decodePuzzleFromHash(`#${hash}`);
    expect(decoded).toMatchObject({ title: samplePuzzle.title, difficulty: "medium" });
    expect(decoded?.groups.map((group) => group.items)).toEqual(
      samplePuzzle.groups.map((group) => group.items),
    );
  });

  it("normalizes legacy compact boards, including their medium default", async () => {
    const legacy = {
      t: "Legacy",
      g: samplePuzzle.groups.map(({ label: l, items: i }) => ({ l, i })),
    };
    const result = await decodeSharedPuzzleFromHash(await deflatePayload(legacy));
    expect(result).toMatchObject({
      ok: true,
      payload: { v: 2, kind: "custom-puzzle", board: { d: "medium" } },
    });
    const rawLegacy = `p=${toBase64Url(new TextEncoder().encode(JSON.stringify(legacy)))}`;
    expect(await decodePuzzleFromHash(rawLegacy)).toMatchObject({
      title: "Legacy",
      difficulty: "medium",
    });
  });

  it("reports transport, version, schema and malformed compression errors", async () => {
    expect(await decodeSharedPuzzleFromHash("p=")).toEqual({ ok: false, code: "missing" });
    expect(await decodeSharedPuzzleFromHash("p=bad!!")).toEqual({
      ok: false,
      code: "invalid-encoding",
    });
    expect(
      await decodeSharedPuzzleFromHash(`p=${"a".repeat(CUSTOM_PUZZLE_TOKEN_MAX_CHARS + 1)}`),
    ).toEqual({ ok: false, code: "payload-too-large" });
    expect(
      await decodeSharedPuzzleFromHash(
        await deflatePayload({ v: 99, kind: "custom-puzzle", board: {} }),
      ),
    ).toEqual({ ok: false, code: "unsupported-version" });
    expect(await decodeSharedPuzzleFromHash(await deflatePayload("not an object"))).toEqual({
      ok: false,
      code: "invalid-schema",
    });
    const malformedCompression = await decodeSharedPuzzleFromHash(
      `p=${toBase64Url(new Uint8Array([0, 1, 2, 3]))}`,
    );
    expect(malformedCompression).toEqual({ ok: false, code: "invalid-compression" });
  });

  it("enforces exact 4x4 unique trimmed items and v2 field bounds", () => {
    const board = {
      t: "Valid",
      d: "medium",
      g: samplePuzzle.groups.map(({ label: l, items: i }) => ({ l, i })),
    };
    expect(validateAndBuildSharedPuzzle({ v: 2, kind: "custom-puzzle", board })).not.toBeNull();
    expect(
      validateAndBuildSharedPuzzle({
        v: 2,
        kind: "custom-puzzle",
        board: { ...board, d: "unknown" },
      }),
    ).toBeNull();
    const duplicate = structuredClone(board);
    duplicate.g[1].i[0] = duplicate.g[0].i[0];
    expect(
      validateAndBuildSharedPuzzle({ v: 2, kind: "custom-puzzle", board: duplicate }),
    ).toBeNull();
    expect(
      validateAndBuildSharedPuzzle({
        v: 2,
        kind: "custom-puzzle",
        board: { ...board, t: "x".repeat(161) },
      }),
    ).toBeNull();
    const longCategory = structuredClone(board);
    longCategory.g[0].l = "x".repeat(161);
    expect(
      validateAndBuildSharedPuzzle({ v: 2, kind: "custom-puzzle", board: longCategory }),
    ).toBeNull();
    const longHint = structuredClone(board);
    Object.assign(longHint.g[0], { h: "x".repeat(161) });
    expect(
      validateAndBuildSharedPuzzle({ v: 2, kind: "custom-puzzle", board: longHint }),
    ).toBeNull();
    const longItem = structuredClone(board);
    longItem.g[0].i[0] = "x".repeat(121);
    expect(
      validateAndBuildSharedPuzzle({ v: 2, kind: "custom-puzzle", board: longItem }),
    ).toBeNull();
  });

  it("stops a decompression bomb at the decoded 32 KiB boundary", async () => {
    const oversized = "x".repeat(CUSTOM_PUZZLE_DECODED_MAX_BYTES + 1);
    expect(await decodeSharedPuzzleFromHash(await deflatePayload(oversized))).toEqual({
      ok: false,
      code: "payload-too-large",
    });
  });
});
