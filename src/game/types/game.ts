export type GameMode = "daily" | "standard" | "zen";
export type AppScreen = "menu" | "game" | "result" | "stats";
export type GameResult = "win" | "loss";

export interface ActiveGame {
  puzzleId: string;
  mode: GameMode;
  order: string[];
  selection: string[];
  solvedGroupIds: string[];
  mistakesUsed: number;
  startedAt: number;
  endedAt?: number;
  result?: GameResult;
  countsToStats: boolean;
  /**
   * The id of the group whose Foldwink Tab the player has chosen to WINK
   * this game. null if no wink has been used yet. One wink per puzzle,
   * medium puzzles only. Winking immediately reveals the full reveal hint
   * for that tab, regardless of the current progressive-reveal stage.
   */
  winkedGroupId: string | null;
}

export const MAX_MISTAKES = 4;
export const SELECTION_SIZE = 4;
export const MAX_WINKS_PER_GAME = 1;
