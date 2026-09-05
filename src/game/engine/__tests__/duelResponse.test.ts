import { describe, it, expect } from "vitest";
import { computeDuelOutcome, formatDuelResponse, buildRematchUrl } from "../duelResponse";

describe("duelResponse", () => {
  it("computes victory when player has fewer mistakes", () => {
    const outcome = computeDuelOutcome("win", 0, 45000, 2, 40);
    expect(outcome).toBe("victory");
  });

  it("computes victory when mistakes are equal but player was faster", () => {
    const outcome = computeDuelOutcome("win", 1, 30000, 1, 40);
    expect(outcome).toBe("victory");
  });

  it("computes tie when mistakes and time match", () => {
    const outcome = computeDuelOutcome("win", 1, 40000, 1, 40);
    expect(outcome).toBe("tie");
  });

  it("computes defeat when player has more mistakes", () => {
    const outcome = computeDuelOutcome("win", 2, 20000, 1, 60);
    expect(outcome).toBe("defeat");
  });

  it("computes defeat when player lost the puzzle", () => {
    const outcome = computeDuelOutcome("loss", 4, 20000, 3, 60);
    expect(outcome).toBe("defeat");
  });

  it("builds correct rematch url", () => {
    const url = buildRematchUrl("puzzle-123", 1, 32000, "https://neural-void.com", "/foldwink/");
    expect(url).toBe("https://neural-void.com/foldwink/?vs=puzzle-123&m=1&t=32");
  });

  it("formats Russian duel response correctly", () => {
    const res = formatDuelResponse({
      puzzleId: "puzzle-ru-1",
      challengerMistakes: 2,
      challengerTimeSec: 60,
      playerResult: "win",
      playerMistakes: 1,
      playerDurationMs: 45000,
      lang: "ru",
      origin: "https://neural-void.com",
      pathname: "/foldwink/",
    });
    expect(res).toContain("⚔️ Дуэль принята!");
    expect(res).toContain("Ты: 2 ошибки (60с) vs Я: 1 ошибка (45с)");
    expect(res).toContain("Победа!");
    expect(res).toContain("Принять реванш: https://neural-void.com/foldwink/?vs=puzzle-ru-1&m=1&t=45");
  });

  it("formats English duel response correctly", () => {
    const res = formatDuelResponse({
      puzzleId: "puzzle-en-1",
      challengerMistakes: 1,
      challengerTimeSec: 30,
      playerResult: "win",
      playerMistakes: 2,
      playerDurationMs: 25000,
      lang: "en",
      origin: "https://neural-void.com",
      pathname: "/foldwink/",
    });
    expect(res).toContain("⚔️ Duel accepted!");
    expect(res).toContain("You: 1 mistake (30s) vs Me: 2 mistakes (25s)");
    expect(res).toContain("Defeat!");
    expect(res).toContain("Take revenge: https://neural-void.com/foldwink/?vs=puzzle-en-1&m=2&t=25");
  });

  it("formats German duel response correctly", () => {
    const res = formatDuelResponse({
      puzzleId: "puzzle-de-1",
      challengerMistakes: 0,
      challengerTimeSec: 50,
      playerResult: "win",
      playerMistakes: 0,
      playerDurationMs: 50000,
      lang: "de",
      origin: "https://neural-void.com",
      pathname: "/foldwink/",
    });
    expect(res).toContain("⚔️ Duell angenommen!");
    expect(res).toContain("Du: 0 Fehler (50s) vs Ich: 0 Fehler (50s)");
    expect(res).toContain("Unentschieden!");
    expect(res).toContain("Revanche fordern: https://neural-void.com/foldwink/?vs=puzzle-de-1&m=0&t=50");
  });
});
