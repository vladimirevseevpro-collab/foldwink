import { describe, expect, it } from "vitest";
import { shouldOfferEmbeddedFullSize } from "../platform";

describe("shouldOfferEmbeddedFullSize", () => {
  it("offers a full-size launch only for an undismissed touch embed", () => {
    expect(
      shouldOfferEmbeddedFullSize({ embedded: true, coarsePointer: true, dismissed: false }),
    ).toBe(true);
    expect(
      shouldOfferEmbeddedFullSize({ embedded: false, coarsePointer: true, dismissed: false }),
    ).toBe(false);
    expect(
      shouldOfferEmbeddedFullSize({ embedded: true, coarsePointer: false, dismissed: false }),
    ).toBe(false);
    expect(
      shouldOfferEmbeddedFullSize({ embedded: true, coarsePointer: true, dismissed: true }),
    ).toBe(false);
  });
});
