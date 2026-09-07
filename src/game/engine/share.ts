import type { Puzzle } from "../types/puzzle";
import type { ResultSummary } from "./result";
import { formatDuration } from "./result";
import type { Strings } from "../../i18n/strings";
import type { ResultGrade } from "./grading";

const SOLVED_EMOJI = ["🟨", "🟩", "🟥", "🟪"];

export interface ShareContext {
  mode: "daily" | "standard";
  dayLabel?: string;
  index?: number;
  strings?: Strings;
  /** Optional — when present, emit a `✦ <label>` line above the grid so
   *  share posts carry the player's own skill flex. Pure local signal,
   *  no network, no social comparison. */
  grade?: ResultGrade;
}

export function buildShareString(
  summary: ResultSummary,
  puzzle: Puzzle,
  ctx: ShareContext,
): string {
  const s = ctx.strings;
  const dailyLabel = s ? s.daily.label : "Daily";

  const header =
    ctx.mode === "daily"
      ? `Foldwink · ${ctx.dayLabel ?? dailyLabel}`
      : `Foldwink · #${String(ctx.index ?? 0).padStart(3, "0")}`;

  const statusLine =
    summary.result === "win"
      ? s
        ? s.share.shareTextSolvedLine(formatDuration(summary.durationMs), summary.mistakesUsed)
        : `Solved in ${formatDuration(summary.durationMs)} · ${summary.mistakesUsed}/4 mistakes`
      : s
        ? s.share.shareTextOutLine(summary.mistakesUsed)
        : `Out of mistakes · ${summary.mistakesUsed}/4`;

  const gradeLine = ctx.grade && summary.result === "win" ? `✦ ${ctx.grade.label}` : null;

  const grid = puzzle.groups
    .map((g, i) => {
      const emoji = SOLVED_EMOJI[i % SOLVED_EMOJI.length];
      return summary.solvedGroupIds.includes(g.id) ? emoji.repeat(4) : "⬛".repeat(4);
    })
    .join("\n");

  const footer = s ? s.share.shareTextFooter : "neural-void.com/foldwink";

  const lines = [header, statusLine];
  if (gradeLine) lines.push(gradeLine);
  lines.push("", grid, "", footer);
  return lines.join("\n");
}
