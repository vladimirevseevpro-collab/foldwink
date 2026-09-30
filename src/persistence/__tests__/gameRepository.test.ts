import { describe, expect, it } from "vitest";
import { INITIAL_PROFILE } from "../../progression/archivistProfile";
import { INITIAL_STATS } from "../../game/types/stats";
import type { Puzzle } from "../../game/types/puzzle";
import {
  PERSISTED_AGGREGATE_SCHEMA_VERSION,
  TERMINAL_ATTEMPT_HISTORY_LIMIT,
  IndexedDbGameRepository,
  applyAggregateMutation,
  getDailySlotKey,
  isPersistedAggregateV2,
  type FinalizeAttemptMutation,
  type PersistedActiveAttempt,
  type PersistedAggregateV2,
  type PersistedDailyRecord,
} from "../gameRepository";

function activeAttempt(revision = 0): PersistedActiveAttempt {
  return {
    attemptId: "attempt-1",
    revision,
    puzzleId: "puzzle-1",
    mode: "daily",
    context: "daily",
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
    startedAt: 100,
    startedLocalDate: "2026-09-14",
    countsToStats: true,
    winkedGroupId: null,
  };
}

function aggregate(): PersistedAggregateV2 {
  return {
    schemaVersion: PERSISTED_AGGREGATE_SCHEMA_VERSION,
    profileRevision: 7,
    activeSession: { active: activeAttempt(), puzzleId: "puzzle-1", savedAt: 100 },
    pendingResultAttemptId: null,
    terminalAttempts: {},
    stats: { ...INITIAL_STATS },
    standardProgress: { cursor: 0 },
    dailyHistory: {},
    onboarded: false,
    archivistProfile: {
      ...INITIAL_PROFILE,
      consumedRewardKeys: [],
      rewardReceipts: {},
    },
  };
}

function receipt() {
  return {
    schemaVersion: 2 as const,
    receiptId: "receipt-unique-solve",
    rewardKey: "unique-solve:en:lineage-1",
    awarded: true,
    xpGained: 80,
    prevLevel: 1,
    newLevel: 1,
    reason: "awarded" as const,
  };
}

function dailyRecord(): PersistedDailyRecord {
  return {
    language: "en",
    date: "2026-09-14",
    puzzleId: "puzzle-1",
    result: "win",
    mistakesUsed: 0,
    durationMs: 1_000,
    entryId: "daily-2026-09-14-en",
    scheduleVersion: "2026.09",
    puzzleRef: {
      language: "en",
      puzzleId: "puzzle-1",
      lineageId: "lineage-1",
      contentVersion: "v1",
    },
    winkUsed: false,
    attemptId: "attempt-1",
    receiptId: "receipt-unique-solve",
  };
}

const puzzleSnapshot: Puzzle = {
  id: "puzzle-1",
  title: "Fixture",
  difficulty: "easy" as const,
  groups: [
    { id: "g1", label: "G1", items: ["a", "b", "c", "d"] },
    { id: "g2", label: "G2", items: ["e", "f", "g", "h"] },
    { id: "g3", label: "G3", items: ["i", "j", "k", "l"] },
    { id: "g4", label: "G4", items: ["m", "n", "o", "p"] },
  ],
};

function finalize(current: PersistedAggregateV2): FinalizeAttemptMutation {
  const currentActive = current.activeSession!.active;
  const nextReceipt = receipt();
  return {
    kind: "finalizeAttempt",
    commandId: "finish-1",
    expectedProfileRevision: current.profileRevision,
    expectedActiveAttemptId: currentActive.attemptId,
    expectedAttemptRevision: currentActive.revision,
    terminalAttempt: {
      ...currentActive,
      commandId: "finish-1",
      revision: currentActive.revision + 1,
      solvedGroupIds: ["g1", "g2", "g3", "g4"],
      result: "win",
      endedAt: 1_100,
    },
    update: {
      stats: { ...current.stats, gamesPlayed: 1, wins: 1, solvedPuzzleIds: ["puzzle-1"] },
      standardProgress: current.standardProgress,
      archivistProfile: {
        ...current.archivistProfile,
        xp: 80,
        consumedRewardKeys: [nextReceipt.rewardKey],
      },
    },
    receipt: nextReceipt,
    dailyRecord: dailyRecord(),
  };
}

