import type { Puzzle, PuzzleDifficulty, PuzzleGroup } from "../game/types/puzzle";

/**
 * Compact serializable format for zero-backend URL sharing
 */
export interface CompactSharedPuzzle {
  t: string; // title
  d?: PuzzleDifficulty; // difficulty (defaults to "medium")
  g: [
    { l: string; i: [string, string, string, string]; h?: string },
    { l: string; i: [string, string, string, string]; h?: string },
    { l: string; i: [string, string, string, string]; h?: string },
    { l: string; i: [string, string, string, string]; h?: string },
  ];
}

function toBase64Url(uint8Array: Uint8Array): string {
  let binary = "";
  const len = uint8Array.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(str: string): Uint8Array {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4 !== 0) {
    base64 += "=";
  }
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Compresses data using native Web Stream Deflate compression.
 */
async function compressDeflate(text: string): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const input = encoder.encode(text);

  if (typeof CompressionStream !== "undefined") {
    const cs = new CompressionStream("deflate");
    const writer = cs.writable.getWriter();
    await writer.write(input);
    await writer.close();
    const buffer = await new Response(cs.readable).arrayBuffer();
    return new Uint8Array(buffer);
  }

  // Fallback: raw UTF-8 bytes if CompressionStream is absent
  return input;
}

/**
 * Decompresses data using native Web Stream Deflate decompression.
 */
async function decompressDeflate(bytes: Uint8Array): Promise<string> {
  if (typeof DecompressionStream !== "undefined") {
    try {
      const ds = new DecompressionStream("deflate");
      const writer = ds.writable.getWriter();
      await writer.write(bytes as unknown as BufferSource);
      await writer.close();
      const text = await new Response(ds.readable).text();
      return text;
    } catch {
      // If decompression fails, try decoding as raw UTF-8 (fallback)
      return new TextDecoder().decode(bytes);
    }
  }

  return new TextDecoder().decode(bytes);
}

/**
 * Convert a Foldwink Puzzle to compact payload format
 */
export function puzzleToCompact(puzzle: Puzzle): CompactSharedPuzzle {
  return {
    t: puzzle.title,
    d: puzzle.difficulty,
    g: [
      {
        l: puzzle.groups[0].label,
        i: [...puzzle.groups[0].items] as [string, string, string, string],
        ...(puzzle.groups[0].revealHint ? { h: puzzle.groups[0].revealHint } : {}),
      },
      {
        l: puzzle.groups[1].label,
        i: [...puzzle.groups[1].items] as [string, string, string, string],
        ...(puzzle.groups[1].revealHint ? { h: puzzle.groups[1].revealHint } : {}),
      },
      {
        l: puzzle.groups[2].label,
        i: [...puzzle.groups[2].items] as [string, string, string, string],
        ...(puzzle.groups[2].revealHint ? { h: puzzle.groups[2].revealHint } : {}),
      },
      {
        l: puzzle.groups[3].label,
        i: [...puzzle.groups[3].items] as [string, string, string, string],
        ...(puzzle.groups[3].revealHint ? { h: puzzle.groups[3].revealHint } : {}),
      },
    ],
  };
}

/**
 * Validates whether parsed JSON meets strict 4x4 Foldwink puzzle invariants.
 */
export function validateAndBuildSharedPuzzle(data: unknown): Puzzle | null {
  if (!data || typeof data !== "object") return null;
  const obj = data as Partial<CompactSharedPuzzle>;

  if (typeof obj.t !== "string" || !obj.t.trim()) return null;
  if (!Array.isArray(obj.g) || obj.g.length !== 4) return null;

  const difficulty: PuzzleDifficulty =
    obj.d === "easy" || obj.d === "medium" || obj.d === "hard" ? obj.d : "medium";

  const allItems = new Set<string>();
  const groups: PuzzleGroup[] = [];

  for (let idx = 0; idx < 4; idx++) {
    const g = obj.g[idx];
    if (!g || typeof g !== "object") return null;
    if (typeof g.l !== "string" || !g.l.trim()) return null;
    if (!Array.isArray(g.i) || g.i.length !== 4) return null;

    const groupItems: string[] = [];
    for (const it of g.i) {
      if (typeof it !== "string") return null;
      const clean = it.trim();
      if (!clean) return null;
      if (allItems.has(clean)) return null; // Duplicate item across puzzle
      allItems.add(clean);
      groupItems.push(clean);
    }

    groups.push({
      id: `g${idx + 1}`,
      label: g.l.trim(),
      items: [groupItems[0], groupItems[1], groupItems[2], groupItems[3]],
      ...(typeof g.h === "string" && g.h.trim() ? { revealHint: g.h.trim() } : {}),
    });
  }

  if (allItems.size !== 16) return null;

  // Generate deterministic custom ID
  const hash = Array.from(allItems).sort().join("|");
  let h = 0x811c9dc5;
  for (let i = 0; i < hash.length; i++) {
    h ^= hash.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  const id = `share-${(h >>> 0).toString(16).padStart(8, "0")}`;

  return {
    id,
    title: obj.t.trim(),
    difficulty,
    groups: [groups[0], groups[1], groups[2], groups[3]],
  };
}

/**
 * Encodes a puzzle into an asynchronous compressed URL hash string (#p=eJy...)
 */
export async function encodePuzzleToHash(puzzle: Puzzle): Promise<string> {
  const compact = puzzleToCompact(puzzle);
  const json = JSON.stringify(compact);
  const compressed = await compressDeflate(json);
  const b64 = toBase64Url(compressed);
  return `p=${b64}`;
}

/**
 * Decodes a puzzle from a URL hash string (handles #p=eJy... or p=eJy...)
 */
export async function decodePuzzleFromHash(hashOrQuery: string): Promise<Puzzle | null> {
  try {
    let raw = hashOrQuery.trim();
    if (raw.startsWith("#")) raw = raw.slice(1);
    if (raw.startsWith("?")) raw = raw.slice(1);

    const match = raw.match(/(?:^|&)p=([^&]+)/);
    const token = match ? match[1] : raw;
    if (!token) return null;

    const bytes = fromBase64Url(token);
    const json = await decompressDeflate(bytes);
    const data = JSON.parse(json) as unknown;
    return validateAndBuildSharedPuzzle(data);
  } catch {
    return null;
  }
}

/**
 * Utility to extract shared puzzle from window location if present.
 */
export async function extractSharedPuzzleFromLocation(): Promise<Puzzle | null> {
  if (typeof window === "undefined") return null;

  // Check URL hash first (#p=...)
  if (window.location.hash) {
    const p = await decodePuzzleFromHash(window.location.hash);
    if (p) return p;
  }

  // Check URL search params (?p=...)
  if (window.location.search) {
    const p = await decodePuzzleFromHash(window.location.search);
    if (p) return p;
  }

  return null;
}

/**
 * Generate full shareable URL
 */
export async function createShareUrl(puzzle: Puzzle, baseUrl: string = ""): Promise<string> {
  const hash = await encodePuzzleToHash(puzzle);
  const base = baseUrl || (typeof window !== "undefined" ? window.location.origin + window.location.pathname : "");
  const cleanBase = base.split("#")[0].split("?")[0];
  return `${cleanBase}#${hash}`;
}
