import { describe, it, expect } from "vitest";
import {
  encodePuzzleToHash,
  decodePuzzleFromHash,
  createShareUrl,
  validateAndBuildSharedPuzzle,
} from "../urlHashPuzzle";
import type { Puzzle } from "../../game/types/puzzle";

const samplePuzzle: Puzzle = {
  id: "puzzle-test-01",
  title: "Coffee & Pastries",
  difficulty: "medium",
  groups: [
    { id: "g1", label: "Espresso Drinks", items: ["Latte", "Cappuccino", "Macchiato", "Americano"], revealHint: "COFFEE" },
    { id: "g2", label: "French Pastries", items: ["Croissant", "Éclair", "Macaron", "Brioche"] },
    { id: "g3", label: "Syrup Flavors", items: ["Vanilla", "Caramel", "Hazelnut", "Lavender"] },
    { id: "g4", label: "Barista Tools", items: ["Tamper", "Portafilter", "Pitcher", "Knockbox"] },
  ],
};

describe("urlHashPuzzle", () => {
  it("encodes puzzle to compact URL hash starting with p=eJ... or URL-safe base64", async () => {
    const hash = await encodePuzzleToHash(samplePuzzle);
    expect(hash.startsWith("p=")).toBe(true);
    // Base64 of zlib starts with eJ
    expect(hash.includes("eJ")).toBe(true);
  });

  it("round-trips encode and decode losslessly", async () => {
    const hash = await encodePuzzleToHash(samplePuzzle);
    const decoded = await decodePuzzleFromHash(`#${hash}`);

    expect(decoded).not.toBeNull();
    expect(decoded?.title).toBe(samplePuzzle.title);
    expect(decoded?.difficulty).toBe(samplePuzzle.difficulty);
    expect(decoded?.groups.length).toBe(4);

    for (let i = 0; i < 4; i++) {
      expect(decoded?.groups[i].label).toBe(samplePuzzle.groups[i].label);
      expect(decoded?.groups[i].items).toEqual(samplePuzzle.groups[i].items);
      if (samplePuzzle.groups[i].revealHint) {
        expect(decoded?.groups[i].revealHint).toBe(samplePuzzle.groups[i].revealHint);
      }
    }
  });

  it("creates full shareable URL with origin and path", async () => {
    const url = await createShareUrl(samplePuzzle, "https://foldwink.com/play");
    expect(url.startsWith("https://foldwink.com/play#p=")).toBe(true);
  });

  it("safely rejects corrupt, malformed, or incomplete payload", async () => {
    expect(await decodePuzzleFromHash("p=not-a-valid-base64-string!!")).toBeNull();
    expect(await decodePuzzleFromHash("p=")).toBeNull();
    expect(await decodePuzzleFromHash("")).toBeNull();
  });

  it("validates 4x4 group constraints and rejects duplicate items", () => {
    // Missing one group (only 3 groups)
    const invalid3Groups = {
      t: "Broken",
      g: [
        { l: "G1", i: ["a", "b", "c", "d"] },
        { l: "G2", i: ["e", "f", "g", "h"] },
        { l: "G3", i: ["i", "j", "k", "l"] },
      ],
    };
    expect(validateAndBuildSharedPuzzle(invalid3Groups)).toBeNull();

    // Duplicate item "a" in two different groups
    const duplicateItem = {
      t: "Duplicate",
      g: [
        { l: "G1", i: ["a", "b", "c", "d"] },
        { l: "G2", i: ["a", "f", "g", "h"] },
        { l: "G3", i: ["i", "j", "k", "l"] },
        { l: "G4", i: ["m", "n", "o", "p"] },
      ],
    };
    expect(validateAndBuildSharedPuzzle(duplicateItem)).toBeNull();
  });
});
