import { MAX_MISTAKES } from "../game/types/game";
import { useT } from "../i18n/useLanguage";

interface Props {
  used: number;
  /** When true, the most recently consumed dot is tinted amber (not red).
   *  Consumed in parent (`GameScreen`) while `flash === "one-away"` so the
   *  player ties "this cost a mistake but you were close" to the same
   *  visual field as the mistakes strip. Pure CSS, ~900 ms lifetime,
   *  settles to red when the flash clears. */
  oneAwayLast?: boolean;
}

export function MistakesDots({ used, oneAwayLast = false }: Props) {
  const t = useT();
  const dots = Array.from({ length: MAX_MISTAKES });
  const lastConsumedIdx = used - 1;
  return (
    <div
      className="flex items-center gap-1.5"
      role="status"
      aria-live="polite"
      aria-label={t.game.mistakesAria(used, MAX_MISTAKES)}
    >
      <span className="text-xs uppercase text-muted mr-1">
        {t.game.mistakesLabel}
      </span>
      {dots.map((_, i) => {
        const consumed = i < used;
        const amber = consumed && oneAwayLast && i === lastConsumedIdx;
        const isLatest = i === lastConsumedIdx;
        const isLastRemaining = used === 3 && i === 3;
        return (
          <span
            key={i}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              consumed
                ? amber
                  ? `bg-warning shadow-[0_0_8px_rgba(231,185,90,0.6)] ${isLatest ? "fw-dot-pop" : ""}`
                  : `bg-danger shadow-[0_0_8px_rgba(200,70,53,0.7)] ${isLatest ? "fw-dot-pop" : ""}`
                : isLastRemaining
                  ? "bg-surfaceHi border border-danger/80 shadow-[0_0_6px_rgba(200,70,53,0.5)] animate-pulse"
                  : "bg-surfaceHi border border-line/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_1px_0_rgba(0,0,0,0.5)]"
            }`}
          />
        );
      })}
    </div>
  );
}
