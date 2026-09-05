interface DuelVerdictBannerProps {
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
  challengerMistakes,
  challengerTimeSec,
  playerResult,
  playerMistakes,
  playerDurationMs,
  lang,
}: DuelVerdictBannerProps) {
  const playerSec = Math.max(1, Math.round(playerDurationMs / 1000));
  const playerWonGame = playerResult === "win";

  let outcome: "player" | "challenger" | "tie" = "challenger";
  if (playerWonGame) {
    if (playerMistakes < challengerMistakes) {
      outcome = "player";
    } else if (playerMistakes > challengerMistakes) {
      outcome = "challenger";
    } else {
      if (playerSec < challengerTimeSec) {
        outcome = "player";
      } else if (playerSec > challengerTimeSec) {
        outcome = "challenger";
      } else {
        outcome = "tie";
      }
    }
  }

  const headline =
    outcome === "player"
      ? (lang === "ru" ? "🏆 Вы победили в Дуэли!" : lang === "de" ? "🏆 Duell gewonnen!" : "🏆 You Won the Duel!")
      : outcome === "challenger"
        ? (lang === "ru" ? "💀 Соперник оказался сильнее" : lang === "de" ? "💀 Herausforderer siegt" : "💀 Challenger Victorious")
        : (lang === "ru" ? "🤝 Благородная Ничья!" : lang === "de" ? "🤝 Ehrenhaftes Unentschieden!" : "🤝 Honorable Tie!");

  const borderColor =
    outcome === "player"
      ? "border-amber-500/70 bg-surfaceHi"
      : outcome === "tie"
        ? "border-accent/70 bg-surfaceHi"
        : "border-red-500/60 bg-surfaceHi";

  return (
    <div
      className={`rounded-2xl border-2 ${borderColor} p-4 shadow-xl text-center space-y-3 animate-in fade-in zoom-in-95 duration-200`}
      data-testid="duel-verdict-banner"
    >
      <div className="flex items-center justify-center gap-2">
        <span className="text-xs uppercase font-extrabold tracking-widest text-amber-400">
          ⚔️ {lang === "ru" ? "Дуэль Печатей" : lang === "de" ? "Siegel-Duell" : "Shared Seal Duel"}
        </span>
      </div>

      <div className="text-lg font-black text-text">{headline}</div>

      {/* Duel performance comparison card */}
      <div className="grid grid-cols-2 gap-2 bg-surface/80 rounded-xl p-3 border border-line text-xs">
        <div className="space-y-1">
          <div className="text-[10px] uppercase font-bold text-accent">
            {lang === "ru" ? "Ваш результат" : "You"}
          </div>
          <div className="text-base font-extrabold text-text">
            {playerMistakes} {lang === "ru" ? "ошибок" : "mistakes"}
          </div>
          <div className="text-muted text-[11px]">⏱️ {formatSec(playerSec)}</div>
        </div>

        <div className="space-y-1 border-l border-line pl-2">
          <div className="text-[10px] uppercase font-bold text-amber-400">
            {lang === "ru" ? "Соперник" : "Challenger"}
          </div>
          <div className="text-base font-extrabold text-text">
            {challengerMistakes} {lang === "ru" ? "ошибок" : "mistakes"}
          </div>
          <div className="text-muted text-[11px]">⏱️ {formatSec(challengerTimeSec)}</div>
        </div>
      </div>

      {/* Prompt requirement format: ("You: X mistakes ⚔️ Challenger: Y mistakes") */}
      <div className="text-xs font-bold text-muted">
        You: {playerMistakes} mistakes ⚔️ Challenger: {challengerMistakes} mistakes
      </div>
    </div>
  );
}
