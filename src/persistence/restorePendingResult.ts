import type { RewardReceipt } from "../game/application/rewardPolicy";
import { calculateResultSummary, type ResultSummary } from "../game/engine/result";
import type { ActiveGame } from "../game/types/game";
import type { Puzzle } from "../game/types/puzzle";
import type { PersistedAggregateV2 } from "./gameRepository";

export interface RestoredPendingResult {
  active: ActiveGame;
  puzzle: Puzzle;
  summary: ResultSummary;
  rewardReceipt: RewardReceipt | null;
}

export function restorePendingResult(
  aggregate: PersistedAggregateV2 | null,
  getPuzzleById: (id: string) => Puzzle | undefined,
): RestoredPendingResult | null {
  const attemptId = aggregate?.pendingResultAttemptId;
  if (!aggregate || !attemptId) return null;
  const terminal = aggregate.terminalAttempts[attemptId];
  if (!terminal || terminal.result === "abandoned") return null;
  const puzzle = terminal.puzzleSnapshot ?? getPuzzleById(terminal.puzzleId);
  if (!puzzle) return null;
  const {
    commandId: _commandId,
    receiptId: _receiptId,
    rewardReceipt,
    puzzleSnapshot: _puzzleSnapshot,
    result,
    ...rest
  } = terminal;
  const active: ActiveGame = { ...rest, result };
  const storedReceipt = terminal.receiptId
    ? (Object.values(aggregate.archivistProfile.rewardReceipts ?? {}).find(
        (receipt) => receipt.receiptId === terminal.receiptId,
      ) ?? null)
    : null;
  return {
    active,
    puzzle,
    summary: calculateResultSummary(active, terminal.endedAt),
    rewardReceipt: rewardReceipt ?? storedReceipt,
  };
}
