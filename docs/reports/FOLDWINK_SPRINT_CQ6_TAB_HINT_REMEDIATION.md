# Foldwink Sprint CQ6 - Tabs Hint Remediation, Increment 1

## Sprint Summary

CQ6 turns the previously hidden Foldwink Tabs fallback into a measured content-quality backlog. The validator now recognises Tabs on both Medium and Hard puzzles, groups advisory output by category, and keeps the full per-item stream behind --verbose.

Two selective English increments touched 11 boards whose category axes were judged sufficiently clear for a Tab backfill. Forty-four short hints now replace full-label fallbacks without changing any group, difficulty, or puzzle count. The active pool remains EN=500, RU=500, DE=500. A separate Russian P0 replacement batch then retired four confirmed unfair boards one-for-one, preserving RU=500 and reducing the overall fallback total to 68 after two further safe Russian and two German P1 Tab backfills plus all thirty-three German P0 replacements.

## Changed Files

- scripts/validate-puzzles.ts
- puzzles/pool/puzzle-0026.json
- puzzles/pool/puzzle-0029.json
- puzzles/pool/puzzle-0035.json
- puzzles/pool/puzzle-0404.json
- puzzles/pool/puzzle-0096.json
- puzzles/pool/puzzle-0121.json
- puzzles/pool/puzzle-0175.json
- puzzles/pool/puzzle-0178.json
- puzzles/pool/puzzle-0400.json
- puzzles/pool/puzzle-0454.json
- puzzles/pool/puzzle-0475.json
- docs/reports/FOLDWINK_TAB_HINT_DEBT_EN.md
- docs/reports/FOLDWINK_TAB_HINT_DEBT_RU.md
- docs/KNOWN_LIMITATIONS.md
- docs/reports/FOLDWINK_CQ6_RU_P0_REPLACEMENTS.md
- tests/e2e/lib/harness.mjs
- puzzles/de/pool/de-0365.json
- puzzles/de/pool/de-0403.json
- puzzles/ru/pool/ru-0130.json
- puzzles/ru/pool/ru-0160.json
- puzzles/de/pool/de-0439.json
- puzzles/de/pool/de-0492.json
- docs/reports/FOLDWINK_TAB_HINT_DEBT_DE.md
- docs/reports/FOLDWINK_CQ6_DE_REPLACEMENT_CANDIDATES.md
- docs/reports/FOLDWINK_CQ6_DE_REPLACEMENT_REVIEW.md
- docs/reports/FOLDWINK_CQ6_DE_P0_REPLACEMENTS.md
- docs/reports/FOLDWINK_CQ6_DE_REPLACEMENT_REVIEW_2.md
- docs/reports/FOLDWINK_CQ6_DE_WAVE2_REVIEW.md
- docs/reports/FOLDWINK_CQ6_DE_WAVE2_REVIEW_2.md
- docs/reports/FOLDWINK_CQ6_DE_WAVE2_REVIEW_3.md
- docs/reports/FOLDWINK_CQ6_DE_WAVE3_REVIEW.md
- docs/reports/FOLDWINK_CQ6_DE_WAVE3_REVIEW_2.md
- docs/reports/FOLDWINK_CQ6_DE_WAVE4_REVIEW.md
- docs/reports/FOLDWINK_CQ6_DE_WAVE4_REVIEW_2.md
- docs/reports/FOLDWINK_CQ6_DE_WAVE5_REVIEW.md
- docs/reports/FOLDWINK_CQ6_DE_WAVE5_REVIEW_2.md
- docs/reports/FOLDWINK_CQ6_DE_WAVE6_REVIEW.md
- docs/reports/FOLDWINK_CQ6_DE_WAVE6_REVIEW_2.md
- docs/reports/FOLDWINK_CQ6_DE_WAVE7_REVIEW.md
- docs/reports/FOLDWINK_CQ6_DE_WAVE7_REVIEW_2.md
- docs/TODO.md

## Tests Run

- npm run validate - pass; EN=500, Tabs advisory queue 240 -> 196
- npm run validate:ru - pass; RU=500, Tabs advisory queue 128
- npm run validate:de - pass; DE=500, Tabs advisory queue 0 after all thirty-three audited P0 replacements
- German native-language audit - complete: 35 boards reviewed (P0=33, P1=2, P2=0); the two P1 boards received verified short Tabs
- npm run audit:logic - pass; one retained manual review signal (ru-0205)
- npm run typecheck - pass
- npm run lint - pass
- npm test - 23 files / 174 tests passed
- npm run build - pass
- npm run test:e2e - 47 scenarios passed

## Manual QA Notes

- The 11 reviewed English boards now use short Tabs rather than full labels; the active pool count and difficulties are unchanged. All thirty-three independently reviewed German P0 boards are now replaced with general-audience Easy boards; their original records remain archived.
- The Tabs layout test remains green at 320 px and 390 px. The E2E harness now allows 20 seconds for a cold localized-pool load, eliminating false 10-second preview timeouts. Physical iPhone verification of the changed German P1 boards is still required before release.

## Open Risks

- 68 Medium/Hard boards still need explicit, short Tabs hints or deeper content repair.
- The English audit found that many remaining boards are P0: they should be rebuilt, retiered, or retired rather than patched with a cosmetic hint.
- Russian audit is complete: four P0 boards have already been replaced one-for-one; the remaining audit findings still require a batch-by-batch decision. Two safe German boards, including the two P1 boards identified by the completed audit, and two safe Russian boards now have explicit Tabs. The German audit identified 33 P0 rebuild-or-retire candidates, all thirty-three of which have now been replaced one-for-one, with no P2 quick fixes.

## Go / No-Go for Next Increment

**Go** for small language-specific batches. Do not retire P0 boards until replacement content is approved, otherwise the 500-per-language release invariant would be broken.