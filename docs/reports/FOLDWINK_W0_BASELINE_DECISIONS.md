# Foldwink W0 — Baseline, decisions and regression fixtures

Date: 2026-09-14  
Baseline commit inspected: `e53ec332df81bc01b5159375ddd7b21a04487e0c`  
Status: W0 implementation complete; this is not a release-readiness claim.

## Sprint Summary

W0 replaced conflicting historical execution guidance with the September W0–W8 implementation contract. The live content inventory was measured from the filesystem: 1,000 JSON puzzles in EN, 1,000 in RU and 1,000 in DE. This inventory does not imply editorial approval.

Two decisions were accepted: ADR-001 preserves the real expanded product and gates later dependencies; ADR-002 selects native IndexedDB as the atomic W1 target while preserving legacy data. The original Claude mega prompt remains intact except for a prominent historical warning.

The first W1 regression seam was also created while closing W0: new attempts receive identity/revision/rules/context fields, repeated incorrect quartets are non-consuming, the Daily completion date is frozen from attempt start, and the deterministic pure reward policy has targeted tests. Reward integration is explicitly an interim compatibility slice until the IndexedDB aggregate is connected.

## Changed Files

W0 documentation:

- `AGENTS.md`
- `docs/FOLDWINK_MASTER_MEGA_PROMPT.md`
- `docs/TODO.md`
- `docs/decisions/ADR-001-product-baseline.md`
- `docs/decisions/ADR-002-persistence.md`
- this report

Regression and first integrity slice:

- `src/game/types/game.ts`
- `src/game/engine/submit.ts`
- `src/game/engine/progress.ts`
- `src/game/state/store.ts`
- `src/game/application/rewardPolicy.ts`
- `src/progression/types.ts`
- `src/progression/archivistProfile.ts`
- `src/screens/GameScreen.tsx`
- `src/screens/ResultScreen.tsx`
- `src/i18n/strings.ts`
- `src/analytics/eventLog.ts`
- corresponding unit tests under `src/**/__tests__/`

No dependency was installed. No puzzle JSON, deployment, payment configuration or production environment was changed. The pre-existing dirty worktree was preserved.

## Tests Run

- `npm run typecheck` — passed after implementation.
- `npm test` — 38 files, 268 tests passed. The first full run correctly exposed one stale Zen test that repeated the same quartet four times; its fixture was changed to four genuinely different wrong guesses, then the full suite passed.
- `npm run validate` — passed structurally: 1,000 EN puzzles; 523 easy, 443 medium, 34 hard; 1,914 advisory items.
- `npm run validate:ru` — passed structurally: 1,000 RU puzzles; 621 easy, 379 medium, 0 hard; 2,026 advisory items.
- `npm run validate:de` — passed structurally: 1,000 DE puzzles; 577 easy, 423 medium, 0 hard; 1,554 advisory items.
- `npm run build` — passed, including audio check and typecheck. Vite emitted its existing large-chunk warning; raw locale chunks remain about 880–981 kB and are a W6 target.

Advisory counts are an editorial queue, not the number of invalid boards. No new full human content review was performed in W0.

## Manual QA Notes

No new visual design was introduced in this wave. Therefore the required future 1440×900, 1024×768 and 390×844 visual acceptance is not claimed here. The new repeated-guess message is user-facing and requires screenshots/keyboard verification before its slice is called visually accepted; it remains an open W1 QA item.

## Open Risks

- The current compatibility reward commit is idempotent for sequential use of one local profile, and ResultScreen no longer creates rewards during render. Stats/profile/receipt are still separate persistence writes; cross-tab and crash atomicity are not yet solved.
- New attempt fields are optional for legacy session hydration. The W1 migration must validate and normalize them before they can become hard invariants.
- Current Daily selection still depends on unlocked tiers and FNV-1a; W2 owns the versioned calendar.
- Current Standard progression remains inadequately calibrated; W2 owns curated starter manifests and band selection.
- RU/DE still contain no native Hard boards. Silent EN fallback must not be presented as localized content.
- Existing validators report large advisory queues, and no human balance/retention result exists yet.
- The repository contains substantial unrelated modified/untracked work. Integration must continue with narrow diffs and no rollback of user changes.

## Go / No-Go for next sprint

**Go for W1 integrity work.** W0 scope, storage target and dependency boundary are explicit, and the full local logic/build gates pass.

**No-Go for calling W1 complete or the product release-ready.** The atomic IndexedDB aggregate, migration fixtures, cross-tab CAS, storage failure behavior, terminal result restoration and required rendered QA are still open.

