# Foldwink — Post-fix Verification Report

- **Triage input:** `reports/qa_triage_report.md`
- **Fix plan:** `reports/fix_plan.md`
- **Verification date:** 2026-04-15
- **Build under test:** local `main` + this working copy (post-haptics 0.6.1, pre-tag 0.6.2)
- **Pipelines run:** `npm run typecheck` · `npm test` (Vitest, unit) · `npm run build` · `npm run test:e2e` (Playwright, 4 agents)

## Gate results

| Gate                | Result                                              |
| ------------------- | --------------------------------------------------- |
| `npm run typecheck` | PASS                                                |
| `npm test`          | **110 / 110** (was 108, +2 new daily-routing tests) |
| `npm run build`     | PASS (325 kB JS / 104 kB gzip)                      |
| `npm run test:e2e`  | **26 / 26** across four agents                      |

### e2e breakdown

| Agent                   | Cases | Result                                                                                                                           |
| ----------------------- | ----- | -------------------------------------------------------------------------------------------------------------------------------- |
| `progression-validator` | 8     | PASS — incl. "Daily opens Easy in fresh state", "Reset wipes all data and restores onboarding", "reload mid-game preserves tier" |
| `gameplay-smoke`        | 8     | PASS — incl. timer contrast assertion, selection cap, rapid-tap stability, double-submit guard                                   |
| `responsive-smoke`      | 5     | PASS at 1280 × 800, 390 × 844, 320 × 568                                                                                         |
| `itch-embed-smoke`      | 5     | PASS — relative asset paths, `navigator.share` stripped → graceful fallback, no dev-host leaks                                   |

## Final status table

| Item                                                      | Status             | Evidence                                                                                                                                                                                                                                                                                                                      | Next action                                                                 |
| --------------------------------------------------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| **A1** Timer visibility (D-07, M-06)                      | **fixed**          | `src/components/GameTimer.tsx` — bumped to `text-sm text-text font-semibold tabular-nums`. `gameplay-smoke` asserts RGB channel sum > 500 and positive bounding box on desktop + mobile viewports.                                                                                                                            | —                                                                           |
| **A2** Daily routing leaks into locked tier (D-05)        | **fixed**          | `src/game/state/store.ts` — `startDaily` now builds an `eligible` pool from tiers the player has unlocked (always easy; medium if `mediumReadiness.unlocked`; hard if `hardReadiness.unlocked && hasContent`). Two new Vitest cases + `progression-validator` case "fresh state: Daily opens Easy".                           | —                                                                           |
| **A3** Onboarding tier ladder unclear (D-03)              | **fixed**          | `src/components/Onboarding.tsx` — added caption under demo picture ("Medium puzzle shown — Tabs preview the 4 categories"), split compound tier bullet into three clean bullets for Easy / Medium / Master Challenge. `gameplay-smoke` asserts "Master Challenge" appears in the modal text.                                  | —                                                                           |
| **A4** Cancelled share triggers PNG save (M-07)           | **fixed**          | `src/components/ShareButton.tsx` — `tryShareFile` now returns `ShareOutcome` (`shared \| unsupported \| failed \| cancelled`); `cancelled` exits the flow instead of cascading to clipboard → download. `itch-embed-smoke` exercises the `navigator.share`-absent path.                                                       | —                                                                           |
| **A5** "Clear local data" affordance missing (D-20, E-04) | **fixed**          | `src/stats/persistence.ts` — `clearAllLocalData()` scans and wipes every `foldwink:` localStorage key. `src/components/AboutFooter.tsx` — new two-tap "Reset all local data" button next to the narrower "Clear local event log". `progression-validator` exercises the full flow including the post-reset onboarding return. | —                                                                           |
| **B1** Solved-card shape marker invisible (D-10)          | **fixed**          | `src/components/Card.tsx` — marker bumped to `text-xs opacity-90`. Visual-only change, no test case (would add fragility without catching real regressions).                                                                                                                                                                  | Human visual check on-device.                                               |
| **C1** Arrow-key grid nav missing (D-18)                  | **deferred**       | QA row triaged as CONFIRMED_BUG but accessibility enhancement; Tab / Enter / Space all work (D-19 PASS).                                                                                                                                                                                                                      | Documented in `docs/KNOWN_LIMITATIONS.md`. Schedule for post-1.0 a11y pass. |
| **C2** Onboarding only per-origin (D-02)                  | **not-a-bug**      | Standard browser behavior: localStorage is scoped per origin.                                                                                                                                                                                                                                                                 | Documented in `docs/KNOWN_LIMITATIONS.md`.                                  |
| **C3** Launcher-page console noise (D-01)                 | **not-a-bug**      | Datadog / Facebook / Intercom come from `neural-void.com` launcher, not the game bundle. `itch-embed-smoke` asserts the game bundle produces zero console errors when loaded directly.                                                                                                                                        | Documented.                                                                 |
| **C4** "STANDARD" share-card subtitle (D-12)              | **deferred**       | Copy polish only.                                                                                                                                                                                                                                                                                                             | Subsume in future share-card polish pass.                                   |
| **C5** Share-card text-over-squares (D-12)                | **not-reproduced** | Not observed during fix pass. Preview at `scripts/preview-share-cards.html` still loads cleanly.                                                                                                                                                                                                                              | Re-check if QA flags it again.                                              |
| **C6** Tier-transition fanfare (M-05)                     | **rejected**       | Contradicts the subtle audio palette (`docs/SOUND_DESIGN.md`, `sound.ts`).                                                                                                                                                                                                                                                    | —                                                                           |
| **C7** Auto-solve last group (D-06)                       | **not-a-bug**      | Standard Connections-style behaviour; `isWin` triggers when 4 groups are solved, and the last group collapses naturally because only 4 cards remain.                                                                                                                                                                          | Leave as-is.                                                                |
| **C8** "Master Challenge — soon" label (D-05b)            | **test-artifact**  | Current `main` ships 20 hard puzzles → `hasContent=true` → label is "locked" or active. Tester saw stale deploy.                                                                                                                                                                                                              | Retest on fresh deploy.                                                     |
| **D-18 Horizontal overflow at 1280+** (D-21)              | **verified-clean** | `responsive-smoke` asserts no horizontal scroll at 1280 × 800, 390 × 844, and 320 × 568.                                                                                                                                                                                                                                      | —                                                                           |