describe("applyAggregateMutation", () => {
  it("collects a cosmetic stamp once without changing XP or currencies", () => {
    const before = aggregate();
    const first = applyAggregateMutation(before, {
      kind: "collectStamp",
      commandId: "collect-stamp:stamp_palimpsest",
      expectedProfileRevision: before.profileRevision,
      expectedActiveAttemptId: before.activeSession!.active.attemptId,
      stampId: "stamp_palimpsest",
    });
    expect(first).toMatchObject({ ok: true, idempotent: false });
    if (!first.ok) return;
    expect(first.state.archivistProfile).toMatchObject({
      xp: before.archivistProfile.xp,
      ink: before.archivistProfile.ink,
      wax: before.archivistProfile.wax,
    });
    expect(first.state.archivistProfile.collectedStampIds).toContain("stamp_palimpsest");

    const repeated = applyAggregateMutation(first.state, {
      kind: "collectStamp",
      commandId: "collect-stamp:stamp_palimpsest",
      expectedProfileRevision: first.state.profileRevision,
      expectedActiveAttemptId: first.state.activeSession!.active.attemptId,
      stampId: "stamp_palimpsest",
    });
    expect(repeated).toMatchObject({ ok: true, idempotent: true });
    if (!repeated.ok) return;
    expect(repeated.state).toBe(first.state);
  });

  it("persists a bounded cosmetic selection without touching progression", () => {
    const before = aggregate();
    const result = applyAggregateMutation(before, {
      kind: "updateProfileCosmetic",
      commandId: "profile-cosmetic:sealId:seal_owl",
      expectedProfileRevision: before.profileRevision,
      expectedActiveAttemptId: before.activeSession!.active.attemptId,
      field: "sealId",
      value: "seal_owl",
    });
    expect(result).toMatchObject({ ok: true, idempotent: false });
    if (!result.ok) return;
    expect(result.state.archivistProfile.sealId).toBe("seal_owl");
    expect(result.state.archivistProfile.xp).toBe(before.archivistProfile.xp);
    expect(result.state.archivistProfile.consumedRewardKeys).toEqual(
      before.archivistProfile.consumedRewardKeys,
    );
  });

  it("imports only safe legacy passport details and preserves the reward ledger", () => {
    const before = aggregate();
    before.archivistProfile = {
      ...before.archivistProfile,
      level: 9,
      xp: 4_200,
      ink: 17,
      wax: 8,
      prestige: 2,
      playerSeed: "local-seed",
      collectedStampIds: ["stamp_morning_brew"],
      consumedRewardKeys: ["unique-solve:en:lineage-1"],
      rewardReceipts: { "unique-solve:en:lineage-1": receipt() },
      migrationReceipts: ["legacy-migration"],
    };
    const result = applyAggregateMutation(before, {
      kind: "importLegacyPassport",
      commandId: "legacy-passport:test",
      expectedProfileRevision: before.profileRevision,
      expectedActiveAttemptId: before.activeSession!.active.attemptId,
      details: {
        playerSeed: "imported-seed",
        sealId: "seal_compass",
        nibId: "nib_obsidian",
        titleId: "title_connections",
        collectedStampIds: ["stamp_midori_compass"],
      },
    });
    expect(result).toMatchObject({ ok: true, idempotent: false });
    if (!result.ok) return;
    expect(result.state.archivistProfile).toMatchObject({
      level: 9,
      xp: 4_200,
      ink: 17,
      wax: 8,
      prestige: 2,
      playerSeed: "imported-seed",
      sealId: "seal_compass",
      nibId: "nib_obsidian",
      titleId: "title_connections",
      consumedRewardKeys: ["unique-solve:en:lineage-1"],
      migrationReceipts: ["legacy-migration"],
    });
    expect(result.state.archivistProfile.collectedStampIds).toEqual([
      "stamp_morning_brew",
      "stamp_midori_compass",
    ]);
    expect(result.state.archivistProfile.rewardReceipts).toEqual(
      before.archivistProfile.rewardReceipts,
    );
    expect(result.state.stats).toBe(before.stats);
    expect(result.state.dailyHistory).toBe(before.dailyHistory);

    const repeated = applyAggregateMutation(result.state, {
      kind: "importLegacyPassport",
      commandId: "legacy-passport:repeat",
      expectedProfileRevision: result.state.profileRevision,
      expectedActiveAttemptId: result.state.activeSession!.active.attemptId,
      details: {
        playerSeed: "imported-seed",
        sealId: "seal_compass",
        nibId: "nib_obsidian",
        titleId: "title_connections",
        collectedStampIds: ["stamp_midori_compass"],
      },
    });
    expect(repeated).toMatchObject({ ok: true, idempotent: true });
  });

  it("rejects unknown legacy passport details and stale CAS", () => {
    const before = aggregate();
    const details = {
      playerSeed: "safe-seed",
      sealId: "seal_unknown",
      nibId: "nib_brass",
      titleId: "title_truths",
      collectedStampIds: ["stamp_morning_brew"],
    };
    expect(
      applyAggregateMutation(before, {
        kind: "importLegacyPassport",
        commandId: "legacy-passport:invalid",
        expectedProfileRevision: before.profileRevision,
        expectedActiveAttemptId: before.activeSession!.active.attemptId,
        details,
      }),
    ).toMatchObject({ ok: false, kind: "error", code: "invalid-mutation" });
    expect(
      applyAggregateMutation(before, {
        kind: "importLegacyPassport",
        commandId: "legacy-passport:stale",
        expectedProfileRevision: before.profileRevision - 1,
        expectedActiveAttemptId: before.activeSession!.active.attemptId,
        details: { ...details, sealId: "seal_raven" },
      }),
    ).toMatchObject({ ok: false, kind: "conflict", code: "profile-revision" });
  });

  it("rejects malformed terminal data instead of restoring a fabricated Result", () => {
    const malformed = {
      ...aggregate(),
      activeSession: null,
      pendingResultAttemptId: "attempt-1",
      terminalAttempts: {
        "attempt-1": {
          attemptId: "attempt-1",
          commandId: "bad",
          revision: 1,
          puzzleId: "puzzle-1",
          mode: "standard",
          order: ["a"],
          selection: [],
          solvedGroupIds: "not-an-array",
          mistakesUsed: -1,
          startedAt: 0,
          countsToStats: true,
          winkedGroupId: null,
          result: "win",
          endedAt: Number.NaN,
        },
      },
    };

    expect(isPersistedAggregateV2(malformed)).toBe(false);
  });

  it("rejects a structurally incomplete active 4×4 board", () => {
    const incomplete = aggregate();
    incomplete.activeSession!.active.order = ["a"];
    expect(isPersistedAggregateV2(incomplete)).toBe(false);
  });

  it("rejects a Daily snapshot whose puzzle identity does not match its record", () => {
    const malformed = aggregate();
    malformed.dailyHistory["en:2026-09-14"] = {
      ...dailyRecord(),
      puzzleSnapshot: { ...puzzleSnapshot, id: "different-puzzle" },
    };

    expect(isPersistedAggregateV2(malformed)).toBe(false);
  });

  it("requires a new attempt to start at revision zero", () => {
    const before = { ...aggregate(), profileRevision: 0, activeSession: null };
    const result = applyAggregateMutation(before, {
      kind: "startAttempt",
      commandId: "start-invalid",
      expectedProfileRevision: 0,
      expectedActiveAttemptId: null,
      session: { active: activeAttempt(1), puzzleId: "puzzle-1", savedAt: 100 },
      standardProgress: { cursor: 0 },
    });

    expect(result).toMatchObject({ ok: false, kind: "error", code: "invalid-mutation" });
  });

  it("rejects malformed progress on attempt start", () => {
    const before = { ...aggregate(), profileRevision: 0, activeSession: null };
    const result = applyAggregateMutation(before, {
      kind: "startAttempt",
      commandId: "start-invalid-progress",
      expectedProfileRevision: 0,
      expectedActiveAttemptId: null,
      session: { active: activeAttempt(0), puzzleId: "puzzle-1", savedAt: 100 },
      standardProgress: { cursor: -1 },
    });

    expect(result).toMatchObject({ ok: false, kind: "error", code: "invalid-mutation" });
  });

  it("finalizes once and acknowledges an identical stale retry without another reward", () => {
    const before = aggregate();
    const command = finalize(before);

    const first = applyAggregateMutation(before, command);
    expect(first).toMatchObject({ ok: true, idempotent: false });
    if (!first.ok) return;
    expect(first.state.profileRevision).toBe(8);
    expect(first.state.activeSession).toBeNull();
    expect(first.state.pendingResultAttemptId).toBe("attempt-1");
    expect(first.state.archivistProfile.xp).toBe(80);
    expect(first.state.archivistProfile.rewardReceipts).toHaveProperty(
      command.receipt!.rewardKey,
    );
    expect(first.state.dailyHistory[getDailySlotKey("en", "2026-09-14")]).toEqual(
      command.dailyRecord,
    );

    const retry = applyAggregateMutation(first.state, command);
    expect(retry).toMatchObject({ ok: true, idempotent: true });
    if (!retry.ok) return;
    expect(retry.state.profileRevision).toBe(8);
    expect(Object.keys(retry.state.archivistProfile.rewardReceipts ?? {})).toHaveLength(1);
    expect(Object.keys(retry.state.terminalAttempts)).toHaveLength(1);
  });

  it("acknowledges a pending Result without deleting terminal history or reward", () => {
    const first = applyAggregateMutation(aggregate(), finalize(aggregate()));
    if (!first.ok) throw new Error("fixture finalization failed");

    const acknowledged = applyAggregateMutation(first.state, {
      kind: "acknowledgeResult",
      commandId: "ack-result:attempt-1",
      expectedProfileRevision: first.state.profileRevision,
      expectedActiveAttemptId: null,
      expectedPendingResultAttemptId: "attempt-1",
    });

    expect(acknowledged.ok).toBe(true);
    if (!acknowledged.ok) return;
    expect(acknowledged.state.pendingResultAttemptId).toBeNull();
    expect(acknowledged.state.terminalAttempts["attempt-1"]).toBeDefined();
    expect(acknowledged.state.archivistProfile.xp).toBe(80);
  });

  it("rejects a stale in-progress command without changing the committed attempt", () => {
    const before = aggregate();
    const current = before.activeSession!.active;
    const result = applyAggregateMutation(before, {
      kind: "saveInProgress",
      commandId: "move-1",
      expectedProfileRevision: 7,
      expectedActiveAttemptId: "attempt-1",
      expectedAttemptRevision: 3,
      session: { active: { ...current, revision: 4 }, puzzleId: "puzzle-1", savedAt: 200 },
    });

    expect(result).toMatchObject({ ok: false, kind: "conflict", code: "attempt-revision" });
    expect(before.activeSession!.active.revision).toBe(0);
  });

  it("prevents a second attempt from consuming the same unique reward key", () => {
    const before = aggregate();
    const first = applyAggregateMutation(before, finalize(before));
    if (!first.ok) throw new Error("fixture finalization failed");

    const secondAttempt: PersistedAggregateV2 = {
      ...first.state,
      profileRevision: first.state.profileRevision + 1,
      pendingResultAttemptId: null,
      activeSession: {
        active: { ...activeAttempt(), attemptId: "attempt-2" },
        puzzleId: "puzzle-1",
        savedAt: 1_200,
      },
    };
    const secondCommand = finalize(secondAttempt);
    secondCommand.terminalAttempt = {
      ...secondCommand.terminalAttempt,
      attemptId: "attempt-2",
    };
    secondCommand.receipt = { ...receipt(), receiptId: "different-receipt" };

    const result = applyAggregateMutation(secondAttempt, secondCommand);
    expect(result).toMatchObject({ ok: false, kind: "conflict", code: "reward-key" });
  });

  it("finalizes an ineligible replay without storing its denial as a reward receipt", () => {
    const before = aggregate();
    const command = finalize(before);
    command.receipt = {
      ...command.receipt!,
      awarded: false,
      xpGained: 0,
      reason: "already-consumed",
    };
    command.update.archivistProfile = before.archivistProfile;

    const result = applyAggregateMutation(before, command);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.archivistProfile.rewardReceipts).toEqual({});
    expect(result.state.terminalAttempts["attempt-1"]).toBeDefined();
  });

  it("prevents a different attempt from replacing an already-scored daily slot", () => {
    const before = aggregate();
    const first = applyAggregateMutation(before, finalize(before));
    if (!first.ok) throw new Error("fixture finalization failed");

    const secondAttempt: PersistedAggregateV2 = {
      ...first.state,
      profileRevision: first.state.profileRevision + 1,
      pendingResultAttemptId: null,
      activeSession: {
        active: { ...activeAttempt(), attemptId: "attempt-2" },
        puzzleId: "puzzle-1",
        savedAt: 1_200,
      },
    };
    const secondCommand = finalize(secondAttempt);
    secondCommand.terminalAttempt = {
      ...secondCommand.terminalAttempt,
      attemptId: "attempt-2",
    };
    // Use a distinct reward key so the Daily identity is the failing invariant.
    secondCommand.receipt = { ...receipt(), rewardKey: "unique-solve:en:lineage-2" };

    const result = applyAggregateMutation(secondAttempt, secondCommand);
    expect(result).toMatchObject({ ok: false, kind: "conflict", code: "daily-slot" });
  });

  it("does not start over an active attempt and preserves the original session", () => {
    const before = aggregate();
    const result = applyAggregateMutation(before, {
      kind: "startAttempt",
      commandId: "start-2",
      expectedProfileRevision: 7,
      expectedActiveAttemptId: null,
      session: {
        active: { ...activeAttempt(), attemptId: "attempt-2" },
        puzzleId: "puzzle-1",
        savedAt: 200,
      },
      standardProgress: { cursor: 0 },
    });

    expect(result).toMatchObject({ ok: false, kind: "conflict", code: "active-attempt" });
    expect(before.activeSession!.active.attemptId).toBe("attempt-1");
  });

  it("keeps a deterministic bounded diagnostic terminal history", () => {
    const before = aggregate();
    before.terminalAttempts = Object.fromEntries(
      Array.from({ length: TERMINAL_ATTEMPT_HISTORY_LIMIT }, (_, index) => {
        const attempt = activeAttempt();
        const attemptId = `old-${index}`;
        return [
          attemptId,
          {
            ...attempt,
            attemptId,
            commandId: `finish-${index}`,
            revision: 1,
            result: "abandoned" as const,
            endedAt: 100 + index,
          },
        ];
      }),
    );
    const result = applyAggregateMutation(before, finalize(before));

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(Object.keys(result.state.terminalAttempts)).toHaveLength(
      TERMINAL_ATTEMPT_HISTORY_LIMIT,
    );
    expect(result.state.terminalAttempts["attempt-1"]).toBeDefined();
    expect(result.state.terminalAttempts["old-0"]).toBeUndefined();
  });
});

