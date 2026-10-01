import type { PuzzleLanguage, PuzzleRef } from "../game/types/game";
import type { Puzzle } from "../game/types/puzzle";
import type { DailyManifest, EditorialManifest, StarterManifest } from "./catalog/types";
import {
  validateDailyManifest,
  validateEditorialManifest,
  validatePuzzleRef,
  validateStarterManifest,
} from "./catalog/validation";
import { installRuntimeCatalog } from "./catalog/registry";

export type RuntimeAsset = {
  id?: string;
  path: string;
  sha256: string;
  count: number;
  puzzleRefs: PuzzleRef[];
};

export type RuntimeManifest = {
  schemaVersion: 1;
  manifestVersion: "runtime-content-v1";
  language: PuzzleLanguage;
  contentVersion: string;
  boot: RuntimeAsset;
  archive: RuntimeAsset[];
  publishedRefs: PuzzleRef[];
  starters: StarterManifest;
  daily: DailyManifest;
  editorial: EditorialManifest;
};

type RuntimePayload = {
  schemaVersion: 1;
  language: PuzzleLanguage;
  contentVersion: string;
  puzzles: Array<{ ref: PuzzleRef; puzzle: Puzzle }>;
};

export type RuntimeContentFailureCode = "network" | "integrity" | "invalid" | "unavailable";

export class RuntimeContentError extends Error {
  constructor(
    readonly code: RuntimeContentFailureCode,
    message: string,
  ) {
    super(message);
    this.name = "RuntimeContentError";
  }
}

export type RuntimeFetch = (
  url: string,
) => Promise<{ ok: boolean; status: number; text: () => Promise<string> }>;
export type RuntimeHasher = (body: string) => Promise<string>;

const LANGUAGE_SET = new Set<PuzzleLanguage>(["en", "ru", "de"]);
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const sameRef = (left: PuzzleRef, right: PuzzleRef): boolean =>
  left.language === right.language &&
  left.puzzleId === right.puzzleId &&
  left.lineageId === right.lineageId &&
  left.contentVersion === right.contentVersion;
const matchesRef = (actual: PuzzleRef, expected: PuzzleRef | undefined): boolean =>
  expected !== undefined && sameRef(actual, expected);

function assetFrom(value: unknown, path: string): RuntimeAsset | undefined {
  if (!isRecord(value) || typeof value.path !== "string" || !value.path) return undefined;
  if (typeof value.sha256 !== "string" || !/^[a-f0-9]{64}$/u.test(value.sha256))
    return undefined;
  if (!Number.isInteger(value.count) || Number(value.count) < 1) return undefined;
  if (!Array.isArray(value.puzzleRefs) || value.puzzleRefs.length !== value.count)
    return undefined;
  const refs: PuzzleRef[] = [];
  for (const [index, ref] of value.puzzleRefs.entries()) {
    const validation = validatePuzzleRef(ref, `${path}.puzzleRefs[${index}]`);
    if (!validation.ok) return undefined;
    refs.push(validation.value);
  }
  return {
    ...(typeof value.id === "string" ? { id: value.id } : {}),
    path: value.path,
    sha256: value.sha256,
    count: value.count,
    puzzleRefs: refs,
  };
}

