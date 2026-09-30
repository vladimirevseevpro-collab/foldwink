# Foldwink W1 — Attempt and Reward Integrity

Date: 2026-09-14  
Status: **COMPLETE / GO for W2**

## Sprint Summary

This increment implements the first safe W1 slice without adding a runtime dependency:

- every new game has an attempt id, revision, context, frozen local start date and rules snapshot;
- repeated submission of the same wrong quartet is non-consuming and receives explicit localized feedback;
- the terminal threshold now comes from the attempt rules; the no-wager Mastery attempt allows one wrong quartet and loses on the second;
- the visible solve reward is a deterministic `+80 XP` unique-lineage receipt and is no longer created during React render;
- replay, duel/custom and other ineligible contexts cannot farm the receipt;
- a pending legacy contract wager is refunded once with a migration receipt;
- the native IndexedDB aggregate is now the production bootstrap/write authority; it serializes revisions and commits terminal attempt, stats, profile and reward receipt in one transaction;
- deterministic legacy-to-v2 migration, a bounded 500-attempt diagnostic history, a real two-tab Chromium transaction race and mid-game reload without the legacy session mirror are covered;
- the first migration preserves one immutable, versioned pre-migration snapshot and does not delete the source compatibility data;
- extension storage is hydrated before Zustand reads initial persistence;
- the Mastery dialog now exposes dialog semantics, initial focus, a focus trap, Escape dismissal and return focus;
- storage-unavailable and cross-tab conflict states are visible, localized alerts rather than silent fallback; conflict offers an explicit reload action;
- Clear all data removes both IndexedDB and compatibility keys;
- visual QA exposed an existing 390px horizontal overflow from the decorative grid halo; its mobile inset is now bounded.
- terminal completion now writes a durable `pendingResultAttemptId`; reload reconstructs the exact read-only Result and reuses the stored reward or denial receipt without recalculation;
- leaving Result acknowledges only the presentation pointer, retaining terminal history, stats and reward receipt;
- the automatic Game → Result transition waits for a successful repository flush; a storage failure requires an explicitly labelled unsaved-result action;
- malformed aggregates, attempts, daily records, stats and receipts enter a distinct recovery path instead of being replaced by defaults;
- recovery preserves and downloads a local diagnostic snapshot, while destructive clear is confirmation-gated and CAS-protected against a stale second tab.

W1's integrity gate is closed. Compatibility localStorage observers remain migration mirrors but are not authoritative when a valid v2 aggregate exists. Full user backup/import, merge preview and profile transfer remain intentionally assigned to FW-026/W5; W1 implements only corruption-safe diagnostic export and confirmed reset.

## Changed Files

Core integrity:

- `src/game/types/game.ts`
- `src/game/engine/submit.ts`
- `src/game/engine/progress.ts`
- `src/game/state/store.ts`
- `src/game/application/rewardPolicy.ts`
- `src/analytics/eventLog.ts`

Persistence and migration foundation:

- `src/persistence/gameRepository.ts`
- `src/persistence/legacyMigration.ts`
- `src/persistence/legacyBackup.ts`
- `src/persistence/gamePersistenceCoordinator.ts`
- `src/persistence/restorePendingResult.ts`
- `src/persistence/corruptRecovery.ts`
- `src/persistence/diagnosticSerialization.ts`
- `src/game/state/appStore.ts`
- `src/app/App.tsx`
- `src/components/AboutFooter.tsx`
- `src/stats/persistence.ts`
- `src/progression/types.ts`
- `src/progression/archivistProfile.ts`

UI and copy:

- `src/screens/GameScreen.tsx`
- `src/screens/ResultScreen.tsx`
- `src/screens/MenuScreen.tsx`
- `src/components/IronContractModal.tsx`
- `src/components/PersistenceRecoveryBanner.tsx`
- `src/i18n/strings.ts`
- `src/styles/index.css`

Tests/evidence/config:

- `src/game/engine/__tests__/progress.test.ts`
- `src/game/state/__tests__/store.test.ts`
- `src/game/state/__tests__/zenMode.test.ts`
- `src/game/application/__tests__/rewardPolicy.test.ts`
- `src/persistence/__tests__/gameRepository.test.ts`
- `src/persistence/__tests__/legacyMigration.test.ts`
- `src/persistence/__tests__/gamePersistenceCoordinator.test.ts`
- `src/persistence/__tests__/restorePendingResult.test.ts`
- `src/persistence/__tests__/diagnosticSerialization.test.ts`
- `src/progression/__tests__/archivistProfile.test.ts`
- `reports/w1-integrity-2026-09-14/`
- `eslint.config.js` (generated report artifacts excluded from production lint)

