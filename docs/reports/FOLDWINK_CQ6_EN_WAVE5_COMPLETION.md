# Foldwink CQ6 English Wave 5 Completion

Date: 2026-07-24

## Sprint Summary

- Completed the held puzzle-0317 through a full redesign: At the Beach replaced the specialist twentieth-century-history board.
- Four Wave 5 English Medium boards are now active: puzzle-0255 Hardware Store, puzzle-0316 At the Airport, puzzle-0317 At the Beach, and puzzle-0325 Cafe Counter.
- Each original is archived one-for-one under puzzles/_retired/cq6-quality/.
- Active English pool remains exactly 500 puzzles: 275 easy, 191 medium, 34 hard.
- Remaining explicit full-label fallback boards: 19 EN plus ru-0465, 20 total.

## Editorial Evidence

- Independent GPT review returned KEEP for each promoted board after iterative revision.
- All four final candidates passed draft-to-active reference validation without exact or 3-of-4 near-duplicate warnings.
- The original Library Day draft for puzzle-0317 was rejected rather than promoted; its successful Beach replacement received a separate final KEEP.

## Changed Files

- puzzles/pool/puzzle-0255.json
- puzzles/pool/puzzle-0316.json
- puzzles/pool/puzzle-0317.json
- puzzles/pool/puzzle-0325.json
- puzzles/_retired/cq6-quality/puzzle-0255.json
- puzzles/_retired/cq6-quality/puzzle-0316.json
- puzzles/_retired/cq6-quality/puzzle-0317.json
- puzzles/_retired/cq6-quality/puzzle-0325.json
- puzzles/_drafts/cq6-en-replacements-wave5/
- tests/e2e/foldwink-tabs-layout.mjs
- docs/TODO.md
- docs/RELEASE_NOTES.md
- docs/reports/FOLDWINK_RELEASE_READINESS_CQ6.md

## Tests Run

- Draft reference validation: final candidates had 0 warnings.
- npm test: 23 files, 174 tests passed.
- npm run validate: EN 500 passed (275 easy, 191 medium, 34 hard).
- npm run validate:ru: RU 500 passed.
- npm run validate:de: DE 500 passed.
- npm run build: passed; 9-cue sound-pack check passed.
- npm run test:e2e: 55 scenarios passed.

## Manual QA Notes

- Each of the four Wave 5 puzzles is seeded and verified at 390x844: 16 cards, visible Tabs, full-width grid, and no horizontal page overflow.
- The same suite verifies a real 32-character full category after Wink at 320x568 and 390x844.
- Physical iPhone/Android QA remains an external release gate.

## Open Risks

- 20 Medium/Hard boards still use full-label Tabs fallback: 19 EN and ru-0465.
- Canonical Cloudflare deployment still requires Wrangler re-authentication; the current itch archive is packaged locally but external publication requires explicit approval.
- Real hosted payment-loop verification and physical-device QA remain external release gates.

## Go / No-Go

- GO: continue remaining CQ6 editorial remediation under the same reference, independent-review, and mobile-QA gates.
- NO-GO: do not claim a final paid public release until direct deployment, physical-device QA, and hosted checkout verification are complete.
