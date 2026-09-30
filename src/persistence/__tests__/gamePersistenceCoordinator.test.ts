import { describe, expect, it } from "vitest";
import { INITIAL_STATS } from "../../game/types/stats";
import type { ActiveGame } from "../../game/types/game";
import type { Puzzle } from "../../game/types/puzzle";
import { INITIAL_PROFILE } from "../../progression/archivistProfile";
import {
  applyAggregateMutation,
  type AggregateMutation,
  type PersistedAggregateV2,
  type PersistedPalimpsestSession,
} from "../gameRepository";
import {
  GamePersistenceCoordinator,
  type GameRepositoryWriter,
} from "../gamePersistenceCoordinator";

function aggregate(): PersistedAggregateV2 {
  return {
    schemaVersion: 2,
    profileRevision: 1,
    activeSession: null,
    pendingResultAttemptId: null,
    terminalAttempts: {},
    stats: { ...INITIAL_STATS },
    standardProgress: { cursor: 0 },
    dailyHistory: {},
    onboarded: true,
    archivistProfile: { ...INITIAL_PROFILE, consumedRewardKeys: [], rewardReceipts: {} },
  };
}

function game(revision = 0): ActiveGame {
  return {
    attemptId: "attempt-1",
    revision,
    context: "practice",
    rules: {
      version: 1,
      maxIncorrectGuesses: 4,
      tabsEnabled: false,
      maxWinks: 0,
      timerPresentation: "optional",
    },
    startedLocalDate: "2026-09-14",
    puzzleId: "puzzle-1",
    mode: "standard",
    order: ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p"],
    selection: [],
    solvedGroupIds: [],
    mistakesUsed: 0,
    startedAt: 100,
    countsToStats: true,
    incorrectGuessSignatures: [],
    winkedGroupId: null,
  };
}

const puzzle: Puzzle = {
  id: "puzzle-1",
  title: "Fixture",
  difficulty: "easy",
  groups: [
    { id: "g1", label: "G1", items: ["a", "b", "c", "d"] },
    { id: "g2", label: "G2", items: ["e", "f", "g", "h"] },
    { id: "g3", label: "G3", items: ["i", "j", "k", "l"] },
    { id: "g4", label: "G4", items: ["m", "n", "o", "p"] },
  ],
};

function palimpsestSession(): PersistedPalimpsestSession {
  return {
    puzzleId: "palimpsest_en_01",
    language: "en",
    stage: "reverse",
    order: ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p"],
    selection: ["a", "b", "c"],
    solvedGroupIds: ["reverse_group_1", "reverse_group_2"],
    mistakesUsed: 3,
    savedAt: 321,
  };
}

class MemoryRepository implements GameRepositoryWriter {
  state = aggregate();
  mutations: AggregateMutation[] = [];

  async commit(mutation: AggregateMutation) {
    this.mutations.push(mutation);
    const result = applyAggregateMutation(this.state, mutation);
    if (result.ok) this.state = result.state;
    return result;
  }
}

class FailingRepository implements GameRepositoryWriter {
  async commit() {
    return {
      ok: false as const,
      kind: "error" as const,
      code: "storage-failure" as const,
      message: "quota",
    };
  }
}

