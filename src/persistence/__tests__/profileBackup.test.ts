import { describe, expect, it } from "vitest";
import { INITIAL_PROFILE } from "../../progression/archivistProfile";
import { INITIAL_STATS } from "../../game/types/stats";
import {
  PERSISTED_AGGREGATE_SCHEMA_VERSION,
  TERMINAL_ATTEMPT_HISTORY_LIMIT,
  type PersistedActiveAttempt,
  type PersistedAggregateV2,
  type PersistedTerminalAttempt,
} from "../gameRepository";
import {
  exportProfile,
  mergeProfile,
  parseProfileBackup,
  previewProfileBackup,
  PROFILE_BACKUP_KIND,
  PROFILE_BACKUP_MAX_IDENTITY_MARKERS,
  replaceProfile,
} from "../profileBackup";

function aggregate(): PersistedAggregateV2 {
  return {
    schemaVersion: PERSISTED_AGGREGATE_SCHEMA_VERSION,
    profileRevision: 1,
    activeSession: null,
    pendingResultAttemptId: null,
    terminalAttempts: {},
    stats: { ...INITIAL_STATS, solvedPuzzleIds: [] },
    standardProgress: { cursor: 0 },
    dailyHistory: {},
    onboarded: false,
    archivistProfile: { ...INITIAL_PROFILE, consumedRewardKeys: [], rewardReceipts: {} },
  };
}
function withXp(a: PersistedAggregateV2, xp: number): PersistedAggregateV2 {
  return {
    ...a,
    archivistProfile: {
      ...a.archivistProfile,
      xp,
      rewardReceipts: {},
      level: Math.floor(xp / 100) + 1,
    },
  };
}
function envelope(a: PersistedAggregateV2) {
  return {
    version: 1 as const,
    kind: PROFILE_BACKUP_KIND,
    aggregate: a,
    language: "en" as const,
    createdAt: 1,
  };
}
function terminal(id: string, endedAt: number): PersistedTerminalAttempt {
  return {
    attemptId: id,
    commandId: `cmd-${id}`,
    revision: 1,
    puzzleId: "p",
    mode: "standard",
    context: "practice",
    rules: {
      version: 1,
      maxIncorrectGuesses: 4,
      tabsEnabled: false,
      maxWinks: 0,
      timerPresentation: "optional",
    },
    order: ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p"],
    selection: [],
    solvedGroupIds: [],
    mistakesUsed: 0,
    startedAt: Math.max(0, endedAt - 1),
    countsToStats: true,
    winkedGroupId: null,
    result: "abandoned",
    endedAt,
  };
}
function active(id: string): PersistedActiveAttempt {
  const {
    result: _result,
    endedAt: _endedAt,
    commandId: _commandId,
    ...value
  } = terminal(id, 10);
  return value;
}