## Tests Run

- `npm run typecheck` — pass.
- `npm test` — **293/293 pass**, 44 files.
- `npm run lint` — pass. The first run exposed that generated `reports/**` build artifacts were being linted; the artifact root is now ignored consistently with `docs/reports/**`.
- `npm run validate` — pass, EN 1,000 puzzles (523 easy / 443 medium / 34 hard), 1,914 advisory editorial warnings.
- `npm run validate:ru` — pass, RU 1,000 (621 / 379 / 0), 2,026 advisory warnings.
- `npm run validate:de` — pass, DE 1,000 (577 / 423 / 0), 1,554 advisory warnings.
- `npm run build` — pass; sound pack 9 cues / 1,507,596 bytes; Vite build completed. Existing large-chunk warning remains.
- `node reports/w1-integrity-2026-09-14/indexeddb-browser-qa.mjs` against local Vite — pass: exactly one of two concurrent tab starts committed, the other received a `profile-revision` conflict, and a fresh repository instance loaded the winning attempt at profile revision 2.
- `node reports/w1-integrity-2026-09-14/persistence-warning-qa.mjs` — pass at 1440×900, 1024×768 and 390×844 for unavailable storage and real competing-tab conflict; alerts remained overflow-free.
- `node reports/w1-integrity-2026-09-14/terminal-recovery-qa.mjs` — pass at all three viewports: terminal Result survives reload with unchanged XP/receipt/history, acknowledgement clears only the pending pointer, corrupt data is downloadable, and a stale-tab clear cannot delete a newly valid aggregate.
- `node reports/w1-integrity-2026-09-14/unsaved-terminal-qa.mjs` — pass at all three viewports: failed/unavailable storage never auto-opens Result; the explicitly labelled temporary action is visible and overflow-free.

## Manual QA Notes

Automated Playwright interaction was followed by visual inspection of the actual PNGs:

- desktop 1440×900: Mastery, duplicate quartet and result receipt inspected;
- tablet 1024×768: the same three states inspected;
- mobile 390×844: the same three states inspected after the overflow repair.

Evidence: `reports/w1-integrity-2026-09-14/visual-evidence.json`, `reports/w1-integrity-2026-09-14/indexeddb-browser-evidence.json`, `reports/w1-integrity-2026-09-14/persistence-warning-evidence.json`, `reports/w1-integrity-2026-09-14/terminal-recovery-evidence.json`, `reports/w1-integrity-2026-09-14/unsaved-terminal-evidence.json` and `reports/w1-integrity-2026-09-14/screenshots/`.

Observed invariants in every viewport:

- Mastery dialog has one `role=dialog`; `Start challenge` receives focus;
- Tab and Shift+Tab wrap between its two controls, and close returns focus to the Mastery trigger;
- duplicate quartet feedback is visible and the status remains `Mistakes used 1 of 4` after two identical submissions;
- result shows `+80 XP`; profile contains exactly one `unique-solve:en:puzzle-0001` key;
- after deleting `foldwink:active-session` and reloading, IndexedDB restores the same four selected cards and `Mistakes used 1 of 4`;
- terminal IndexedDB state has XP 80, one reward key, one terminal attempt, gamesPlayed 1 and no active attempt;
- Clear all data leaves no aggregate and no `foldwink:*` compatibility key;
- no tested state has horizontal overflow after the mobile halo fix.
- reloading a completed game leaves XP, reward count and terminal count unchanged and restores the same Result;
- corrupt recovery is readable and operable at every required viewport; stale-tab destructive clear preserves the replacement aggregate;
- terminal storage failure holds on the completed board and exposes `View unsaved result` instead of presenting local XP as committed.

The result page is intentionally vertically scrollable at tablet/mobile height; controls remain in the normal document flow and no clipping was observed.

## Open Risks

1. Attempt signatures still use display strings; W2 must introduce durable item identities and pinned content references.
2. EN/RU/DE validators report substantial advisory editorial queues; structural pass is not balance approval.
3. Main and language chunks still exceed Vite's 500 kB advisory threshold; W6 owns delivery reduction.
4. Full aggregate backup/import/merge remains FW-026/W5 and must preserve W1 reward/daily invariants.

## Go / No-Go for next sprint

**Go for W2.** W1 integrity blockers are closed with unit, real-browser, cross-tab and visual evidence. W2 is now the active line: stable content identity, reviewed starters, versioned Daily calendars and deterministic seen-vs-solved progression. This is not a release-ready claim; human balance, device and staging gates remain later waves.
