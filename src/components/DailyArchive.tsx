import { formatDuration } from "../game/engine/result";
import { useT } from "../i18n/useLanguage";
import { loadDailyHistory, type DailyHistory } from "../stats/persistence";
import { listDailyRecords } from "../stats/dailyRitual";

interface Props {
  history?: DailyHistory;
}

export function DailyArchive({ history }: Props) {
  const t = useT();
  const entries = listDailyRecords(history ?? loadDailyHistory())
    .slice()
    .reverse()
    .slice(0, 30);

  if (entries.length === 0) {
    return <div className="py-3 text-center text-xs text-muted">{t.daily.noHistoryYet}</div>;
  }

  return (
    <div className="space-y-1.5">
      {entries.map((record) => {
        const isWin = record.result === "win";
        return (
          <div
            key={record.date}
            className="flex items-center justify-between rounded-lg border border-[#262a33] bg-surface px-3 py-2 text-xs"
            data-testid={`daily-archive-row-${record.date}`}
            data-result={record.result}
          >
            <div className="flex items-center gap-2">
              <span className="tabular-nums text-muted">{record.date}</span>
              <span className={`font-semibold ${isWin ? "text-accent" : "text-muted"}`}>
                {isWin ? t.daily.solvedShort : t.daily.failedShort}
              </span>
            </div>
            <div className="flex items-center gap-3 tabular-nums text-muted">
              <span>{record.mistakesUsed}/4</span>
              <span>{formatDuration(record.durationMs)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
