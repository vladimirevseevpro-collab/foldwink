# Foldwink — Open Questions After QA Triage

Unanswered items that surfaced while triaging `test/FOLDWINK_MANUAL_QA.xlsx`. None of these block release; all are tracked here so the next session has a clear list.

## Product decisions still outstanding

1. **Should Daily always be Easy only, or scale with unlocks?** This pass implemented "scale with unlocks" (Easy always, Medium after Medium-unlock, Hard after Hard-unlock) because it preserves the existing design intent that daily is the flagship ritual. A tighter alternative is "Daily is always Easy" — simpler mental model for new players, at the cost of making daily feel identical to standard-easy for veterans. Worth revisiting after a month of live feedback.
2. **Should the "Reset all local data" button live in the About footer or on its own screen?** Footer is the right place for a rarely-used affordance, but it may be too discoverable. Consider moving behind a second confirm (e.g. type "reset") if analytics ever show accidental resets. For now the two-tap pattern + 3 s disarm is lightweight enough.
3. **Should the "STANDARD" subtitle on share cards be renamed?** Tester reacted to it as unclear (D-12). Options: "Standard puzzle", "Foldwink", or drop the subtitle entirely for non-daily modes. Deferred.

## Tests the QA sheet did not execute this pass

The workbook has 89 total slots; the tester filled in roughly one-third, focused on desktop and mobile smoke. The sheets below are intentionally empty and are outside the scope of automated agents:

| Sheet                                 | Size    | Suggested next pass                                                                                                                                                                       |
| ------------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SOUND QA (S-01 … S-12)                | 12 cues | Human listening pass on speakers + headphones. `scripts/preview-sounds.html` covers the preview surface.                                                                                  |
| SHARE CARD QA (SC-01 … SC-10)         | 10      | Human visual pass at `scripts/preview-share-cards.html`. Specifically confirm or refute D-12 "text over squares".                                                                         |
| VISUAL / AESTHETIC (V-01 … V-08)      | 8       | Subjective; hold until a near-release polish pass.                                                                                                                                        |
| ITCH.IO SPECIFIC (I-01 … I-06)        | 6       | Approximated by `itch-embed-smoke`, but a real upload-to-draft test remains outstanding.                                                                                                  |
| PROGRESSION SYSTEM (P-01 … P-14)      | 14      | Almost entirely covered by `progression-validator` and the readiness unit tests. Any human spot-check is reassurance only.                                                                |
| EDGE CASES / REGRESSION (E-01 … E-08) | 8       | Mostly covered by `gameplay-smoke` + the existing store/progress unit tests. E-05 ("long item names on tight cards") is worth a manual pass when long-word puzzles are added to the pool. |

## Environment-level questions

4. **Which origin is authoritative for player data?** `sunlike78.github.io/foldwink/` is where GitHub Pages serves the build. `neural-void.com/foldwink` is apparently a launcher page that points at GH Pages but runs as a separate origin. Player localStorage is therefore split between origins, and D-02 ("onboarding only appeared on one origin") was a direct symptom. Consider whether the launcher should redirect (single origin) or keep its current dual-origin setup (marketing separation, at the cost of split stats).
5. **What runs on `neural-void.com` that shows up as console noise?** DatadogRUM, Facebook Pixel, Intercom launcher. If the launcher page ever becomes the primary entry, we may want to coordinate privacy copy since the game itself is network-zero.
6. **Do we want CI to run `test:e2e`?** Today only `typecheck`, `test`, `validate`, `lint`, `build` run in CI (`.github/workflows/ci.yml`). Adding `test:e2e` would catch the class of bug that the progression-validator protects against, at the cost of one more minute per run and a Playwright browser cache.

## Unverified-but-plausible

7. **D-12 "text goes over squares" on share card.** Not reproduced in triage; only one tester line mentions it. Could be (a) a real bug triggered on a specific puzzle, (b) a subpixel rendering artifact on a specific DPR, or (c) a misread screenshot. Treat as unverified until the share-card preview session is run.
8. **M-05 "fanfare on tier transition".** Rejected as out-of-scope in this pass. Worth one follow-up poll with the tester to confirm whether they were asking for a sound or just a visual moment (which could be cheap — a one-shot streak badge on Medium's first successful win).
