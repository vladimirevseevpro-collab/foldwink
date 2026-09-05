import { describe, it, expect } from "vitest";
import {
  revealStage,
  revealStageHard,
  hintFor,
  buildFoldwinkTabs,
  canWinkGroup,
  HIDDEN_CHAR,
} from "../foldwinkTabs";
import type { Puzzle } from "../../types/puzzle";

describe("revealStage", () => {
  it("shows 1 letter at stage 0", () => {
    expect(revealStage("FLY", 0)).toBe(`F${HIDDEN_CHAR}${HIDDEN_CHAR}`);
  });
  it("shows 2 letters at stage 1", () => {
    expect(revealStage("FLY", 1)).toBe(`FL${HIDDEN_CHAR}`);
  });
  it("fully reveals short hints once stage >= length", () => {
    expect(revealStage("FLY", 2)).toBe("FLY");
    expect(revealStage("FLY", 5)).toBe("FLY");
  });
  it("preserves whitespace at every stage", () => {
    expect(revealStage("RED HOT", 0)).toBe(
      `R${HIDDEN_CHAR}${HIDDEN_CHAR} ${HIDDEN_CHAR}${HIDDEN_CHAR}${HIDDEN_CHAR}`,
    );
    expect(revealStage("RED HOT", 2)).toBe(`RED ${HIDDEN_CHAR}${HIDDEN_CHAR}${HIDDEN_CHAR}`);
  });
  it("handles empty hint gracefully", () => {
    expect(revealStage("", 3)).toBe("");
  });
});

describe("revealStageHard", () => {
  it("holds the one-letter preview through the first solve", () => {
    expect(revealStageHard("FLY", 0)).toBe(`F${HIDDEN_CHAR}${HIDDEN_CHAR}`);
    expect(revealStageHard("FLY", 1)).toBe(`F${HIDDEN_CHAR}${HIDDEN_CHAR}`);
  });

  it("adds letters only after later hard solves", () => {
    expect(revealStageHard("FLY", 2)).toBe(`FL${HIDDEN_CHAR}`);
    expect(revealStageHard("FLY", 3)).toBe(`FL${HIDDEN_CHAR}`);
  });
});

describe("hintFor", () => {
  it("uses revealHint when present", () => {
    expect(
      hintFor({ id: "g", label: "___ FLY", items: ["a", "b", "c", "d"], revealHint: "FLY" }),
    ).toBe("FLY");
  });
  it("falls back to label", () => {
    expect(hintFor({ id: "g", label: "Planets", items: ["a", "b", "c", "d"] })).toBe("Planets");
  });
});

function puzzle(difficulty: "easy" | "medium" | "hard"): Puzzle {
  return {
    id: "p",
    title: "p",
    difficulty,
    groups: [
      { id: "g1", label: "Shades of RED", items: ["r1", "r2", "r3", "r4"], revealHint: "RED" },
      { id: "g2", label: "___ FLY", items: ["f1", "f2", "f3", "f4"], revealHint: "FLY" },
      { id: "g3", label: "Meaning BIG", items: ["b1", "b2", "b3", "b4"], revealHint: "BIG" },
      {
        id: "g4",
        label: "Meaning SMALL",
        items: ["s1", "s2", "s3", "s4"],
        revealHint: "SMALL",
      },
    ],
  };
}

describe("buildFoldwinkTabs", () => {
  it("returns nothing on easy puzzles", () => {
    expect(buildFoldwinkTabs(puzzle("easy"), [])).toEqual([]);
  });
  it("uses the slower hard formula while keeping the Tabs row", () => {
    const tabs = buildFoldwinkTabs(puzzle("hard"), ["g1"]);
    expect(tabs).toHaveLength(4);
    expect(tabs.find((tab) => tab.groupId === "g2")?.display).toBe(
      `F${HIDDEN_CHAR}${HIDDEN_CHAR}`,
    );
    expect(
      buildFoldwinkTabs(puzzle("hard"), ["g1", "g2"]).find((tab) => tab.groupId === "g3")
        ?.display,
    ).toBe(`BI${HIDDEN_CHAR}`);
  });

  it("shows 1-letter previews at start on medium puzzles", () => {
    const tabs = buildFoldwinkTabs(puzzle("medium"), []);
    expect(tabs).toHaveLength(4);
    expect(tabs[0].display).toBe(`R${HIDDEN_CHAR}${HIDDEN_CHAR}`);
    expect(tabs[1].display).toBe(`F${HIDDEN_CHAR}${HIDDEN_CHAR}`);
    expect(tabs[2].display).toBe(`B${HIDDEN_CHAR}${HIDDEN_CHAR}`);
    expect(tabs[3].display).toBe(`S${HIDDEN_CHAR}${HIDDEN_CHAR}${HIDDEN_CHAR}${HIDDEN_CHAR}`);
    expect(tabs.every((t) => !t.solved)).toBe(true);
    expect(tabs.every((t) => !t.winked)).toBe(true);
  });
  it("advances reveal stage with each solved group", () => {
    const tabs = buildFoldwinkTabs(puzzle("medium"), ["g1"]);
    const unsolved = tabs.filter((t) => !t.solved);
    expect(unsolved).toHaveLength(3);
    for (const tab of unsolved) {
      const visibleLetters = [...tab.display].filter((c) => c !== HIDDEN_CHAR && !/\s/.test(c));
      expect(visibleLetters.length).toBe(2);
    }
  });
  it("shows the full label once the group is solved", () => {
    const tabs = buildFoldwinkTabs(puzzle("medium"), ["g2"]);
    const solvedTab = tabs.find((t) => t.groupId === "g2");
    expect(solvedTab?.display).toBe("___ FLY");
    expect(solvedTab?.solved).toBe(true);
    expect(solvedTab?.winked).toBe(false);
  });
  it("shows the full category label for a winked tab regardless of stage", () => {
    const tabs = buildFoldwinkTabs(puzzle("medium"), [], "g2");
    const winkedTab = tabs.find((t) => t.groupId === "g2");
    expect(winkedTab?.display).toBe("___ FLY");
    expect(winkedTab?.winked).toBe(true);
    expect(winkedTab?.solved).toBe(false);
    const otherTab = tabs.find((t) => t.groupId === "g1");
    expect(otherTab?.display).toBe(`R${HIDDEN_CHAR}${HIDDEN_CHAR}`);
    expect(otherTab?.winked).toBe(false);
  });
  it("solved state overrides winked when both would apply", () => {
    const tabs = buildFoldwinkTabs(puzzle("medium"), ["g2"], "g2");
    const tab = tabs.find((t) => t.groupId === "g2");
    expect(tab?.solved).toBe(true);
    expect(tab?.display).toBe("___ FLY");
  });
});

describe("canWinkGroup", () => {
  const p = puzzle("medium");

  it("allows winking an unsolved group when no wink has been used", () => {
    expect(canWinkGroup(p, [], null, "g1")).toBe(true);
  });
  it("refuses a second wink", () => {
    expect(canWinkGroup(p, [], "g2", "g1")).toBe(false);
  });
  it("refuses winking a solved group", () => {
    expect(canWinkGroup(p, ["g1"], null, "g1")).toBe(false);
  });
  it("refuses Wink on hard puzzles", () => {
    expect(canWinkGroup(puzzle("hard"), [], null, "g1")).toBe(false);
  });

  it("refuses on easy puzzles", () => {
    expect(canWinkGroup(puzzle("easy"), [], null, "g1")).toBe(false);
  });
  it("refuses unknown group ids", () => {
    expect(canWinkGroup(p, [], null, "ghost")).toBe(false);
  });
});
