import type { DailyRecord } from "../game/types/stats";
import { formatDuration } from "../game/engine/result";
import { DailyCountdown } from "./DailyCountdown";
import { useT } from "../i18n/useLanguage";

interface Props {
  record: DailyRecord;
  currentStreak?: number;
}

export function DailyCompleteCard({ record, currentStreak }: Props) {
  const t = useT();
  const isWin = record.result === "win";
  return (
    <div className="w-full max-w-xs rounded-lg bg-surface border border-line px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[10px] uppercase text-accent">
          ✦ {t.daily.label} · {isWin ? t.daily.solved : t.daily.missed}
        </div>
        <div className="text-[10px] text-muted tabular-nums">
          {formatDuration(record.durationMs)} · {record.mistakesUsed}/4
          {typeof currentStreak === "number" && currentStreak > 0 && (
            <>
              {" · "}
              <span className="text-text font-semibold">×{currentStreak}</span>
            </>
          )}
        </div>
      </div>
      <div className="mt-2 text-center text-[11px] text-muted">
        <DailyCountdown />
      </div>
    </div>
  );
}
