export type DuelOutcome = "victory" | "tie" | "defeat";

export interface DuelResponseParams {
  puzzleId: string;
  challengerMistakes: number;
  challengerTimeSec: number;
  playerResult: "win" | "loss";
  playerMistakes: number;
  playerDurationMs: number;
  lang: "en" | "de" | "ru" | string;
  origin?: string;
  pathname?: string;
}

export function computeDuelOutcome(
  playerResult: "win" | "loss",
  playerMistakes: number,
  playerDurationMs: number,
  challengerMistakes: number,
  challengerTimeSec: number,
): DuelOutcome {
  if (playerResult !== "win") {
    return "defeat";
  }
  const playerSec = Math.max(1, Math.round(playerDurationMs / 1000));
  if (playerMistakes < challengerMistakes) {
    return "victory";
  }
  if (playerMistakes > challengerMistakes) {
    return "defeat";
  }
  if (playerSec < challengerTimeSec) {
    return "victory";
  }
  if (playerSec > challengerTimeSec) {
    return "defeat";
  }
  return "tie";
}

export function buildRematchUrl(
  puzzleId: string,
  playerMistakes: number,
  playerDurationMs: number,
  origin = typeof window !== "undefined" ? window.location.origin : "https://neural-void.com",
  pathname = typeof window !== "undefined" ? window.location.pathname : "/foldwink/",
): string {
  const playerSec = Math.max(1, Math.round(playerDurationMs / 1000));
  const base = `${origin}${pathname}`;
  const cleanBase = base.endsWith("/") ? base : `${base}/`;
  return `${cleanBase}?vs=${encodeURIComponent(puzzleId)}&m=${playerMistakes}&t=${playerSec}`;
}

export function formatDuelResponse(params: DuelResponseParams): string {
  const {
    puzzleId,
    challengerMistakes,
    challengerTimeSec,
    playerResult,
    playerMistakes,
    playerDurationMs,
    lang,
    origin,
    pathname,
  } = params;

  const playerSec = Math.max(1, Math.round(playerDurationMs / 1000));
  const outcome = computeDuelOutcome(
    playerResult,
    playerMistakes,
    playerDurationMs,
    challengerMistakes,
    challengerTimeSec,
  );
  const rematchUrl = buildRematchUrl(puzzleId, playerMistakes, playerDurationMs, origin, pathname);

  if (lang === "ru") {
    const outcomeLabel =
      outcome === "victory" ? "Победа" : outcome === "tie" ? "Ничья" : "Поражение";
    const chMistakesWord = challengerMistakes === 1 ? "ошибка" : challengerMistakes >= 2 && challengerMistakes <= 4 ? "ошибки" : "ошибок";
    const plMistakesWord = playerMistakes === 1 ? "ошибка" : playerMistakes >= 2 && playerMistakes <= 4 ? "ошибки" : "ошибок";

    return `⚔️ Дуэль принята! Ты: ${challengerMistakes} ${chMistakesWord} (${challengerTimeSec}с) vs Я: ${playerMistakes} ${plMistakesWord} (${playerSec}с) — ${outcomeLabel}! Принять реванш: ${rematchUrl}`;
  }

  if (lang === "de") {
    const outcomeLabel =
      outcome === "victory" ? "Sieg" : outcome === "tie" ? "Unentschieden" : "Niederlage";
    const chWord = challengerMistakes === 1 ? "Fehler" : "Fehler";
    const plWord = playerMistakes === 1 ? "Fehler" : "Fehler";

    return `⚔️ Duell angenommen! Du: ${challengerMistakes} ${chWord} (${challengerTimeSec}s) vs Ich: ${playerMistakes} ${plWord} (${playerSec}s) — ${outcomeLabel}! Revanche fordern: ${rematchUrl}`;
  }

  // English fallback
  const outcomeLabel =
    outcome === "victory" ? "Victory" : outcome === "tie" ? "Tie" : "Defeat";
  const chWord = challengerMistakes === 1 ? "mistake" : "mistakes";
  const plWord = playerMistakes === 1 ? "mistake" : "mistakes";

  return `⚔️ Duel accepted! You: ${challengerMistakes} ${chWord} (${challengerTimeSec}s) vs Me: ${playerMistakes} ${plWord} (${playerSec}s) — ${outcomeLabel}! Take revenge: ${rematchUrl}`;
}
