import { createStore, defaultDeps, type PersistenceIssue } from "./store";
import {
  loadStats,
  loadProgress,
  loadDailyHistory,
  loadOnboarded,
  loadActiveSession,
  clearActiveSession,
  type StoredSession,
} from "../../stats/persistence";
import { statsPersistenceObserver } from "./persistence/statsObserver";
import { sessionPersistenceObserver } from "./persistence/sessionObserver";
import type { DailyRecord } from "../types/stats";
import type { ActiveGame, AppScreen } from "../types/game";
import type { Puzzle } from "../types/puzzle";
import {
  langGetPuzzleById,
  langGetPuzzleByIdStrict,
  langGetPuzzleByIndex,
  langGetEasyByIndex,
  langGetMediumByIndex,
  langGetHardByIndex,
  langGetEasyRampedByIndex,
  langGetMediumRampedByIndex,
  langGetHardRampedByIndex,
  langGetPool,
  langGetEasyPool,
  langGetMediumPool,
  langGetHardPool,
  ensureLangLoaded,
  ensureNextArchiveChunk,
  ensurePuzzleLoaded,
} from "../../puzzles/byLang";
import { getLangSync, useLangStore } from "../../i18n/useLanguage";
import { todayLocal } from "../../utils/date";
import { setPlayerSeed } from "../../puzzles/progression";
import { initStorageAdapter } from "../../utils/storageAdapter";
import { loadArchivistProfile, saveArchivistProfile } from "../../progression/archivistProfile";
import {
  getDailySlotKey,
  CorruptAggregateError,
  IndexedDbGameRepository,
  type PersistedActiveSession,
  type PersistedAggregateV2,
  type PersistedLanguage,
  type PersistedPalimpsestSession,
} from "../../persistence/gameRepository";
import { migrateLegacySnapshot } from "../../persistence/legacyMigration";
import { saveLegacyMigrationBackupOnce } from "../../persistence/legacyBackup";
import { GamePersistenceCoordinator } from "../../persistence/gamePersistenceCoordinator";
import { preserveCorruptAggregate } from "../../persistence/corruptRecovery";
import { restorePendingResult } from "../../persistence/restorePendingResult";
import { installGameLifecycle } from "./lifecycle";

function initialTodayDailyRecord(history = loadDailyHistory()): DailyRecord | null {
  const today = todayLocal();
  return history[today] ?? null;
}

interface ResumedSession {
  active: ActiveGame;
  puzzle: Puzzle;
  screen: AppScreen;
}

function tryResumeSession(
  session: StoredSession | PersistedActiveSession | null = loadActiveSession(),
): ResumedSession | null {
  if (!session) return null;
  // Only resume games that were in-progress. A finalised game must not come
  // back via the resume path — it lives in stats + daily history instead.
  if (session.active.result) {
    clearActiveSession();
    return null;
  }
  // Resume strictly from the current language pool — no EN fallback here,
  // otherwise a DE/RU session could reopen with English puzzle content after
  // a language switch.
  const puzzle =
    ("puzzleSnapshot" in session ? session.puzzleSnapshot : undefined) ??
    langGetPuzzleByIdStrict(session.puzzleId);
  if (!puzzle) {
    // The runtime archive can be temporarily unavailable offline. Preserve
    // this compact session for a later retry instead of turning a fetch miss
    // into permanent data loss (and never substitute EN content).
    return null;
  }
  if (session.active.puzzleId !== puzzle.id) {
    clearActiveSession();
    return null;
  }
  // W3 makes restoration explicit: the saved board is prepared, while the
  // player chooses Continue from Home instead of being dropped into a puzzle.
  return { active: session.active, puzzle, screen: "menu" };
}

// Hydrate extension-backed storage before any synchronous persistence reads.
// Previously App.tsx started this after the store had already snapshotted its
// initial state, so extension-only saves could be silently missed on launch.
await initStorageAdapter();

// Load selected-language boot content before synchronous store construction.
// A cold-network failure must not reject this module (which would leave a
// blank app); Menu renders its localized unavailable/retry state instead.
let initialContentIssue: "unavailable" | null = null;
try {
  await ensureLangLoaded(getLangSync());
} catch (error) {
  initialContentIssue = "unavailable";
  console.warn(`[puzzles] selected ${getLangSync()} boot content is unavailable:`, error);
}

const repository = new IndexedDbGameRepository();
let aggregate: PersistedAggregateV2 | null = null;
let coordinator: GamePersistenceCoordinator | null = null;
let initialPersistenceIssue: PersistenceIssue = null;

