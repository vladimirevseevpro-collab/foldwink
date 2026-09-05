import type { Puzzle, PuzzleGroup } from "../types/puzzle";

/**
 * The Foldwink Tabs mechanic: on medium puzzles, every group shows a small
 * tab above the grid whose label starts concealed and gradually reveals
 * itself as the player solves groups. Once a tab's group is solved, the full
 * label replaces the progressive reveal.
 *
 * WINK: in addition to the passive progressive reveal, the player may WINK
 * exactly one tab per puzzle. A winked tab shows its full category label
 * immediately, regardless of the current stage. Once a wink has been used,
 * no further tabs can be winked for the rest of the game.
 *
 * The reveal is pure and stateless — it is a function of the group, the
 * number of groups already solved (the stage), and the optional winked
 * group id.
 *
 * Stage rules (for a hint with N letters):
 *   stage 0 → 1 letter visible
 *   stage 1 → 2 letters visible
 *   stage 2 → 3 letters visible
 *   stage 3 → full hint visible (fallback if the group is the last unsolved)
 */

const HIDDEN_CHAR = "·";

function applyVisibleCount(rawHint: string, visibleCount: number): string {
  const hint = rawHint.trim();
  if (!hint) return "";
  const letters = [...hint];
  const shown: string[] = [];
  let revealed = 0;
  for (const ch of letters) {
    if (/\s/.test(ch)) {
      shown.push(ch);
      continue;
    }
    if (revealed < visibleCount) {
      shown.push(ch);
      revealed += 1;
    } else {
      shown.push(HIDDEN_CHAR);
    }
  }
  return shown.join("");
}

/**
 * Medium reveal formula: one letter per solved group, starting at 1.
 *   stage 0 → 1 letter, stage 1 → 2 letters, stage 2 → 3, stage 3 → full.
 */
export function revealStage(rawHint: string, stage: number): string {
  const hint = rawHint.trim();
  if (!hint) return "";
  const visibleCount = Math.min(hint.length, Math.max(1, stage + 1));
  return applyVisibleCount(hint, visibleCount);
}

/**
 * Hard reveal formula (0.4.3): roughly half-speed progressive reveal.
 * The Master Challenge tier keeps the Foldwink Tabs row with less
 * information. The first solved group does not add letters beyond the
 * starting hint; later solves reveal letters at half the medium rate.
 *
 *   stage 0 -> 1 letter
 *   stage 1 -> 1 letter
 *   stage 2 -> 2 letters
 *   stage 3 -> 2 letters
 */
export function revealStageHard(rawHint: string, stage: number): string {
  const hint = rawHint.trim();
  if (!hint) return "";
  const visibleCount = Math.min(hint.length, Math.max(1, Math.floor(stage / 2) + 1));
  return applyVisibleCount(hint, visibleCount);
}

export function hintFor(group: PuzzleGroup): string {
  return (group.revealHint && group.revealHint.trim()) || group.label;
}

export interface FoldwinkTab {
  groupId: string;
  display: string;
  solved: boolean;
  winked: boolean;
}

/**
 * Builds the tab row for a medium or hard puzzle. Returns an empty list for
 * easy puzzles — they ship with no Foldwink Tabs by design.
 *
 * Medium uses `revealStage` (one letter per solve). Hard uses
 * `revealStageHard` (half-speed reveal). Wink is medium-only.
 *
 * `winkedGroupId` is the id of the tab the player has chosen to wink this
 * game (or null / undefined if none). A winked unsolved tab shows its full
 * category label.
 */
export function buildFoldwinkTabs(
  puzzle: Puzzle,
  solvedGroupIds: readonly string[],
  winkedGroupId: string | null = null,
): FoldwinkTab[] {
  if (puzzle.difficulty === "easy") return [];
  const solvedSet = new Set(solvedGroupIds);
  const stage = solvedSet.size;
  const formula = puzzle.difficulty === "hard" ? revealStageHard : revealStage;
  return puzzle.groups.map((g) => {
    const solved = solvedSet.has(g.id);
    if (solved) {
      return { groupId: g.id, display: g.label, solved: true, winked: false };
    }
    if (winkedGroupId === g.id) {
      return { groupId: g.id, display: g.label, solved: false, winked: true };
    }
    return {
      groupId: g.id,
      display: formula(hintFor(g), stage),
      solved: false,
      winked: false,
    };
  });
}

/**
 * Wink is medium-only by design. Hard puzzles explicitly lose Wink as part
 * of the "less help, cleaner pressure" rule set.
 */
export function canWinkGroup(
  puzzle: Puzzle,
  solvedGroupIds: readonly string[],
  winkedGroupId: string | null,
  groupId: string,
): boolean {
  if (puzzle.difficulty !== "medium") return false;
  if (winkedGroupId !== null) return false;
  if (solvedGroupIds.includes(groupId)) return false;
  return puzzle.groups.some((g) => g.id === groupId);
}

export { HIDDEN_CHAR };