describe("GamePersistenceCoordinator", () => {
  it("flushes a legacy passport projection and reports storage failure", async () => {
    const details = {
      playerSeed: "imported-seed",
      sealId: "seal_compass",
      nibId: "nib_obsidian",
      titleId: "title_connections",
      collectedStampIds: ["stamp_midori_compass"],
    };
    const repository = new MemoryRepository();
    const coordinator = new GamePersistenceCoordinator(repository, repository.state);
    await expect(coordinator.importLegacyPassport(details)).resolves.toBe(true);
    expect(repository.state.archivistProfile).toMatchObject({
      playerSeed: "imported-seed",
      sealId: "seal_compass",
      nibId: "nib_obsidian",
      titleId: "title_connections",
    });
    expect(repository.state.archivistProfile.collectedStampIds).toContain(
      "stamp_midori_compass",
    );

    const failing = new GamePersistenceCoordinator(new FailingRepository(), aggregate());
    await expect(failing.importLegacyPassport(details)).resolves.toBe(false);
  });

  it("reports an unsuccessful flush after a repository failure", async () => {
    const coordinator = new GamePersistenceCoordinator(new FailingRepository(), aggregate());
    expect(coordinator.start(game(0), puzzle, 100, { cursor: 0 })).toBe(true);
    await expect(coordinator.flush()).resolves.toBe(false);
  });

  it("serializes start, moves and terminal reward into the aggregate", async () => {
    const repository = new MemoryRepository();
    const coordinator = new GamePersistenceCoordinator(repository, repository.state);

    expect(
      coordinator.start(game(0), puzzle, 100, {
        cursor: 0,
        selectionSequence: 1,
        seenLineageIds: [puzzle.id],
      }),
    ).toBe(true);
    expect(coordinator.save({ ...game(1), selection: ["a"] }, puzzle, 110)).toBe(true);
    const receipt = coordinator.previewReward({
      language: "en",
      lineageId: puzzle.id,
      context: "practice",
      result: "win",
    });
    expect(
      coordinator.finalize({
        active: {
          ...game(2),
          result: "win",
          endedAt: 200,
          solvedGroupIds: ["g1", "g2", "g3", "g4"],
        },
        puzzle,
        language: "en",
        stats: { ...INITIAL_STATS, gamesPlayed: 1, wins: 1 },
        standardProgress: {
          cursor: 1,
          selectionSequence: 1,
          seenLineageIds: [puzzle.id],
        },
        onboarded: true,
        todayDailyRecord: null,
        rewardReceipt: receipt,
      }),
    ).toBe(true);

    await coordinator.flush();

    expect(repository.mutations.map((mutation) => mutation.kind)).toEqual([
      "startAttempt",
      "saveInProgress",
      "finalizeAttempt",
    ]);
    const startMutation = repository.mutations[0];
    expect(startMutation.kind).toBe("startAttempt");
    if (startMutation.kind === "startAttempt") {
      expect(startMutation.session.puzzleSnapshot).toEqual(puzzle);
    }
    const finalizeMutation = repository.mutations[2];
    expect(finalizeMutation.kind).toBe("finalizeAttempt");
    if (finalizeMutation.kind === "finalizeAttempt") {
      expect(finalizeMutation.terminalAttempt.puzzleSnapshot).toEqual(puzzle);
    }
    expect(repository.state.activeSession).toBeNull();
    expect(repository.state.pendingResultAttemptId).toBe("attempt-1");
    expect(repository.state.stats.gamesPlayed).toBe(1);
    expect(repository.state.standardProgress.selectionSequence).toBe(1);
    expect(repository.state.archivistProfile.xp).toBe(80);
    expect(repository.state.archivistProfile.consumedRewardKeys).toEqual([
      "unique-solve:en:puzzle-1",
    ]);
    expect(Object.keys(repository.state.terminalAttempts)).toEqual(["attempt-1"]);

    expect(coordinator.acknowledgeResult("attempt-1")).toBe(true);
    await coordinator.flush();
    expect(repository.state.pendingResultAttemptId).toBeNull();
    expect(repository.mutations.at(-1)?.kind).toBe("acknowledgeResult");
  });

  it("turns leaving an unfinished game into one immutable abandoned attempt", async () => {
    const repository = new MemoryRepository();
    const coordinator = new GamePersistenceCoordinator(repository, repository.state);

    coordinator.start(game(0), puzzle, 100, { cursor: 0 });
    coordinator.abandon(game(0), 150);
    await coordinator.flush();

    expect(repository.state.activeSession).toBeNull();
    expect(repository.state.terminalAttempts["attempt-1"]).toMatchObject({
      result: "abandoned",
      revision: 1,
    });
  });

  it("stores the exact Daily puzzle snapshot with the completed calendar record", async () => {
    const repository = new MemoryRepository();
    const coordinator = new GamePersistenceCoordinator(repository, repository.state);
    const dailyGame: ActiveGame = {
      ...game(0),
      mode: "daily",
      context: "daily",
      puzzleRef: {
        language: "en",
        puzzleId: puzzle.id,
        lineageId: puzzle.id,
        contentVersion: "test-catalog-v1",
      },
      daily: {
        entryId: "daily-en-2026-09-14",
        date: "2026-09-14",
        scheduleVersion: "test-calendar-v1",
      },
    };

    coordinator.start(dailyGame, puzzle, 100, { cursor: 0 });
    coordinator.finalize({
      active: {
        ...dailyGame,
        revision: 1,
        result: "win",
        endedAt: 200,
        solvedGroupIds: ["g1", "g2", "g3", "g4"],
      },
      puzzle,
      language: "en",
      stats: { ...INITIAL_STATS, gamesPlayed: 1, wins: 1 },
      standardProgress: { cursor: 0 },
      onboarded: true,
      todayDailyRecord: {
        date: "2026-09-14",
        puzzleId: puzzle.id,
        result: "win",
        mistakesUsed: 0,
        durationMs: 100,
      },
      rewardReceipt: null,
    });

    await coordinator.flush();

    expect(repository.state.dailyHistory["en:2026-09-14"]).toMatchObject({
      puzzleId: puzzle.id,
      puzzleSnapshot: puzzle,
      attemptId: "attempt-1",
    });
  });

  it("resumes an exact Palimpsest layer after reload and clears it with one cosmetic stamp", async () => {
    const repository = new MemoryRepository();
    const firstTab = new GamePersistenceCoordinator(repository, repository.state);
    const saved = palimpsestSession();

    expect(firstTab.savePalimpsest(saved)).toBe(true);
    await expect(firstTab.flush()).resolves.toBe(true);

    // A fresh coordinator models a page reload from the durable aggregate.
    const reloadedTab = new GamePersistenceCoordinator(repository, repository.state);
    expect(reloadedTab.palimpsestSession("en", "palimpsest_en_01")).toEqual(saved);

    const before = repository.state.archivistProfile;
    expect(reloadedTab.completePalimpsest("en", "palimpsest_en_01")).toBe(true);
    await expect(reloadedTab.flush()).resolves.toBe(true);

    expect(repository.state.palimpsestSession).toBeNull();
    expect(repository.state.archivistProfile.collectedStampIds).toContain("stamp_palimpsest");
    expect(repository.state.archivistProfile.xp).toBe(before.xp);
    expect(repository.state.archivistProfile.ink).toBe(before.ink);
    expect(repository.state.archivistProfile.wax).toBe(before.wax);

    // A stale repository retry is explicitly idempotent, even with an old CAS revision.
    const staleRetry = applyAggregateMutation(repository.state, {
      kind: "completePalimpsest",
      commandId: "complete-palimpsest:en:palimpsest_en_01",
      expectedProfileRevision: 0,
      expectedActiveAttemptId: null,
      language: "en",
      puzzleId: "palimpsest_en_01",
      stampId: "stamp_palimpsest",
    });
    expect(staleRetry).toMatchObject({ ok: true, idempotent: true });

    // A second UI completion after reload has no session to clear and cannot farm a stamp.
    const repeatedTab = new GamePersistenceCoordinator(repository, repository.state);
    expect(repeatedTab.completePalimpsest("en", "palimpsest_en_01")).toBe(false);
    expect(repository.state.archivistProfile.collectedStampIds).toEqual(
      expect.arrayContaining(["stamp_palimpsest"]),
    );
    expect(
      repository.state.archivistProfile.collectedStampIds.filter(
        (stampId) => stampId === "stamp_palimpsest",
      ),
    ).toHaveLength(1);
  });
});
