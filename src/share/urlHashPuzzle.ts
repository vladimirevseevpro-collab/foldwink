import type { Puzzle, PuzzleDifficulty, PuzzleGroup } from "../game/types/puzzle";

export const CUSTOM_PUZZLE_SCHEMA_VERSION = 2 as const;
export const CUSTOM_PUZZLE_URL_MAX_BYTES = 1_800;
export const CUSTOM_PUZZLE_TOKEN_MAX_CHARS = CUSTOM_PUZZLE_URL_MAX_BYTES - "#p=".length;
export const CUSTOM_PUZZLE_DECODED_MAX_BYTES = 32 * 1024;
export const CUSTOM_PUZZLE_TITLE_MAX_GRAPHEMES = 160;
export const CUSTOM_PUZZLE_CATEGORY_MAX_GRAPHEMES = 160;
export const CUSTOM_PUZZLE_HINT_MAX_GRAPHEMES = 160;
export const CUSTOM_PUZZLE_ITEM_MAX_GRAPHEMES = 120;

/** Compact board format used inside shared custom-puzzle payloads. */
export interface CompactSharedPuzzle {
  t: string;
  d?: PuzzleDifficulty;
  g: [
    { l: string; i: [string, string, string, string]; h?: string },
    { l: string; i: [string, string, string, string]; h?: string },
    { l: string; i: [string, string, string, string]; h?: string },
    { l: string; i: [string, string, string, string]; h?: string },
  ];
}

/** Versioned share contract. New links always encode this discriminated shape. */
export interface SharedPuzzlePayloadV2 {
  v: typeof CUSTOM_PUZZLE_SCHEMA_VERSION;
  kind: "custom-puzzle";
  board: CompactSharedPuzzle;
}

export type SharedPuzzleDecodeErrorCode =
  | "missing"
  | "payload-too-large"
  | "invalid-encoding"
  | "invalid-compression"
  | "invalid-json"
  | "unsupported-version"
  | "invalid-schema";

export type SharedPuzzleDecodeResult =
  | { ok: true; payload: SharedPuzzlePayloadV2 }
  | { ok: false; code: SharedPuzzleDecodeErrorCode };

type ValidatedBoard = { board: CompactSharedPuzzle; puzzle: Puzzle };

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/gu, "-").replace(/\//gu, "_").replace(/=+$/u, "");
}

function fromBase64Url(token: string): Uint8Array | null {
  if (!/^[A-Za-z0-9_-]+$/u.test(token) || token.length % 4 === 1) return null;
  let base64 = token.replace(/-/gu, "+").replace(/_/gu, "/");
  while (base64.length % 4 !== 0) base64 += "=";
  try {
    const binary = atob(base64);
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
  } catch {
    return null;
  }
}

function graphemeLength(value: string): number {
  if (typeof Intl.Segmenter === "function")
    return Array.from(new Intl.Segmenter().segment(value)).length;
  return Array.from(value).length;
}

function isDifficulty(value: unknown): value is PuzzleDifficulty {
  return value === "easy" || value === "medium" || value === "hard";
}

function hasTextWithin(value: unknown, maxGraphemes: number): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    graphemeLength(value.trim()) <= maxGraphemes
  );
}