describe("profile backup", () => {
  it("round-trips a versioned kind and strips non-portable session identity", () => {
    const a = aggregate();
    a.archivistProfile.playerSeed = "local-only";
    a.activeSession = null;
    a.pendingResultAttemptId = null;
    a.palimpsestSession = {
      puzzleId: "palimpsest_en_01",
      language: "en",
      stage: "obverse",
      order: ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p"],
      selection: ["a"],
      solvedGroupIds: [],
      mistakesUsed: 0,
      savedAt: 12,
    };
    const parsed = parseProfileBackup(exportProfile(a, "en", 123));
    expect(parsed.kind).toBe(PROFILE_BACKUP_KIND);
    expect(parsed.aggregate.archivistProfile.playerSeed).toBeUndefined();
    expect(parsed.aggregate.palimpsestSession).toBeNull();
  });
  it("rejects malformed, wrong kind/version and oversized payloads", () => {
    expect(() => parseProfileBackup("nope")).toThrowError(/valid JSON/);
    expect(() => parseProfileBackup({ ...envelope(aggregate()), version: 99 })).toThrowError(
      /Unsupported/,
    );
    expect(() => parseProfileBackup({ ...envelope(aggregate()), kind: "wrong" })).toThrowError(
      /malformed/,
    );
    expect(() => parseProfileBackup("x".repeat(2 * 1024 * 1024 + 1))).toThrowError(/2 MiB/);
  });
  it("enforces terminal and aggregate identity marker limits", () => {
    const attempts = aggregate();
    attempts.terminalAttempts = Object.fromEntries(
      Array.from({ length: TERMINAL_ATTEMPT_HISTORY_LIMIT + 1 }, (_, i) => [
        `a${i}`,
        terminal(`a${i}`, i),
      ]),
    );
    expect(() => exportProfile(attempts, "en")).toThrowError(/terminal attempts/);
    const markers = aggregate();
    markers.stats.solvedPuzzleIds = Array.from(
      { length: PROFILE_BACKUP_MAX_IDENTITY_MARKERS + 1 },
      (_, i) => `p${i}`,
    );
    expect(() => exportProfile(markers, "en")).toThrowError(/identity records/);
  });
  it("previews daily conflicts and requires explicit baseline selection", () => {
    const current = withXp(aggregate(), 160);
    const imported = withXp(aggregate(), 240);
    imported.dailyHistory["en:2026-09-14"] = {
      language: "en",
      date: "2026-09-14",
      puzzleId: "p",
      result: "win",
      mistakesUsed: 0,
      durationMs: 1,
      entryId: "e",
      scheduleVersion: "v",
      puzzleRef: { language: "en", puzzleId: "p", lineageId: "l", contentVersion: "v" },
      winkUsed: false,
      attemptId: "a",
    };
    current.dailyHistory["en:2026-09-14"] = imported.dailyHistory["en:2026-09-14"];
    const p = previewProfileBackup(current, {
      version: 1,
      kind: PROFILE_BACKUP_KIND,
      aggregate: imported,
      language: "en",
      createdAt: 1,
    });
    expect(p.conflictingDailySlots).toEqual(["en:2026-09-14"]);
    expect(p.requiresBaselineSelection).toBe(true);
  });
  it("merges with selected baseline, receipt collision authority and no XP double count", () => {
    const a = withXp(aggregate(), 160);
    const b = withXp(aggregate(), 240);
    const receipt = {
      schemaVersion: 2 as const,
      receiptId: "r",
      rewardKey: "k",
      awarded: true,
      xpGained: 80,
      prevLevel: 1,
      newLevel: 1,
      reason: "awarded" as const,
    };
    a.archivistProfile.rewardReceipts = { k: receipt };
    b.archivistProfile.rewardReceipts = {
      k: { ...receipt, xpGained: 999, receiptId: "foreign" },
      other: { ...receipt, rewardKey: "other" },
    };
    expect(mergeProfile(a, b, "current").archivistProfile.xp).toBe(240);
    expect(mergeProfile(a, b, "current").archivistProfile.rewardReceipts?.k).toEqual(receipt);
    expect(mergeProfile(mergeProfile(a, b, "current"), b, "current").archivistProfile.xp).toBe(
      240,
    );
  });
  it("keeps daily current, local playerSeed/session, caps and orders terminals", () => {
    const current = withXp(aggregate(), 100);
    const imported = withXp(aggregate(), 200);
    current.archivistProfile.playerSeed = "local";
    current.activeSession = { active: active("live"), puzzleId: "p", savedAt: 10 };
    const rec = {
      language: "en" as const,
      date: "2026-09-14",
      puzzleId: "current",
      result: "win" as const,
      mistakesUsed: 0,
      durationMs: 1,
      entryId: "c",
      scheduleVersion: "v",
      puzzleRef: {
        language: "en" as const,
        puzzleId: "current",
        lineageId: "l",
        contentVersion: "v",
      },
      winkUsed: false,
      attemptId: "a",
    };
    current.dailyHistory.slot = rec;
    imported.dailyHistory.slot = { ...rec, puzzleId: "imported" };
    current.terminalAttempts = { old: terminal("old", 1) };
    imported.terminalAttempts = { fresh: terminal("fresh", 3), old: terminal("old", 2) };
    const merged = mergeProfile(current, imported, "imported");
    expect(merged.dailyHistory.slot.puzzleId).toBe("current");
    expect(merged.archivistProfile.playerSeed).toBe("local");
    expect(merged.activeSession).toEqual(current.activeSession);
    expect(Object.keys(merged.terminalAttempts).slice(0, 2)).toEqual(["fresh", "old"]);
    const replaced = replaceProfile(current, {
      ...imported,
      activeSession: current.activeSession,
      pendingResultAttemptId: "x",
      archivistProfile: { ...imported.archivistProfile, playerSeed: "foreign" },
    });
    expect(replaced.profileRevision).toBe(current.profileRevision);
    expect(replaced.activeSession).toBeNull();
    expect(replaced.pendingResultAttemptId).toBeNull();
    expect(replaced.archivistProfile.playerSeed).toBe("local");
  });
});
