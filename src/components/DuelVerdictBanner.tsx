import { computeDuelOutcome, type DuelOutcome } from "../game/engine/duelResponse";
import { getStrings, type Lang } from "../i18n/strings";
import type { DuelChallengeMetadata } from "../game/state/store";

interface DuelVerdictBannerProps {
  puzzleId?: string;
  challengerMistakes: number;
  challengerTimeSec: number;
  playerResult: "win" | "loss";
  playerMistakes: number;
  playerDurationMs: number;
  lang: string;
  challenge?: DuelChallengeMetadata;
}

function formatSec(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function DuelVerdictBanner({
  challengerMistakes,
  challengerTimeSec,
  playerResult,
  playerMistakes,
  playerDurationMs,
  lang,
  challenge = { source: "legacy" },
}: DuelVerdictBannerProps) {
  const playerSec = Math.max(1, Math.round(playerDurationMs / 1000));
  const t = getStrings((lang === "ru" || lang === "de" ? lang : "en") as Lang);
  const sentResult = challenge.creatorResult;
  const isVersionedChallenge = challenge.source === "challenge-v2";

  let outcome: DuelOutcome;
  if (isVersionedChallenge && sentResult) {
    outcome =
      playerResult !== sentResult.result
        ? playerResult === "win"
          ? "victory"
          : "defeat"
        : playerMistakes < sentResult.mistakesUsed
          ? "victory"
          : playerMistakes > sentResult.mistakesUsed
            ? "defeat"
            : "tie";
  } else {
    outcome = computeDuelOutcome(
      playerResult,
      playerMistakes,
      playerDurationMs,
      challengerMistakes,
      challengerTimeSec,
    );
  }

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

  const durationBucketLabel = sentResult?.durationBucket
    ? sentResult.durationBucket === "under-1m"
      ? "< 1:00"
      : sentResult.durationBucket === "1-3m"
        ? "1:00–3:00"
        : sentResult.durationBucket === "3-5m"
          ? "3:00–5:00"
          : "> 5:00"
    : null;

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
          <div className="text-[10px] uppercase font-bold text-accent">{t.duel.yourResult}</div>
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
            {sentResult?.mistakesUsed ?? challengerMistakes}{" "}
            {t.duel.mistakesWord(sentResult?.mistakesUsed ?? challengerMistakes)}
          </div>
          <div className="text-muted text-[11px]">
            ⏱️{" "}
            {isVersionedChallenge ? (durationBucketLabel ?? "—") : formatSec(challengerTimeSec)}
          </div>
        </div>
      </div>

      {/* Localized comparison summary */}
      <div className="text-xs font-bold text-muted">
        {t.duel.yourResult}: {playerMistakes} {t.duel.mistakesWord(playerMistakes)} ⚔️{" "}
        {t.duel.challengerResult}: {challengerMistakes}{" "}
        {t.duel.mistakesWord(challengerMistakes)}
      </div>
      {isVersionedChallenge && (
        <div className="rounded-md border border-line px-2 py-1.5 text-[10px] text-muted">
          {lang === "ru"
            ? "Результат прислан другом и не проверен сервером"
            : lang === "de"
              ? "Vom Freund gesendetes Ergebnis; nicht serverseitig geprüft"
              : "Result sent by a friend; not server-verified"}
        </div>
      )}
    </div>
  );
}