try {
  aggregate = await repository.load();
  if (!aggregate) {
    const legacySnapshot = {
      language: getLangSync(),
      stats: loadStats(),
      standardProgress: loadProgress(),
      dailyHistory: loadDailyHistory(),
      onboarded: loadOnboarded(),
      archivistProfile: loadArchivistProfile(),
      activeSession: loadActiveSession(),
      getPuzzleDifficulty: (puzzleId) => langGetPuzzleByIdStrict(puzzleId)?.difficulty,
    } satisfies Parameters<typeof migrateLegacySnapshot>[0];
    saveLegacyMigrationBackupOnce(legacySnapshot);
    const replacement = migrateLegacySnapshot(legacySnapshot);
    const imported = await repository.commit({
      kind: "importReplace",
      commandId: "legacy-import-v2",
      expectedProfileRevision: 0,
      expectedActiveAttemptId: null,
      replacement,
    });
    if (!imported.ok) throw new Error(`Initial IndexedDB import failed: ${imported.code}`);
    aggregate = imported.state;
  }
  coordinator = new GamePersistenceCoordinator(repository, aggregate, {
    // LocalStorage/chrome.storage remain a compatibility mirror while the
    // Passport UI is moved to the aggregate in the next W1 slice.
    onCommitted: (state) => saveArchivistProfile(state.archivistProfile),
    onConflict: (conflict) => {
      console.warn(`[persistence] cross-tab conflict: ${conflict.code}`);
      useGameStore.setState({ persistenceIssue: "conflict" });
    },
    onError: (error) => {
      console.warn(`[persistence] ${error.code}: ${error.message}`);
      useGameStore.setState({ persistenceIssue: "storage-error" });
    },
  });
} catch (error) {
  repository.close();
  if (error instanceof CorruptAggregateError) {
    preserveCorruptAggregate(error.raw, error.message);
    initialPersistenceIssue = "corrupt";
  } else {
    initialPersistenceIssue = "unavailable";
  }
  console.warn(
    `[persistence] IndexedDB ${initialPersistenceIssue}; using compatibility storage: ${
      error instanceof Error ? error.message : String(error)
    }`,
  );
}

const aggregateTodayRecord = aggregate
  ? (aggregate.dailyHistory[getDailySlotKey(getLangSync(), todayLocal())] ?? null)
  : null;
// A snapshot is authoritative and requires no network. Older compact
// sessions retain only an id, so load exactly its selected-language archive
// asset before the strict resume lookup. Failure leaves the stored session
// untouched; the normal unavailable path is preferable to replacing it with
// an English board or silently discarding progress.
const pendingResume = aggregate?.activeSession ?? loadActiveSession();
if (pendingResume && !("puzzleSnapshot" in pendingResume && pendingResume.puzzleSnapshot)) {
  try {
    await ensurePuzzleLoaded(getLangSync(), pendingResume.puzzleId);
  } catch (error) {
    console.warn(
      `[puzzles] unable to load saved ${getLangSync()} puzzle ${pendingResume.puzzleId}:`,
      error,
    );
  }
}
const restoredResult = restorePendingResult(aggregate, langGetPuzzleByIdStrict);
const resumedResult = restoredResult ? { ...restoredResult, screen: "result" as const } : null;
const resumed = resumedResult ?? tryResumeSession(pendingResume);

export const useGameStore = createStore({
  ...defaultDeps,
  getPuzzleById: langGetPuzzleById,
  getPuzzleByIndex: langGetPuzzleByIndex,
  getEasyByIndex: langGetEasyByIndex,
  getMediumByIndex: langGetMediumByIndex,
  getHardByIndex: langGetHardByIndex,
  getEasyRampedByIndex: langGetEasyRampedByIndex,
  getMediumRampedByIndex: langGetMediumRampedByIndex,
  getHardRampedByIndex: langGetHardRampedByIndex,
  getPool: langGetPool,
  getEasyPool: langGetEasyPool,
  getMediumPool: langGetMediumPool,
  getHardPool: langGetHardPool,
  initialStats: aggregate?.stats ?? loadStats(),
  initialProgress: aggregate?.standardProgress ?? loadProgress(),
  initialTodayDailyRecord: aggregate ? aggregateTodayRecord : initialTodayDailyRecord(),
  initialOnboarded: aggregate?.onboarded ?? loadOnboarded(),
  initialActive: resumed?.active ?? null,
  initialPuzzle: resumed?.puzzle ?? null,
  initialScreen: resumed?.screen ?? "menu",
  initialSummary: resumedResult?.summary ?? null,
  initialRewardReceipt: resumedResult?.rewardReceipt ?? null,
  initialPersistenceIssue,
  initialContentIssue,
  commitReward: coordinator
    ? (input) => coordinator!.previewReward(input)
    : defaultDeps.commitReward,
  commitCollectible: coordinator
    ? (stampId) => coordinator!.collectStamp(stampId)
    : (stampId) => {
        const profile = loadArchivistProfile();
        if (!profile.collectedStampIds.includes(stampId)) {
          saveArchivistProfile({
            ...profile,
            collectedStampIds: [...profile.collectedStampIds, stampId],
          });
        }
        return true;
      },
  commitProfileCosmetic: coordinator
    ? (field, value) => coordinator!.updateProfileCosmetic(field, value)
    : (field, value) => {
        saveArchivistProfile({ ...loadArchivistProfile(), [field]: value });
        return true;
      },
  commitLegacyPassport: coordinator
    ? async (details) => {
        const committed = await coordinator!.importLegacyPassport(details);
        if (committed && details.playerSeed) setPlayerSeed(details.playerSeed);
        return committed;
      }
    : async () => false,
  scheduleTransition: (cb, ms) => {
    const runAfterPersistence = () => {
      if (!coordinator) return;
      void coordinator.flush().then((committed) => {
        if (committed) cb();
      });
    };
    if (typeof window === "undefined") {
      runAfterPersistence();
      return;
    }
    window.setTimeout(runAfterPersistence, ms);
  },
});