export function parseRuntimeManifest(input: unknown): RuntimeManifest {
  if (
    !isRecord(input) ||
    input.schemaVersion !== 1 ||
    input.manifestVersion !== "runtime-content-v1"
  )
    throw new RuntimeContentError("invalid", "Unsupported runtime manifest");
  if (
    !LANGUAGE_SET.has(input.language as PuzzleLanguage) ||
    typeof input.contentVersion !== "string" ||
    !input.contentVersion
  )
    throw new RuntimeContentError(
      "invalid",
      "Runtime manifest has an invalid language or content version",
    );
  const language = input.language as PuzzleLanguage;
  const boot = assetFrom(input.boot, "boot");
  if (!boot || boot.count !== 30)
    throw new RuntimeContentError(
      "invalid",
      "Runtime boot payload must contain 30 published boards",
    );
  if (!Array.isArray(input.archive))
    throw new RuntimeContentError("invalid", "Runtime archive list is missing");
  const archive = input.archive.map((asset, index) => assetFrom(asset, `archive[${index}]`));
  if (archive.some((asset) => !asset || asset.count > 32))
    throw new RuntimeContentError(
      "invalid",
      "Runtime archive chunk is invalid or exceeds 32 boards",
    );
  const allAssets = [boot, ...(archive as RuntimeAsset[])];
  const refs = allAssets.flatMap((asset) => asset.puzzleRefs);
  if (new Set(refs.map((ref) => ref.puzzleId)).size !== refs.length)
    throw new RuntimeContentError(
      "invalid",
      "Runtime manifest must describe unique boards",
    );
  if (
    refs.some((ref) => ref.language !== language || ref.contentVersion !== input.contentVersion)
  )
    throw new RuntimeContentError(
      "invalid",
      "Runtime manifest references another language or version",
    );
  if (!Array.isArray(input.publishedRefs) || input.publishedRefs.length !== 30)
    throw new RuntimeContentError(
      "invalid",
      "Runtime manifest published references are invalid",
    );
  const publishedRefs: PuzzleRef[] = [];
  for (const [index, ref] of input.publishedRefs.entries()) {
    const validation = validatePuzzleRef(ref, `publishedRefs[${index}]`);
    if (
      !validation.ok ||
      validation.value.language !== language ||
      validation.value.contentVersion !== input.contentVersion
    )
      throw new RuntimeContentError(
        "invalid",
        "Runtime manifest has an invalid published reference",
      );
    publishedRefs.push(validation.value);
  }
  if (
    new Set(publishedRefs.map((ref) => ref.puzzleId)).size !== 30 ||
    !boot.puzzleRefs.every((ref, index) => sameRef(ref, publishedRefs[index]!))
  )
    throw new RuntimeContentError(
      "invalid",
      "Runtime boot references do not match the published release",
    );
  const starters = validateStarterManifest(input.starters);
  const daily = validateDailyManifest(input.daily);
  const editorial = validateEditorialManifest(input.editorial);
  if (!starters.ok || !daily.ok || !editorial.ok)
    throw new RuntimeContentError(
      "invalid",
      "Runtime manifest includes an invalid selection catalog",
    );
  if (
    starters.value.language !== language ||
    starters.value.catalogVersion !== input.contentVersion ||
    daily.value.language !== language ||
    editorial.value.language !== language ||
    editorial.value.catalogVersion !== input.contentVersion
  )
    throw new RuntimeContentError(
      "integrity",
      "Runtime selection catalog does not match its language or version",
    );
  const editorialRefs = new Map(
    editorial.value.records.map((record) => [record.puzzleRef.puzzleId, record.puzzleRef]),
  );
  if (
    editorial.value.records.length !== 30 ||
    boot.puzzleRefs.some((ref) => !matchesRef(ref, editorialRefs.get(ref.puzzleId))) ||
    daily.value.entries.some(
      (entry) => !matchesRef(entry, editorialRefs.get(entry.puzzleId)),
    ) ||
    starters.value.entries.some(
      (entry) => !matchesRef(entry.puzzleRef, editorialRefs.get(entry.puzzleRef.puzzleId)),
    )
  )
    throw new RuntimeContentError(
      "integrity",
      "Runtime selection catalog does not match published references",
    );
  return {
    schemaVersion: 1,
    manifestVersion: "runtime-content-v1",
    language,
    contentVersion: input.contentVersion,
    boot,
    archive: archive as RuntimeAsset[],
    publishedRefs,
    starters: starters.value,
    daily: daily.value,
    editorial: editorial.value,
  };
}