## Suspicion-driven checks the brief asked for

> "opening cards / solving groups can incorrectly trigger tier transitions"

**Not found.** Traced the Zustand store (`src/game/state/store.ts`): tier cursors (`easyCursor`, `mediumCursor`, `hardCursor`) only advance inside `submit` when `active.mode === "standard"` AND `result === "win"` AND `active.countsToStats`. `startDaily`, `startEasy`, `startMedium`, `startHard`, `toggleSelection`, `clearSelection`, `goToMenu`, and `winkTab` never touch cursors. `progression-validator` case "opening cards then quitting does not advance any cursor" guards against future regressions here.

> "starting a game after a previous session can inherit wrong difficulty"

**Not found.** `tryResumeSession` in `appStore.ts` defensively validates `session.active.puzzleId === puzzle.id` and drops the session if the puzzle is no longer in the pool. It does not mutate progress, stats, or difficulty; it only restores the exact same active game.

## Readiness verdict

| Surface         | Verdict   | Rationale                                                                                                                                                                                                                                                            |
| --------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Manual QA       | **safer** | Testers now have a working "Reset all local data" button — they no longer need to dive into browser devtools to rewind state between scenarios. Daily will not surprise them with a locked tier. Timer is legible, so timer-related asserts are no longer ambiguous. |
| Mobile launch   | **safer** | Timer readable at 390 and 320 widths (verified). Share cancellation on iOS respects user intent. Haptics layer (from 0.6.1) already in main.                                                                                                                         |
| itch.io release | **safer** | `itch-embed-smoke` confirms relative asset paths, stripped-`navigator.share` fallback, and no dev-host leaks. The embed hasn't been uploaded yet — only the subpath / iframe properties that matter are proven.                                                      |

## Remaining open risks

1. **Human audio + visual QA (Sound / Visual / Share-card sheets) not executed.** 30 test slots in the original workbook remain empty. Not a bug surface; out of this pass's scope. Tracked in `reports/open_questions.md`.
2. **Arrow-key grid navigation (D-18).** Deferred to a dedicated a11y pass. Current Tab / Enter / Space path is functional.
3. **Real itch.io upload + embed** — only approximated here. One final upload test on a staging itch page is still recommended before publishing.
4. **Stale deploy at neural-void.com** — several QA notes appeared to reflect an older build. The current GitHub Pages build (`sunlike78.github.io/foldwink/`) is the authoritative one.

## Next action

Tag as 0.6.2 when this working copy is ready to ship. The two in-pass commits would be (a) haptics + polish (already committed at `ffd4c30`) and (b) this QA-triage fix pass. Both safe to deploy via the existing GitHub Pages workflow.
