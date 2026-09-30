# Foldwink CQ6 Russian P0 Replacements Wave 5

## Sprint Summary

Promoted four independently reviewed Russian P0 replacement boards into the active RU pool and archived the prior versions:

- ru-0440
- ru-0467
- ru-0469
- ru-0482

The active RU pool remains at 500 boards. Russian full-label Tabs fallback boards decrease from 16 to 12, and the global fallback total decreases from 65 to 61.

## Changed Files

- puzzles/ru/pool/ru-0440.json
- puzzles/ru/pool/ru-0467.json
- puzzles/ru/pool/ru-0469.json
- puzzles/ru/pool/ru-0482.json
- puzzles/_retired/cq6-quality/ru-0440.json
- puzzles/_retired/cq6-quality/ru-0467.json
- puzzles/_retired/cq6-quality/ru-0469.json
- puzzles/_retired/cq6-quality/ru-0482.json
- docs/TODO.md
- docs/KNOWN_LIMITATIONS.md
- docs/reports/FOLDWINK_CQ6_RU_WAVE5_REVIEW_2.md

## Tests Run

- Draft validation against the active RU reference pool: 4 puzzles, 0 warnings.
- Full Vitest suite: 23 files, 174 tests passed.
- Final active-pool validation and remaining release gates are pending a local command-approval service timeout and must be rerun before public release.

## Manual QA Notes

The ru-0469 board was rebuilt twice rather than promoted with editorial ambiguity. Its final cafe version received an independent KEEP decision after the exact-group reference check passed.

## Open Risks

- Three audited Russian P0 candidates remain.
- Sixty-one active Medium/Hard boards still fall back to full Tabs labels.
- Do not declare public release readiness until active-pool validation, typecheck, lint, audit, build, and mobile E2E are rerun.

## Go / No-Go For Next Sprint

GO for the final three Russian P0 replacements. NO-GO for public release until the pending final gates pass.
