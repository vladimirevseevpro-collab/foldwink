import type { ActiveGame } from "../types/game";
import type { Puzzle } from "../types/puzzle";
import { MAX_MISTAKES } from "../types/game";

export function applyCorrectGroup(
  game: ActiveGame,
  groupId: string,
  groupItems: readonly string[] = [],
  groupItemIds: readonly string[] = [],
): ActiveGame {
  if (game.solvedGroupIds.includes(groupId)) return game;
  const newOrder = game.order.filter((item) => !groupItems.includes(item));
  const insertIndex = game.solvedGroupIds.length * 4;
  newOrder.splice(insertIndex, 0, ...game.order.filter((item) => groupItems.includes(item)));
  const newItemOrderIds = game.itemOrderIds
    ? [...game.itemOrderIds.filter((itemId) => !groupItemIds.includes(itemId))]
    : undefined;
  if (newItemOrderIds && groupItemIds.length) {
    newItemOrderIds.splice(
      insertIndex,
      0,
      ...game.itemOrderIds!.filter((itemId) => groupItemIds.includes(itemId)),
    );
  }
  return {
    ...game,
    revision: (game.revision ?? 0) + 1,
    solvedGroupIds: [...game.solvedGroupIds, groupId],
    selection: [],
    selectionItemIds: [],
    order: groupItems.length ? newOrder : game.order,
    itemOrderIds: groupItemIds.length ? newItemOrderIds : game.itemOrderIds,
  };
}

export function applyIncorrectGuess(game: ActiveGame, signature?: string): ActiveGame {
  const previous = game.incorrectGuessSignatures ?? [];
  if (signature && previous.includes(signature)) return game;
  return {
    ...game,
    revision: (game.revision ?? 0) + 1,
    mistakesUsed: game.mistakesUsed + 1,
    incorrectGuessSignatures: signature ? [...previous, signature] : previous,
  };
}

export function remainingMistakes(game: ActiveGame): number {
  return Math.max(0, (game.rules?.maxIncorrectGuesses ?? MAX_MISTAKES) - game.mistakesUsed);
}

export function isWin(game: ActiveGame, puzzle: Puzzle): boolean {
  return game.solvedGroupIds.length === puzzle.groups.length;
}

export function isLoss(game: ActiveGame): boolean {
  return game.mistakesUsed >= (game.rules?.maxIncorrectGuesses ?? MAX_MISTAKES);
}