function isPuzzle(value: unknown): value is Puzzle {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    !value.id ||
    typeof value.title !== "string" ||
    !value.title
  )
    return false;
  if (!["easy", "medium", "hard"].includes(String(value.difficulty))) return false;
  if (!Array.isArray(value.groups) || value.groups.length !== 4) return false;
  return value.groups.every((group) => {
    if (
      !isRecord(group) ||
      typeof group.id !== "string" ||
      !group.id ||
      typeof group.label !== "string" ||
      !group.label
    )
      return false;
    return (
      Array.isArray(group.items) &&
      group.items.length === 4 &&
      group.items.every((item) => typeof item === "string" && item.trim())
    );
  });
}

function parsePayload(
  input: unknown,
  manifest: RuntimeManifest,
  asset: RuntimeAsset,
): RuntimePayload {
  if (
    !isRecord(input) ||
    input.schemaVersion !== 1 ||
    input.language !== manifest.language ||
    input.contentVersion !== manifest.contentVersion ||
    !Array.isArray(input.puzzles)
  )
    throw new RuntimeContentError("invalid", "Runtime payload does not match its manifest");
  if (input.puzzles.length !== asset.count)
    throw new RuntimeContentError(
      "invalid",
      "Runtime payload count does not match its manifest",
    );
  const puzzles: RuntimePayload["puzzles"] = [];
  for (const [index, entry] of input.puzzles.entries()) {
    if (!isRecord(entry) || !isPuzzle(entry.puzzle))
      throw new RuntimeContentError("invalid", `Runtime payload puzzle ${index} is invalid`);
    const validation = validatePuzzleRef(entry.ref, `puzzles[${index}].ref`);
    const expected = asset.puzzleRefs[index];
    if (
      !validation.ok ||
      !expected ||
      !sameRef(validation.value, expected) ||
      entry.puzzle.id !== expected.puzzleId
    )
      throw new RuntimeContentError(
        "integrity",
        `Runtime payload reference ${index} does not match its manifest`,
      );
    puzzles.push({ ref: validation.value, puzzle: entry.puzzle as Puzzle });
  }
  return {
    schemaVersion: 1,
    language: manifest.language,
    contentVersion: manifest.contentVersion,
    puzzles,
  };
}

export async function sha256(body: string): Promise<string> {
  if (!globalThis.crypto?.subtle)
    throw new RuntimeContentError(
      "unavailable",
      "Web Crypto is unavailable for runtime content verification",
    );
  const digest = await globalThis.crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(body),
  );
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

function defaultFetch(url: string) {
  return fetch(url);
}

type LoadedLanguage = {
  manifest: RuntimeManifest;
  puzzles: Map<string, Puzzle>;
  loadedAssets: Set<string>;
};

export class RuntimeContentCatalog {
  private readonly loaded = new Map<PuzzleLanguage, LoadedLanguage>();
  private readonly bootLoads = new Map<PuzzleLanguage, Promise<void>>();
  private readonly assetLoads = new Map<string, Promise<void>>();

  constructor(
    private readonly fetcher: RuntimeFetch = defaultFetch,
    private readonly hasher: RuntimeHasher = sha256,
    private readonly baseUrl = import.meta.env.BASE_URL,
  ) {}

  private url(path: string): string {
    const base = this.baseUrl.endsWith("/") ? this.baseUrl : `${this.baseUrl}/`;
    return `${base}runtime-content/v1/${path.replace(/^\.\//u, "")}`;
  }

  private async json(url: string): Promise<{ body: string; value: unknown }> {
    let response: Awaited<ReturnType<RuntimeFetch>>;
    try {
      response = await this.fetcher(url);
    } catch (error) {
      throw new RuntimeContentError(
        "network",
        `Unable to load runtime content: ${String(error)}`,
      );
    }
    if (!response.ok)
      throw new RuntimeContentError(
        response.status === 404 ? "unavailable" : "network",
        `Runtime content request failed (${response.status})`,
      );
    const body = await response.text();
    try {
      return { body, value: JSON.parse(body) };
    } catch {
      throw new RuntimeContentError("invalid", "Runtime content is not valid JSON");
    }
  }

