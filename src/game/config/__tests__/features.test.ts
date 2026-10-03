import { describe, expect, it } from "vitest";
import { ENABLE_ARCHIVIST_LAYER } from "../features";

describe("feature flags", () => {
  it("enables the archivist layer by default", () => {
    expect(ENABLE_ARCHIVIST_LAYER).toBe(true);
  });
});