/** Explicit recovery path for a failed manifest/boot request. */
export async function retryRuntimeContent(): Promise<boolean> {
  const language = getLangSync();
  try {
    await ensureLangLoaded(language);
    useGameStore.setState({ contentIssue: null, poolSize: langGetPool().length });
    return true;
  } catch (error) {
    console.warn(`[puzzles] retry failed for ${language}:`, error);
    useGameStore.setState({ contentIssue: "unavailable", poolSize: 0 });
    return false;
  }
}

/** Narrow persistence seam for the standalone Palimpsest modal. */
export function loadPalimpsestResume(
  language: PersistedLanguage,
  puzzleId: string,
): PersistedPalimpsestSession | null {
  return coordinator?.palimpsestSession(language, puzzleId) ?? null;
}

export function savePalimpsestResume(session: PersistedPalimpsestSession): boolean {
  return coordinator?.savePalimpsest(session) ?? false;
}

export function completePalimpsestResume(
  language: PersistedLanguage,
  puzzleId: string,
): boolean {
  return coordinator?.completePalimpsest(language, puzzleId) ?? false;
}

/**
 * Awaits the durable aggregate write before a player-triggered app refresh.
 * Without IndexedDB coordination we cannot honestly promise a safe update.
 */
export async function flushGamePersistence(): Promise<boolean> {
  return coordinator ? coordinator.flush() : false;
}

// Persistence is split into two narrow observers so tests can exercise
// each policy independently (stats vs mid-game session).
statsPersistenceObserver(useGameStore);
sessionPersistenceObserver(useGameStore);

// This is deliberately independent of IndexedDB availability: a failed
// persistence backend must not stop bounded content progression.
let prefetchedAttemptId: string | undefined;
useGameStore.subscribe((state) => {
  const attemptId = state.active?.attemptId;
  if (!attemptId || attemptId === prefetchedAttemptId) return;
  prefetchedAttemptId = attemptId;
  void ensureNextArchiveChunk(getLangSync())
    .then(() => useGameStore.setState({ poolSize: langGetPool().length }))
    .catch((error) =>
      console.warn(`[puzzles] next ${getLangSync()} archive chunk is unavailable:`, error),
    );
});

if (coordinator) {
  let previous = useGameStore.getState();
  useGameStore.subscribe((state) => {
    const before = previous.active;
    const current = state.active;
    const persistence = coordinator!;

    if (
      before?.result &&
      before.attemptId &&
      previous.screen === "result" &&
      state.screen !== "result" &&
      (!current || current.attemptId === before.attemptId)
    ) {
      persistence.acknowledgeResult(before.attemptId);
    }

    if (current && state.puzzle && current !== before) {
      if (current.result) {
        persistence.finalize({
          active: current,
          puzzle: state.puzzle,
          language: getLangSync(),
          stats: state.stats,
          standardProgress: state.progress,
          onboarded: state.onboarded,
          todayDailyRecord: state.todayDailyRecord,
          rewardReceipt: state.rewardReceipt,
        });
      } else if (!before || before.attemptId !== current.attemptId) {
        if (before && !before.result) persistence.abandon(before, Date.now());
        persistence.start(current, state.puzzle, Date.now(), state.progress);
      } else if (before.revision !== current.revision) {
        persistence.save(current, state.puzzle, Date.now());
      }
    } else if (!current && before && !before.result) {
      persistence.abandon(before, Date.now());
    }

    previous = state;
  });
}

// Foreground intervals and the open-tab daily rollover are UI lifecycle
// concerns. Keeping the observer beside the app store makes them available to
// both the normal UI and extension shell without a render-time side effect.
installGameLifecycle(useGameStore);

// When the player switches language, an in-flight game would carry its
// original-language puzzle into a different-language chrome (English title
// under Russian UI, etc.). Drop any active/resumable game and send them back
// to the menu so the next action starts in the new language pool.
let prevLang = useLangStore.getState().lang;
useLangStore.subscribe((state) => {
  if (state.lang === prevLang) return;
  prevLang = state.lang;
  const game = useGameStore.getState();
  if (game.active || game.screen === "game" || game.screen === "result") {
    game.goToMenu();
  }
  clearActiveSession();
  useGameStore.setState({ contentIssue: null, poolSize: 0 });
  void ensureLangLoaded(state.lang)
    .then(() => useGameStore.setState({ contentIssue: null, poolSize: langGetPool().length }))
    .catch((err) => {
      console.warn(`[lang] failed to load ${state.lang} pool:`, err);
      useGameStore.setState({ contentIssue: "unavailable", poolSize: 0 });
    });
});
