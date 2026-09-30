import { describe, expect, it } from "vitest";
import { diagnosticFingerprint } from "../diagnosticSerialization";

describe("diagnosticFingerprint", () => {
  it("distinguishes typed values that look alike in a human-readable export", () => {
    expect(diagnosticFingerprint({ x: Number.NaN })).not.toBe(
      diagnosticFingerprint({ x: "NaN" }),
    );
    expect(diagnosticFingerprint({ x: 1n })).not.toBe(diagnosticFingerprint({ x: "1n" }));
    expect(diagnosticFingerprint({ x: -0 })).not.toBe(diagnosticFingerprint({ x: 0 }));
  });

  it("is stable across object key order", () => {
    expect(diagnosticFingerprint({ b: 2, a: 1 })).toBe(diagnosticFingerprint({ a: 1, b: 2 }));
  });
});