describe("IndexedDbGameRepository failure boundary", () => {
  it("reports an aborted terminal transaction without returning a partial reward/result commit", async () => {
    const state = aggregate();
    const transaction = {
      error: new Error("simulated abort"),
      oncomplete: null as (() => void) | null,
      onabort: null as (() => void) | null,
      onerror: null as (() => void) | null,
      objectStore: () => store,
    };
    const store = {
      get: () => {
        const request = {
          result: state,
          onsuccess: null as (() => void) | null,
          onerror: null,
        };
        queueMicrotask(() => request.onsuccess?.());
        return request;
      },
      put: () => {
        queueMicrotask(() => transaction.onabort?.());
      },
    };
    const database = {
      objectStoreNames: { contains: () => true },
      transaction: () => transaction,
      close: () => undefined,
    };
    const factory = {
      open: () => {
        const request = {
          result: database,
          onsuccess: null as (() => void) | null,
          onerror: null,
          onblocked: null,
          onupgradeneeded: null,
        };
        queueMicrotask(() => request.onsuccess?.());
        return request;
      },
    };
    const repository = new IndexedDbGameRepository({
      indexedDb: factory as unknown as IDBFactory,
    });

    const result = await repository.commit(finalize(state));
    expect(result).toMatchObject({
      ok: false,
      kind: "error",
      code: "storage-failure",
    });
    expect(state.terminalAttempts).toEqual({});
    expect(state.archivistProfile.rewardReceipts).toEqual({});
  });
});
