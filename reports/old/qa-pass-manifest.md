# QA Triage + Fix Pass — Output Manifest

Single-shot bundle of every artefact produced by the 2026-04-15 QA triage, fix, and verification run against `FOLDWINK_MANUAL_QA.xlsx`.

## Reports (`reports/`)

| File                       | Purpose                                                                                   |
| -------------------------- | ----------------------------------------------------------------------------------------- |
| `qa_triage_report.md`      | Phase 1: every QA finding classified into 6 buckets with confidence + recommended action. |
| `fix_plan.md`              | Phase 2: A / B / C prioritised fix list.                                                  |
| `post_fix_verification.md` | Phases 5/6: final status table, gate results, readiness verdict.                          |
| `open_questions.md`        | Non-blocking follow-ups.                                                                  |
| `qa-pass-manifest.md`      | This file.                                                                                |

## Code changes (Phase 3)

| File                                     | Change                                                                                      |
| ---------------------------------------- | ------------------------------------------------------------------------------------------- |
| `src/components/GameTimer.tsx`           | **A1** timer visibility fix (`text-sm text-text font-semibold tabular-nums`).               |
| `src/game/state/store.ts`                | **A2** `startDaily` now restricts candidate pool to tiers the player has actually unlocked. |
| `src/game/state/__tests__/store.test.ts` | +2 daily-routing regression tests.                                                          |
| `src/components/Onboarding.tsx`          | **A3** picture caption + three clean tier bullets (Easy / Medium / Master Challenge).       |
| `src/components/ShareButton.tsx`         | **A4** share cancellation no longer cascades into PNG download.                             |
| `src/stats/persistence.ts`               | **A5** `clearAllLocalData()` — wipes every `foldwink:` localStorage key.                    |
| `src/components/AboutFooter.tsx`         | **A5** two-tap "Reset all local data" button.                                               |
| `src/components/Card.tsx`                | **B1** solved-card shape marker legible (`text-xs opacity-90`).                             |
| `docs/KNOWN_LIMITATIONS.md`              | C1 / C2 / C3 documented, timer entry updated.                                               |
| `package.json`                           | +`test:e2e` script.                                                                         |

## Tests added (Phase 4)

| File                                  | Purpose                                                                          |
| ------------------------------------- | -------------------------------------------------------------------------------- |
| `tests/e2e/lib/harness.mjs`           | Minimal Playwright harness (no `@playwright/test` dep).                          |
| `tests/e2e/progression-validator.mjs` | 8 cases — daily routing, unlock gating, reset, reload.                           |
| `tests/e2e/gameplay-smoke.mjs`        | 8 cases — onboarding, timer contrast, selection caps, double-submit guard, quit. |
| `tests/e2e/responsive-smoke.mjs`      | 5 cases — 1280 × 800 / 390 × 844 / 320 × 568, no horizontal overflow.            |
| `tests/e2e/itch-embed-smoke.mjs`      | 5 cases — relative assets, stripped `navigator.share`, no dev-host leaks.        |
| `tests/e2e/run-all.mjs`               | Runner: spawns `vite preview` on :4175, runs agents, kills server.               |

## QA data & helpers

| File                           | Purpose                                                                 |
| ------------------------------ | ----------------------------------------------------------------------- |
| `scripts/dump-qa-xlsx.py`      | stdlib-only xlsx → JSON dumper.                                         |
| `test/qa-dump.json`            | Raw dump of the QA workbook, used as triage input.                      |
| `test/FOLDWINK_MANUAL_QA.xlsx` | The original workbook (copy of `docs/reports/FOLDWINK_MANUAL_QA.xlsx`). |

## Gates on this bundle

- `npm run typecheck` — PASS
- `npm test` — 110 / 110
- `npm run build` — PASS (325 kB JS / 104 kB gzip)
- `npm run test:e2e` — 26 / 26 across four agents
