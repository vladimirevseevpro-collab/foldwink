import type { Puzzle } from "../game/types/puzzle";
import type { ResultSummary as ResultSummaryModel } from "../game/engine/result";
import { formatDuration, computePlayerArchetype } from "../game/engine/result";
import { solvedClassForGroup, solvedDepthClassForGroup } from "../game/solvedColors";
import { StatStrip } from "./StatStrip";
import { VictoryConfetti } from "./VictoryConfetti";
import { useT } from "../i18n/useLanguage";

interface Props {
  summary: ResultSummaryModel;
  puzzle: Puzzle;
  currentStreak: number;
}

export function ResultSummary({ summary, puzzle, currentStreak }: Props) {
  const t = useT();
  const isWin = summary.result === "win";
  const headline = isWin ? t.resultSummary.solved : t.resultSummary.outOfMistakes;
  const archetype = computePlayerArchetype(summary, puzzle.difficulty);

  return (
    <div className="space-y-3 fw-result-pop">
      {isWin && <VictoryConfetti />}
      <div className="text-center">
        <div className={`text-[11px] uppercase mb-1.5 ${isWin ? "text-accent" : "text-muted"}`}>
          {isWin ? t.resultSummary.cleared : t.resultSummary.closeCall}
        </div>
        <h1 id="result-heading" className="text-3xl font-extrabold">
          {headline}
        </h1>
        <div className="mt-2 flex justify-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surfaceHi border border-accent/30 text-accent font-bold text-xs shadow-sm">
            <span aria-hidden="true">{archetype.icon}</span>
            <span>{archetype.title}</span>
          </div>
        </div>
      </div>

      <StatStrip
        cells={[
          {
            label: t.resultSummary.time,
            value: formatDuration(summary.durationMs),
          },
          {
            label: t.resultSummary.mistakes,
            value: `${summary.mistakesUsed}/4`,
            tone: summary.mistakesUsed >= 3 ? "muted" : "default",
          },
          {
            label: t.resultSummary.streak,
            value: currentStreak,
            tone: isWin && currentStreak > 0 ? "accent" : "default",
          },
        ]}
      />

      <div className="space-y-1.5">
        {puzzle.groups.map((g) => (
          <div
            key={g.id}
            className={`rounded-lg px-4 py-2 ${solvedClassForGroup(puzzle, g.id)} ${solvedDepthClassForGroup(puzzle, g.id)}`}
          >
            <div className="text-[11px] uppercase font-bold opacity-80">{g.label}</div>
            <div className="font-semibold mt-0.5 text-sm">{g.items.join(" · ")}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
