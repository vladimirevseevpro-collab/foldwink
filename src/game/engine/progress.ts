import type { ActiveGame } from "../types/game";
import type { Puzzle } from "../types/puzzle";
import { MAX_MISTAKES } from "../types/game";

export function applyCorrectGroup(game: ActiveGame, groupId: string, groupItems: readonly string[] = []): ActiveGame {
  if (game.solvedGroupIds.includes(groupId)) return game;
  const newOrder = game.order.filter(item => !groupItems.includes(item));
  const insertIndex = game.solvedGroupIds.length * 4;
  newOrder.splice(insertIndex, 0, ...game.order.filter(item => groupItems.includes(item)));
  return {
    ...game,
    solvedGroupIds: [...game.solvedGroupIds, groupId],
    selection: [],
    order: groupItems.length ? newOrder : game.order,
  };
}

export function applyIncorrectGuess(game: ActiveGame): ActiveGame {
  return {
    ...game,
    mistakesUsed: game.mistakesUsed + 1,
    selection: [],
  };
}

export function remainingMistakes(game: ActiveGame): number {
  return Math.max(0, MAX_MISTAKES - game.mistakesUsed);
}

export function isWin(game: ActiveGame, puzzle: Puzzle): boolean {
  return game.solvedGroupIds.length === puzzle.groups.length;
}

export function isLoss(game: ActiveGame): boolean {
  return game.mistakesUsed >= MAX_MISTAKES;
}