  async ensureBoot(language: PuzzleLanguage): Promise<void> {
    const pending = this.bootLoads.get(language);
    if (pending) return pending;
    const load = (async () => {
      const manifestResponse = await this.json(this.url(`manifest.${language}.json`));
      const manifest = parseRuntimeManifest(manifestResponse.value);
      if (manifest.language !== language)
        throw new RuntimeContentError(
          "integrity",
          "Runtime manifest was returned for another language",
        );
      this.loaded.set(language, { manifest, puzzles: new Map(), loadedAssets: new Set() });
      await this.loadAsset(language, manifest.boot);
      installRuntimeCatalog({
        starters: manifest.starters,
        daily: manifest.daily,
        editorial: manifest.editorial,
      });
    })();
    this.bootLoads.set(language, load);
    try {
      await load;
    } catch (error) {
      this.bootLoads.delete(language);
      this.loaded.delete(language);
      throw error;
    }
  }

  private async loadAsset(language: PuzzleLanguage, asset: RuntimeAsset): Promise<void> {
    const state = this.loaded.get(language);
    if (!state) throw new RuntimeContentError("unavailable", "Runtime manifest is not loaded");
    if (state.loadedAssets.has(asset.path)) return;
    const key = `${language}:${asset.path}`;
    const pending = this.assetLoads.get(key);
    if (pending) return pending;
    const load = (async () => {
      const response = await this.json(this.url(asset.path));
      const actual = await this.hasher(response.body);
      if (actual !== asset.sha256)
        throw new RuntimeContentError(
          "integrity",
          "Runtime payload hash does not match its manifest",
        );
      const payload = parsePayload(response.value, state.manifest, asset);
      for (const { puzzle } of payload.puzzles) state.puzzles.set(puzzle.id, puzzle);
      state.loadedAssets.add(asset.path);
    })();
    this.assetLoads.set(key, load);
    try {
      await load;
    } finally {
      this.assetLoads.delete(key);
    }
  }

  async ensurePuzzle(language: PuzzleLanguage, puzzleId: string): Promise<void> {
    await this.ensureBoot(language);
    const state = this.loaded.get(language)!;
    if (state.puzzles.has(puzzleId)) return;
    const asset = state.manifest.archive.find((candidate) =>
      candidate.puzzleRefs.some((ref) => ref.puzzleId === puzzleId),
    );
    if (!asset)
      throw new RuntimeContentError(
        "unavailable",
        `Puzzle ${puzzleId} is not published for ${language}`,
      );
    await this.loadAsset(language, asset);
  }

  /**
   * Bounded progression prefetch: at most one following archive asset per
   * completed/started route. A failed fetch leaves the current board intact
   * and is retried only by a later explicit progression step.
   */
  async ensureNextArchiveChunk(language: PuzzleLanguage): Promise<boolean> {
    await this.ensureBoot(language);
    const state = this.loaded.get(language)!;
    const next = state.manifest.archive.find((asset) => !state.loadedAssets.has(asset.path));
    if (!next) return false;
    await this.loadAsset(language, next);
    return true;
  }

  getPool(language: PuzzleLanguage): readonly Puzzle[] {
    return [...(this.loaded.get(language)?.puzzles.values() ?? [])].sort((a, b) =>
      a.id.localeCompare(b.id),
    );
  }

  getPuzzle(language: PuzzleLanguage, puzzleId: string): Puzzle | undefined {
    return this.loaded.get(language)?.puzzles.get(puzzleId);
  }

  isBootLoaded(language: PuzzleLanguage): boolean {
    return (
      this.loaded
        .get(language)
        ?.loadedAssets.has(this.loaded.get(language)?.manifest.boot.path ?? "") ?? false
    );
  }

  getContentVersion(language: PuzzleLanguage): string | undefined {
    return this.loaded.get(language)?.manifest.contentVersion;
  }

  /** Total playable boards described by the verified manifest, not just loaded chunks. */
  getCatalogSize(language: PuzzleLanguage): number | undefined {
    const manifest = this.loaded.get(language)?.manifest;
    return manifest
      ? manifest.boot.count + manifest.archive.reduce((total, asset) => total + asset.count, 0)
      : undefined;
  }
}
