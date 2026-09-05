import type { Lang } from "../i18n/strings";
import type { Strings } from "../i18n/strings";
import { useLang, useT } from "../i18n/useLanguage";
import { todayLocal } from "../utils/date";
import { deriveSevenDayFold } from "../stats/dailyRitual";
import type { DailyHistory } from "../stats/persistence";

interface Props {
  history: DailyHistory;
  today?: string;
  className?: string;
}

function formatWeekday(lang: Lang, date: string): string {
  return new Intl.DateTimeFormat(lang, { weekday: "short" })
    .format(new Date(`${date}T12:00:00`))
    .slice(0, 2)
    .toUpperCase();
}

function formatDayNumber(lang: Lang, date: string): string {
  return new Intl.DateTimeFormat(lang, { day: "numeric" }).format(new Date(`${date}T12:00:00`));
}

import type { DailyCellState } from "../stats/dailyRitual";

function stateClass(state: DailyCellState): string {
  if (state === "won") return "border-accent/80 bg-paper text-ink shadow-[0_2px_0_#b5a47e]";
  if (state === "restored" || state === "cracked") {
    return "border-[#d4af37] bg-gradient-to-br from-[#d4af37]/25 via-[#1a1408] to-[#e5c158]/15 text-[#e5c158] shadow-[0_2px_0_#927218] relative overflow-hidden";
  }
  if (state === "lost") return "border-line bg-surfaceHi text-text";
  return "border-dashed border-line/60 bg-surface/50 text-muted";
}

function stateAria(strings: Strings, state: DailyCellState): string {
  if (state === "won") return strings.daily.foldSolved;
  if (state === "restored" || state === "cracked") {
    return strings.daily.foldRestored ?? strings.daily.foldCracked;
  }
  if (state === "lost") return strings.daily.foldMissed;
  return strings.daily.foldEmpty;
}

export function DailyFold({ history, today = todayLocal(), className = "" }: Props) {
  const t = useT();
  const lang = useLang();
  const cells = deriveSevenDayFold(history, today);

  return (
    <div
      className={`rounded-lg border border-line bg-surface px-2 py-2.5 sm:px-3 ${className}`}
      data-testid="daily-fold"
      role="list"
      aria-label={t.daily.label}
    >
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell) => {
          const weekday = formatWeekday(lang, cell.date);
          const day = formatDayNumber(lang, cell.date);
          const isRestored = cell.state === "restored" || cell.state === "cracked";
          return (
            <div
              key={cell.date}
              className={`min-w-0 rounded-md border px-0.5 py-1.5 text-center ${stateClass(cell.state)}`}
              data-testid={`daily-fold-cell-${cell.date}`}
              data-state={cell.state}
              data-today={cell.isToday ? "true" : "false"}
              role="listitem"
              aria-label={`${weekday} ${day}. ${stateAria(t, cell.state)}${
                cell.isToday ? `. ${t.daily.todayMarker}` : ""
              }`}
            >
              {isRestored && (
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none opacity-80"
                  viewBox="0 0 32 40"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M 2 4 Q 14 18 17 22 T 30 38"
                    stroke="#d4af37"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 17 22 Q 23 17 29 14"
                    stroke="#e5c158"
                    strokeWidth="1"
                    strokeLinecap="round"
                  />
                </svg>
              )}
              <div className="text-[9px] uppercase tracking-[0.14em] opacity-75 relative z-10">{weekday}</div>
              <div className="mt-0.5 text-sm font-semibold tabular-nums leading-none flex items-center justify-center gap-0.5 relative z-10">
                <span>{day}</span>
                {isRestored && (
                  <span className="text-[9px] leading-none" title="Restored Seal (Kintsugi)">✨</span>
                )}
              </div>
              <div className="mt-1 h-1.5 flex items-center justify-center relative z-10">
                <span
                  className={`inline-block h-1.5 w-1.5 rounded-full align-top ${
                    cell.isToday ? "bg-accent" : "bg-transparent"
                  }`}
                  aria-hidden="true"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
