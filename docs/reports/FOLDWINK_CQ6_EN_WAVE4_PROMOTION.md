# Foldwink CQ6 English Wave 4 Promotion

Date: 2026-07-24

## Sprint Summary

- Replaced four English Medium boards that had unsafe or unclear fallback content:
  - puzzle-0199: replaced the overloaded bat-homonym board with Kitchen Clues.
  - puzzle-0276: replaced a specialist world-dessert taxonomy board with On the Move.
  - puzzle-0290: replaced specialist flag-color taxonomy with Home Routine.
  - puzzle-0301: replaced a literary-devices board with Movie Night.
- Archived each original one-for-one under puzzles/_retired/cq6-quality/.
- Active English pool remains exactly 500 puzzles: 275 easy, 191 medium, 34 hard.
- Added a draft-to-active reference check before promotion. The final wave produced zero exact or 3-of-4 near-duplicate warnings.
- Fixed a product-contract defect: a Medium Wink now reveals the full category label, not merely the short progressive Tab hint.
- Extended the mobile E2E fixture to verify a real 32-character full category after Wink at 320px and 390px, plus all four promoted boards at 390px.

## Editorial Evidence

- Independent GPT editorial review accepted puzzle-0276, puzzle-0290, and puzzle-0301 after revision.
- puzzle-0199 was iterated until the reviewer returned KEEP: cleanly separated categories, exact membership, low overlap, and non-spoiling hints.
- Final puzzle-0199 Tabs: MIX, BURY, DAB, STEM. Every hint is within the 3-6 character mobile rule.

## Changed Files

- puzzles/pool/puzzle-0199.json
- puzzles/pool/puzzle-0276.json
- puzzles/pool/puzzle-0290.json
- puzzles/pool/puzzle-0301.json
- puzzles/_retired/cq6-quality/puzzle-0199.json
- puzzles/_retired/cq6-quality/puzzle-0276.json
- puzzles/_retired/cq6-quality/puzzle-0290.json
- puzzles/_retired/cq6-quality/puzzle-0301.json
- puzzles/_drafts/cq6-en-replacements-wave4/ (retained audit drafts)
- src/game/engine/foldwinkTabs.ts
- src/game/engine/__tests__/foldwinkTabs.test.ts
- tests/e2e/foldwink-tabs-layout.mjs
- docs/TODO.md
- docs/RELEASE_NOTES.md
- docs/reports/FOLDWINK_RELEASE_READINESS_CQ6.md

## Tests Run

- Draft reference validation: 4 Medium boards, 0 warnings.
- npm run typecheck: passed.
- npx eslint .: passed.
- npm test: 23 files, 174 tests passed.
- npm run validate: EN 500 passed (275 easy, 191 medium, 34 hard).
- npm run validate:ru: RU 500 passed.
- npm run validate:de: DE 500 passed.
- npm run build: passed; 9-cue sound-pack check passed.
- npm run test:e2e: 51 scenarios passed.

## Manual QA Notes

- Automated 390x844 QA now seeds puzzle-0199, puzzle-0276, puzzle-0290, and puzzle-0301 individually and confirms 16 cards, visible Tabs, a full-width grid, and no page horizontal overflow.
- Automated 320x568 and 390x844 QA confirms a 32-character full category label remains unclipped after Wink.
- Physical iPhone/Android QA remains a separate release gate.

## Open Risks

- 24 Medium/Hard boards still use the explicit full-label Tabs fallback: 23 EN and ru-0465.
- Validator advisory queues remain historical triage input, not release-blocking structural failures.
- Canonical Cloudflare deployment still requires Wrangler re-authentication; hosted payment values and real checkout return verification are external gates.

## Go / No-Go

- GO: continue the remaining CQ6 content remediation and keep this Wink/mobile regression coverage.
- NO-GO: do not claim a final paid public release until the direct deployment, physical-device QA, and real hosted checkout loop are verified.
