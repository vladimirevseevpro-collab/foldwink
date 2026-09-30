import { describe, expect, it } from "vitest";
import {
  bucketDuration,
  createChallengeUrl,
  decodeChallengeToken,
  encodeChallengeToken,
  type ChallengePayloadV2,
} from "../challengeLink";

const payload: ChallengePayloadV2 = {
  v: 2,
  kind: "official-challenge",
  puzzle: {
    language: "de",
    puzzleId: "de-0042",
    lineageId: "de-0042",
    contentVersion: "2026-09-12",
  },
  rulesVersion: 1,
  creatorResult: {
    result: "win",
    mistakesUsed: 1,
    winkUsed: true,
    durationBucket: "1-3m",
  },
};

describe("versioned official challenge links", () => {
  it("round-trips a bounded v2 ref without answers", () => {
    const token = encodeChallengeToken(payload);
    const decoded = decodeChallengeToken(`#c=${token}`);
    expect(decoded).toEqual({ ok: true, payload });
    expect(token).not.toContain("groups");
  });

  it("preserves the canonical base path and stays inside the URL budget", () => {
    const result = createChallengeUrl(
      payload.puzzle,
      payload.creatorResult!,
      "https://neural-void.com/foldwink/?utm_source=test",
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.url).toMatch(/^https:\/\/neural-void\.com\/foldwink\/#c=/u);
    expect(result.bytes).toBeLessThanOrEqual(1_800);
  });

  it("rejects unknown versions, bad ranges and oversized input", () => {
    const unknown = encodeChallengeToken({
      ...payload,
      v: 99,
    } as unknown as ChallengePayloadV2);
    expect(decodeChallengeToken(unknown)).toEqual({ ok: false, code: "unsupported-version" });

    const badRange = encodeChallengeToken({
      ...payload,
      creatorResult: { ...payload.creatorResult!, mistakesUsed: 99 },
    });
    expect(decodeChallengeToken(badRange)).toEqual({ ok: false, code: "invalid-schema" });
    expect(decodeChallengeToken(`c=${"A".repeat(2_401)}`)).toEqual({
      ok: false,
      code: "payload-too-large",
    });
  });

  it("rejects malformed data without evaluating or mutating it", () => {
    expect(decodeChallengeToken("c=%E0%A4%A")).toEqual({
      ok: false,
      code: "invalid-encoding",
    });
    expect(decodeChallengeToken("c=not_base64!")).toEqual({
      ok: false,
      code: "invalid-encoding",
    });
  });

  it("coarsens shared duration instead of transmitting an exact timestamp", () => {
    expect(bucketDuration(59_999)).toBe("under-1m");
    expect(bucketDuration(60_000)).toBe("1-3m");
    expect(bucketDuration(300_000)).toBe("over-5m");
  });
});