function makePuzzleId(items: Set<string>): string {
  const input = Array.from(items).sort().join("|");
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index++) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `share-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function validateBoard(value: unknown, legacy = false): ValidatedBoard | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const board = value as Partial<CompactSharedPuzzle>;
  if (!hasTextWithin(board.t, CUSTOM_PUZZLE_TITLE_MAX_GRAPHEMES)) return null;
  if (!Array.isArray(board.g) || board.g.length !== 4) return null;
  if (!legacy && !isDifficulty(board.d)) return null;

  const difficulty = isDifficulty(board.d) ? board.d : "medium";
  const allItems = new Set<string>();
  const groups: PuzzleGroup[] = [];
  const compactGroups: Array<{ l: string; i: [string, string, string, string]; h?: string }> =
    [];

  for (let index = 0; index < 4; index++) {
    const group = board.g[index];
    if (!group || typeof group !== "object" || Array.isArray(group)) return null;
    if (!hasTextWithin(group.l, CUSTOM_PUZZLE_CATEGORY_MAX_GRAPHEMES)) return null;
    if (!Array.isArray(group.i) || group.i.length !== 4) return null;
    if (group.h !== undefined && !hasTextWithin(group.h, CUSTOM_PUZZLE_HINT_MAX_GRAPHEMES))
      return null;

    const items: string[] = [];
    for (const item of group.i) {
      if (!hasTextWithin(item, CUSTOM_PUZZLE_ITEM_MAX_GRAPHEMES)) return null;
      const clean = item.trim();
      if (allItems.has(clean)) return null;
      allItems.add(clean);
      items.push(clean);
    }
    const label = group.l.trim();
    const hint = group.h?.trim();
    const compactGroup = {
      l: label,
      i: [items[0], items[1], items[2], items[3]] as [string, string, string, string],
      ...(hint ? { h: hint } : {}),
    };
    compactGroups.push(compactGroup);
    groups.push({
      id: `g${index + 1}`,
      label,
      items: [items[0], items[1], items[2], items[3]],
      ...(hint ? { revealHint: hint } : {}),
    });
  }

  if (allItems.size !== 16) return null;
  return {
    board: { t: board.t.trim(), d: difficulty, g: compactGroups as CompactSharedPuzzle["g"] },
    puzzle: {
      id: makePuzzleId(allItems),
      title: board.t.trim(),
      difficulty,
      groups: [groups[0], groups[1], groups[2], groups[3]],
    },
  };
}

/** Converts a Foldwink puzzle to the compact board used in the v2 envelope. */
export function puzzleToCompact(puzzle: Puzzle): CompactSharedPuzzle {
  return {
    t: puzzle.title,
    d: puzzle.difficulty,
    g: puzzle.groups.map((group) => ({
      l: group.label,
      i: [...group.items],
      ...(group.revealHint ? { h: group.revealHint } : {}),
    })) as CompactSharedPuzzle["g"],
  };
}

/** Retained for callers of the original API; accepts either a legacy board or v2 envelope. */
export function validateAndBuildSharedPuzzle(data: unknown): Puzzle | null {
  return parsePayload(data)?.puzzle ?? null;
}

function parsePayload(
  value: unknown,
): { payload: SharedPuzzlePayloadV2; puzzle: Puzzle } | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  if ("v" in record) {
    if (record.v !== CUSTOM_PUZZLE_SCHEMA_VERSION || record.kind !== "custom-puzzle")
      return null;
    const validated = validateBoard(record.board, false);
    return validated
      ? {
          payload: {
            v: CUSTOM_PUZZLE_SCHEMA_VERSION,
            kind: "custom-puzzle",
            board: validated.board,
          },
          puzzle: validated.puzzle,
        }
      : null;
  }
  const legacy = validateBoard(value, true);
  return legacy
    ? {
        payload: {
          v: CUSTOM_PUZZLE_SCHEMA_VERSION,
          kind: "custom-puzzle",
          board: legacy.board,
        },
        puzzle: legacy.puzzle,
      }
    : null;
}

async function compressDeflate(text: string): Promise<Uint8Array> {
  const input = new TextEncoder().encode(text);
  if (typeof CompressionStream === "undefined") return input;
  const stream = new Blob([input.buffer])
    .stream()
    .pipeThrough(new CompressionStream("deflate"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/** Reads incrementally, cancelling immediately once the 32 KiB output bound is exceeded. */
async function decompressDeflate(
  bytes: Uint8Array,
): Promise<
  { ok: true; text: string } | { ok: false; code: "payload-too-large" | "invalid-compression" }
> {
  if (typeof DecompressionStream === "undefined") {
    if (bytes.byteLength > CUSTOM_PUZZLE_DECODED_MAX_BYTES)
      return { ok: false, code: "payload-too-large" };
    try {
      return { ok: true, text: new TextDecoder("utf-8", { fatal: true }).decode(bytes) };
    } catch {
      return { ok: false, code: "invalid-compression" };
    }
  }

  let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
  try {
    // Copy into an ArrayBuffer-backed view: Blob does not accept SharedArrayBuffer views.
    const input = new Blob([new Uint8Array(bytes)]).stream();
    reader = input.pipeThrough(new DecompressionStream("deflate")).getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      total += next.value.byteLength;
      if (total > CUSTOM_PUZZLE_DECODED_MAX_BYTES) {
        await reader.cancel("Foldwink custom puzzle exceeds decoded size limit");
        return { ok: false, code: "payload-too-large" };
      }
      chunks.push(next.value);
    }
    const output = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      output.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return { ok: true, text: new TextDecoder("utf-8", { fatal: true }).decode(output) };
  } catch {
    return { ok: false, code: "invalid-compression" };
  } finally {
    reader?.releaseLock();
  }
}

function extractToken(
  hashOrQuery: string,
):
  | { ok: true; token: string }
  | { ok: false; code: "missing" | "payload-too-large" | "invalid-encoding" } {
  let raw = hashOrQuery.trim();
  if (raw.startsWith("#") || raw.startsWith("?")) raw = raw.slice(1);
  try {
    raw = decodeURIComponent(raw);
  } catch {
    return { ok: false, code: "invalid-encoding" };
  }
  const match = raw.match(/(?:^|&)p=([^&]+)/u);
  const token = (match?.[1] ?? (raw.startsWith("p=") ? raw.slice(2) : raw)).trim();
  if (!token) return { ok: false, code: "missing" };
  if (token.length > CUSTOM_PUZZLE_TOKEN_MAX_CHARS)
    return { ok: false, code: "payload-too-large" };
  return { ok: true, token };
}

/** Decodes v2 links and legacy compact-board links into a normalized v2 payload. */
export async function decodeSharedPuzzleFromHash(
  hashOrQuery: string,
): Promise<SharedPuzzleDecodeResult> {
  const extracted = extractToken(hashOrQuery);
  if (!extracted.ok) return extracted;
  const bytes = fromBase64Url(extracted.token);
  if (!bytes) return { ok: false, code: "invalid-encoding" };
  const decompressed = await decompressDeflate(bytes);
  if (!decompressed.ok) {
    // The former encoder emitted raw UTF-8 when CompressionStream was absent.
    // Retain that narrow legacy path, but never use it for a versioned payload.
    if (
      decompressed.code === "invalid-compression" &&
      bytes.byteLength <= CUSTOM_PUZZLE_DECODED_MAX_BYTES
    ) {
      try {
        const rawData = JSON.parse(
          new TextDecoder("utf-8", { fatal: true }).decode(bytes),
        ) as unknown;
        if (
          rawData &&
          typeof rawData === "object" &&
          !Array.isArray(rawData) &&
          !("v" in rawData)
        ) {
          const legacy = parsePayload(rawData);
          if (legacy) return { ok: true, payload: legacy.payload };
        }
      } catch {
        // Preserve the compression error below.
      }
    }
    return decompressed;
  }
  try {
    const data = JSON.parse(decompressed.text) as unknown;
    if (!data || typeof data !== "object" || Array.isArray(data))
      return { ok: false, code: "invalid-schema" };
    const record = data as Record<string, unknown>;
    if ("v" in record && record.v !== CUSTOM_PUZZLE_SCHEMA_VERSION)
      return { ok: false, code: "unsupported-version" };
    const parsed = parsePayload(data);
    return parsed
      ? { ok: true, payload: parsed.payload }
      : { ok: false, code: "invalid-schema" };
  } catch {
    return { ok: false, code: "invalid-json" };
  }
}

/** Alias for consumers that prefer the decode-result naming convention. */
export const decodePuzzleFromHashResult = decodeSharedPuzzleFromHash;

/** Backwards-compatible Puzzle-or-null wrapper. */
export async function decodePuzzleFromHash(hashOrQuery: string): Promise<Puzzle | null> {
  const result = await decodeSharedPuzzleFromHash(hashOrQuery);
  return result.ok ? validateAndBuildSharedPuzzle(result.payload) : null;
}

export async function encodePuzzleToHash(puzzle: Puzzle): Promise<string> {
  const payload: SharedPuzzlePayloadV2 = {
    v: CUSTOM_PUZZLE_SCHEMA_VERSION,
    kind: "custom-puzzle",
    board: puzzleToCompact(puzzle),
  };
  if (!parsePayload(payload))
    throw new RangeError("Custom puzzle does not satisfy share-link bounds");
  const token = toBase64Url(await compressDeflate(JSON.stringify(payload)));
  if (token.length > CUSTOM_PUZZLE_TOKEN_MAX_CHARS)
    throw new RangeError("Custom puzzle share link exceeds the 1800-byte limit");
  return `p=${token}`;
}

export async function extractSharedPuzzleFromLocation(): Promise<Puzzle | null> {
  if (typeof window === "undefined") return null;
  if (window.location.hash) {
    const puzzle = await decodePuzzleFromHash(window.location.hash);
    if (puzzle) return puzzle;
  }
  return window.location.search ? decodePuzzleFromHash(window.location.search) : null;
}

export async function createShareUrl(puzzle: Puzzle, baseUrl = ""): Promise<string> {
  const hash = await encodePuzzleToHash(puzzle);
  const base =
    baseUrl ||
    (typeof window !== "undefined" ? window.location.origin + window.location.pathname : "");
  const url = `${base.split("#")[0].split("?")[0]}#${hash}`;
  if (new TextEncoder().encode(url).byteLength > CUSTOM_PUZZLE_URL_MAX_BYTES)
    throw new RangeError("Custom puzzle share URL exceeds the 1800-byte limit");
  return url;
}
