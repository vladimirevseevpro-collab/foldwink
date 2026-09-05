import { describe, it, expect } from "vitest";
import {
  PALIMPSEST_EN,
  PALIMPSEST_RU,
  PALIMPSEST_DE,
  getPalimpsestPuzzle,
  findMatchingPalimpsestGroup,
  isPalimpsestOneAway,
  type PalimpsestPuzzle,
} from "../palimpsest";
import { strings, SUPPORTED_LANGS } from "../../i18n/strings";

function verifyOrthogonalPuzzle(puzzle: PalimpsestPuzzle) {
  // 1. Must contain exactly 16 unique words
  expect(puzzle.allWords.length).toBe(16);
  expect(new Set(puzzle.allWords).size).toBe(16);

  // 2. Obverse must contain 4 groups of 4 disjoint items covering allWords
  const obverseItems = puzzle.obverse.groups.flatMap((g) => g.items);
  expect(obverseItems.length).toBe(16);
  expect(new Set(obverseItems).size).toBe(16);
  expect(new Set(obverseItems)).toEqual(new Set(puzzle.allWords));

  // 3. Reverse must contain 4 groups of 4 disjoint items covering allWords
  const reverseItems = puzzle.reverse.groups.flatMap((g) => g.items);
  expect(reverseItems.length).toBe(16);
  expect(new Set(reverseItems).size).toBe(16);
  expect(new Set(reverseItems)).toEqual(new Set(puzzle.allWords));

  // 4. Critical Palimpsest Orthogonality Law:
  // Every group in Obverse must share exactly 1 word with every group in Reverse!
  for (const obs of puzzle.obverse.groups) {
    for (const rev of puzzle.reverse.groups) {
      const intersection = obs.items.filter((item) => rev.items.includes(item));
      expect(intersection.length).toBe(1);
    }
  }
}

describe("Palimpsest Dual-Layer Engine", () => {
  it("satisfies 100% orthogonality for English Palimpsest", () => {
    verifyOrthogonalPuzzle(PALIMPSEST_EN);
  });

  it("satisfies 100% orthogonality for Russian Palimpsest", () => {
    verifyOrthogonalPuzzle(PALIMPSEST_RU);
  });

  it("satisfies 100% orthogonality for German Palimpsest", () => {
    verifyOrthogonalPuzzle(PALIMPSEST_DE);
  });

  it("retrieves language-specific Palimpsest correctly", () => {
    expect(getPalimpsestPuzzle("ru").id).toBe("palimpsest_ru_01");
    expect(getPalimpsestPuzzle("de").id).toBe("palimpsest_de_01");
    expect(getPalimpsestPuzzle("en").id).toBe("palimpsest_en_01");
    expect(getPalimpsestPuzzle("fr").id).toBe("palimpsest_en_01"); // fallback
  });

  it("matches groups correctly regardless of selection order", () => {
    const layer = PALIMPSEST_EN.obverse;
    const targetGroup = layer.groups[0];
    const scrambled = [targetGroup.items[2], targetGroup.items[0], targetGroup.items[3], targetGroup.items[1]];

    const matched = findMatchingPalimpsestGroup(scrambled, layer);
    expect(matched?.id).toBe(targetGroup.id);

    const invalid = [targetGroup.items[0], targetGroup.items[1], targetGroup.items[2], "UNKNOWN"];
    expect(findMatchingPalimpsestGroup(invalid, layer)).toBeNull();
  });

  it("identifies one-away submissions accurately", () => {
    const layer = PALIMPSEST_EN.obverse;
    const g = layer.groups[0];
    const threeFromGroup = [g.items[0], g.items[1], g.items[2], "MACE"]; // MACE is from group 2

    expect(isPalimpsestOneAway(threeFromGroup, layer)).toBe(true);

    const twoFromGroup = [g.items[0], g.items[1], "BLADE", "MACE"];
    expect(isPalimpsestOneAway(twoFromGroup, layer)).toBe(false);
  });

  it("ensures palimpsest and passport strings exist for all supported languages", () => {
    for (const l of SUPPORTED_LANGS) {
      const s = strings[l];
      expect(s.palimpsest.title).toBeTruthy();
      expect(s.palimpsest.outOfMistakesTitle).toBeTruthy();
      expect(s.palimpsest.retryLayer).toBeTruthy();
      expect(s.palimpsest.menuButton).not.toContain("📜✨"); // no duplicate icon prefix
      expect(s.passport.preservedStreak).toBeTruthy();
      expect(s.passport.diffTitle).toBeTruthy();
      expect(s.duel.bannerTitle).toBeTruthy();
      expect(s.duel.sendResponse).toBeTruthy();
    }
  });
});
