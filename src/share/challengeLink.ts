import type { GameResult, PuzzleRef } from "../game/types/game";

export const CHALLENGE_SCHEMA_VERSION = 2 as const;
export const CHALLENGE_RULES_VERSION = 1 as const;
export const CHALLENGE_URL_MAX_BYTES = 1_800;
const CHALLENGE_TOKEN_MAX_CHARS = 2_400;

export type DurationBucket = "under-1m" | "1-3m" | "3-5m" | "over-5m";

export interface ChallengeCreatorResult {
  result: GameResult;
  mistakesUsed: number;
  winkUsed: boolean;
  durationBucket?: DurationBucket;
}

export interface ChallengePayloadV2 {
  v: typeof CHALLENGE_SCHEMA_VERSION;
  kind: "official-challenge";
  puzzle: PuzzleRef;
  rulesVersion: typeof CHALLENGE_RULES_VERSION;
  creatorResult?: ChallengeCreatorResult;
}

export type ChallengeDecodeErrorCode =
  | "missing"
  | "payload-too-large"
  | "invalid-encoding"
  | "invalid-json"
  | "unsupported-version"
  | "invalid-schema";

export type ChallengeDecodeResult =
  | { ok: true; payload: ChallengePayloadV2 }
  | { ok: false; code: ChallengeDecodeErrorCode };

export type ChallengeUrlResult =
  | { ok: true; url: string; payload: ChallengePayloadV2; bytes: number }
  | { ok: false; code: "payload-too-large"; bytes: number; maxBytes: number };

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function isSafeRefPart(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= 128 &&
    /^[a-z0-9._:-]+$/iu.test(value)
  );
}

function isPuzzleRef(value: unknown): value is PuzzleRef {
  if (!isRecord(value)) return false;
  return (
    (value.language === "en" || value.language === "ru" || value.language === "de") &&
    isSafeRefPart(value.puzzleId) &&
    isSafeRefPart(value.lineageId) &&
    isSafeRefPart(value.contentVersion)
  );
}

function isCreatorResult(value: unknown): value is ChallengeCreatorResult {
  if (!isRecord(value)) return false;
  const bucket = value.durationBucket;
  return (
    (value.result === "win" || value.result === "loss") &&
    Number.isInteger(value.mistakesUsed) &&
    Number(value.mistakesUsed) >= 0 &&
    Number(value.mistakesUsed) <= 4 &&
    typeof value.winkUsed === "boolean" &&
    (bucket === undefined ||
      bucket === "under-1m" ||
      bucket === "1-3m" ||
      bucket === "3-5m" ||
      bucket === "over-5m")
  );
}

export function validateChallengePayload(value: unknown): ChallengeDecodeResult {
  if (!isRecord(value)) return { ok: false, code: "invalid-schema" };
  if (value.v !== CHALLENGE_SCHEMA_VERSION) {
    return { ok: false, code: "unsupported-version" };
  }
  if (
    value.kind !== "official-challenge" ||
    value.rulesVersion !== CHALLENGE_RULES_VERSION ||
    !isPuzzleRef(value.puzzle) ||
    (value.creatorResult !== undefined && !isCreatorResult(value.creatorResult))
  ) {
    return { ok: false, code: "invalid-schema" };
  }
  return { ok: true, payload: value as unknown as ChallengePayloadV2 };
}

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  const base64 =
    typeof btoa === "function" ? btoa(binary) : Buffer.from(bytes).toString("base64");
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/u, "");
}

function fromBase64Url(token: string): string | null {
  if (!/^[A-Za-z0-9_-]+$/u.test(token)) return null;
  let base64 = token.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4 !== 0) base64 += "=";
  try {
    const binary =
      typeof atob === "function"
        ? atob(base64)
        : Buffer.from(base64, "base64").toString("binary");
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
}

export function bucketDuration(durationMs: number): DurationBucket {
  if (durationMs < 60_000) return "under-1m";
  if (durationMs < 180_000) return "1-3m";
  if (durationMs < 300_000) return "3-5m";
  return "over-5m";
}

export function encodeChallengeToken(payload: ChallengePayloadV2): string {
  return toBase64Url(JSON.stringify(payload));
}

export function decodeChallengeToken(raw: string): ChallengeDecodeResult {
  let token = raw.trim();
  if (token.startsWith("#") || token.startsWith("?")) token = token.slice(1);
  const match = token.match(/(?:^|&)c=([^&]+)/u);
  token = match?.[1] ?? (token.startsWith("c=") ? token.slice(2) : token);
  if (!token) return { ok: false, code: "missing" };
  if (token.length > CHALLENGE_TOKEN_MAX_CHARS) {
    return { ok: false, code: "payload-too-large" };
  }
  try {
    token = decodeURIComponent(token);
  } catch {
    return { ok: false, code: "invalid-encoding" };
  }
  const json = fromBase64Url(token);
  if (json === null) return { ok: false, code: "invalid-encoding" };
  try {
    return validateChallengePayload(JSON.parse(json) as unknown);
  } catch {
    return { ok: false, code: "invalid-json" };
  }
}

export function createChallengeUrl(
  puzzle: PuzzleRef,
  creatorResult: ChallengeCreatorResult,
  baseUrl = "",
): ChallengeUrlResult {
  const payload: ChallengePayloadV2 = {
    v: CHALLENGE_SCHEMA_VERSION,
    kind: "official-challenge",
    puzzle,
    rulesVersion: CHALLENGE_RULES_VERSION,
    creatorResult,
  };
  const token = encodeChallengeToken(payload);
  const base =
    baseUrl ||
    (typeof window !== "undefined" ? window.location.origin + window.location.pathname : "");
  const url = `${base.split("#")[0].split("?")[0]}#c=${token}`;
  const bytes = new TextEncoder().encode(url).byteLength;
  return bytes <= CHALLENGE_URL_MAX_BYTES
    ? { ok: true, url, payload, bytes }
    : { ok: false, code: "payload-too-large", bytes, maxBytes: CHALLENGE_URL_MAX_BYTES };
}
