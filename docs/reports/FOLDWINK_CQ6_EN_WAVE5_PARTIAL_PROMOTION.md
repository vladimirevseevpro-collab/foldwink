# Foldwink CQ6 English Wave 5 Partial Promotion

Date: 2026-07-24

## Sprint Summary

- Promoted three independently reviewed English Medium replacements: puzzle-0255 Hardware Store, puzzle-0316 At the Airport, and puzzle-0325 Cafe Counter.
- Archived their specialist or unclear originals one-for-one in puzzles/_retired/cq6-quality/.
- Kept puzzle-0317 in drafts. Its Library Day replacement did not meet the final editorial gate, so the active historical board remains until a full redesign is approved.
- Active English pool remains exactly 500 puzzles: 275 easy, 191 medium, 34 hard.
- Remaining explicit full-label fallback boards: 20 EN plus ru-0465, 21 total.

## Editorial Evidence

- Independent GPT review returned KEEP for puzzle-0255, puzzle-0316, and puzzle-0325.
- All candidate groups were reference-checked against the active pool. Final candidates had zero exact or 3-of-4 near-duplicate warnings.
- The held puzzle-0317 is deliberately not a release claim.

## Changed Files

- puzzles/pool/puzzle-0255.json
- puzzles/pool/puzzle-0316.json
- puzzles/pool/puzzle-0325.json
- puzzles/_retired/cq6-quality/puzzle-0255.json
- puzzles/_retired/cq6-quality/puzzle-0316.json
- puzzles/_retired/cq6-quality/puzzle-0325.json
- puzzles/_drafts/cq6-en-replacements-wave5/
- tests/e2e/foldwink-tabs-layout.mjs
- docs/TODO.md
- docs/RELEASE_NOTES.md
- docs/reports/FOLDWINK_RELEASE_READINESS_CQ6.md

## Tests Run

- Draft reference validation: 4 Medium boards, 0 warnings.
- npm test: 23 files, 174 tests passed.
- npm run validate: EN 500 passed (275 easy, 191 medium, 34 hard).
- npm run validate:ru: RU 500 passed.
- npm run validate:de: DE 500 passed.
- npm run build: passed; 9-cue sound-pack check passed.
- npm run test:e2e: 54 scenarios passed.

## Manual QA Notes

- Added reproducible 390x844 E2E coverage for each promoted board. Each confirms 16 cards, visible Tabs, a full-width grid, and no horizontal overflow.
- Physical-device QA remains an external release gate.

## Open Risks

- 21 Medium/Hard boards still use full-label Tabs fallback: 20 EN and ru-0465.
- puzzle-0317 needs a fresh concept rather than a hint-only patch.
- Public direct deployment, physical iPhone/Android QA, and hosted payment-loop verification remain external release gates.

## Go / No-Go

- GO: continue the remaining CQ6 content remediation with the same reference and mobile QA gates.
- NO-GO: do not represent the held puzzle-0317 as remediated or claim a final paid public release before external gates are completed.
