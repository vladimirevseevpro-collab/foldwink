import { useState } from "react";
import { formatDuelResponse, computeDuelOutcome } from "../game/engine/duelResponse";
import { useSound } from "../audio/useSound";
import { triggerHaptic } from "../haptics/haptics";
import { getStrings, type Lang } from "../i18n/strings";

interface DuelVerdictBannerProps {
  puzzleId?: string;
  challengerMistakes: number;
  challengerTimeSec: number;
  playerResult: "win" | "loss";
  playerMistakes: number;
  playerDurationMs: number;
  lang: string;
}

function formatSec(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function DuelVerdictBanner({
  puzzleId = "",
  challengerMistakes,
  challengerTimeSec,
  playerResult,
  playerMistakes,
  playerDurationMs,
  lang,
}: DuelVerdictBannerProps) {
  const [responseSent, setResponseSent] = useState(false);
  const play = useSound();
  const playerSec = Math.max(1, Math.round(playerDurationMs / 1000));
  const t = getStrings((lang === "ru" || lang === "de" ? lang : "en") as Lang);

  const outcome = computeDuelOutcome(
    playerResult,
    playerMistakes,
    playerDurationMs,
    challengerMistakes,
    challengerTimeSec,
  );

  const headline =
    outcome === "victory"
      ? t.duel.youWon
      : outcome === "defeat"
        ? t.duel.challengerWon
        : t.duel.tie;

  const borderColor =
    outcome === "victory"
      ? "border-amber-500/70 bg-surfaceHi"
      : outcome === "tie"
        ? "border-accent/70 bg-surfaceHi"
        : "border-red-500/60 bg-surfaceHi";

  const handleSendResponse = async () => {
    const text = formatDuelResponse({
      puzzleId,
      challengerMistakes,
      challengerTimeSec,
      playerResult,
      playerMistakes,
      playerDurationMs,
      lang,
    });

    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: lang === "ru" ? "Дуэль Foldwink" : "Foldwink Duel",
          text,
        });
        setResponseSent(true);
        play("submit");
        triggerHaptic("select");
        setTimeout(() => setResponseSent(false), 2400);
        return;
      } catch {
        /* Fallback to clipboard if share was cancelled or failed */
      }
    }

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        setResponseSent(true);
        play("submit");
        triggerHaptic("select");
        setTimeout(() => setResponseSent(false), 2400);
      }
    } catch {
      /* ignore */
    }
  };

  return (
    <div
      className={`rounded-2xl border-2 ${borderColor} p-4 shadow-xl text-center space-y-3 animate-in fade-in zoom-in-95 duration-200`}
      data-testid="duel-verdict-banner"
    >
      <div className="flex items-center justify-center gap-2">
        <span className="text-xs uppercase font-extrabold tracking-widest text-amber-400">
          ⚔️ {t.duel.bannerTitle}
        </span>
      </div>

      <div className="text-lg font-black text-text">{headline}</div>

      {/* Duel performance comparison card */}
      <div className="grid grid-cols-2 gap-2 bg-surface/80 rounded-xl p-3 border border-line text-xs">
        <div className="space-y-1">
          <div className="text-[10px] uppercase font-bold text-accent">
            {t.duel.yourResult}
          </div>
          <div className="text-base font-extrabold text-text">
            {playerMistakes} {t.duel.mistakesWord(playerMistakes)}
          </div>
          <div className="text-muted text-[11px]">⏱️ {formatSec(playerSec)}</div>
        </div>

        <div className="space-y-1 border-l border-line pl-2">
          <div className="text-[10px] uppercase font-bold text-amber-400">
            {t.duel.challengerResult}
          </div>
          <div className="text-base font-extrabold text-text">
            {challengerMistakes} {t.duel.mistakesWord(challengerMistakes)}
          </div>
          <div className="text-muted text-[11px]">⏱️ {formatSec(challengerTimeSec)}</div>
        </div>
      </div>

      {/* Localized comparison summary */}
      <div className="text-xs font-bold text-muted">
        {t.duel.yourResult}: {playerMistakes} {t.duel.mistakesWord(playerMistakes)} ⚔️ {t.duel.challengerResult}: {challengerMistakes} {t.duel.mistakesWord(challengerMistakes)}
      </div>

      {/* Send response button */}
      <button
        type="button"
        onClick={handleSendResponse}
        className="w-full py-2.5 px-4 rounded-xl border border-amber-500/60 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm"
        data-testid="duel-send-response-button"
      >
        <span>{responseSent ? "✓" : "⚔️"}</span>
        <span>{responseSent ? t.duel.responseSent : t.duel.sendResponse}</span>
      </button>
    </div>
  );
}
