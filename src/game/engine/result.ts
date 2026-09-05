import type { ActiveGame, GameResult } from "../types/game";

export interface ResultSummary {
  result: GameResult;
  mistakesUsed: number;
  durationMs: number;
  solvedGroupIds: string[];
}

export function calculateResultSummary(game: ActiveGame, endedAt: number): ResultSummary {
  if (!game.result) {
    throw new Error("calculateResultSummary called before game ended");
  }
  return {
    result: game.result,
    mistakesUsed: game.mistakesUsed,
    durationMs: Math.max(0, endedAt - game.startedAt),
    solvedGroupIds: game.solvedGroupIds.slice(),
  };
}

export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export interface PlayerArchetype {
  id: "sniper" | "speed_demon" | "gambler" | "purist" | "detective" | "strategist" | "persistent";
  title: string;
  icon: string;
  badge: string;
}

export function computePlayerArchetype(
  summary: ResultSummary,
  difficulty?: "easy" | "medium" | "hard",
  winkedGroupId?: string | null,
): PlayerArchetype {
  if (summary.result === "loss") {
    return {
      id: "persistent",
      title: "The Persistent",
      icon: "🛡️",
      badge: "PERSISTENT",
    };
  }

  if (summary.mistakesUsed === 0) {
    if (summary.durationMs < 60000) {
      return {
        id: "speed_demon",
        title: "Speed Demon",
        icon: "⚡",
        badge: "SPEED DEMON",
      };
    }
    return {
      id: "sniper",
      title: "The Sniper",
      icon: "🎯",
      badge: "THE SNIPER",
    };
  }

  if (summary.mistakesUsed === 3) {
    return {
      id: "gambler",
      title: "The Gambler",
      icon: "🎲",
      badge: "THE GAMBLER",
    };
  }

  if (difficulty === "medium" || difficulty === "hard") {
    if (!winkedGroupId) {
      return {
        id: "purist",
        title: "The Purist",
        icon: "🧠",
        badge: "THE PURIST",
      };
    }
    return {
      id: "detective",
      title: "The Detective",
      icon: "🔍",
      badge: "THE DETECTIVE",
    };
  }

  if (summary.durationMs < 60000) {
    return {
      id: "speed_demon",
      title: "Speed Demon",
      icon: "⚡",
      badge: "SPEED DEMON",
    };
  }

  return {
    id: "strategist",
    title: "The Strategist",
    icon: "♟️",
    badge: "THE STRATEGIST",
  };
}
