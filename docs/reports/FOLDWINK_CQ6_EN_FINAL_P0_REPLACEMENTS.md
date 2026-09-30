# Foldwink CQ6 English Final P0 Replacements

Date: 2026-07-24
Scope: final four English P0 boards rejected during Tabs triage.

## Sprint Summary

Four specialist or ontology-risk boards were replaced one-for-one in the active
English pool. The replacements preserve the medium-puzzle Tabs/Wink contract,
use short non-spoiling reveal hints, and bring the EN full-label fallback count
from 31 boards to 27. The pool remains exactly 500 puzzles.

- puzzle-0092: Period piece -> Word Connections.
- puzzle-0097: Festival schedule -> Under One Roof.
- puzzle-0169: Iron will -> Saturday Errands.
- puzzle-0197: Listen to the bark -> Rainy-Day Plans.

The original boards are retained under puzzles/_retired/cq6-quality/ for
editorial traceability.

## Editorial Method

Each replacement was drafted outside the active pool, checked structurally,
compared against every active English group for exact and 3-of-4 overlap, and
independently reviewed through the ChatGPT-authenticated Codex CLI.

Review iterations caught and corrected:

- a hint that leaked WORK in puzzle-0092;
- bathroom/furniture and furniture/seating bleed in puzzle-0097;
- repeated active groups and a pet-accessory/grooming surface overlap in
  puzzle-0169;
- loose camping and picnic labels in puzzle-0197.

The Window Coverings hint in puzzle-0097 uses Treatments, the independent
reviewer's recommended umbrella term; it does not repeat the label or name an
item.

## Changed Files

- puzzles/pool/puzzle-0092.json
- puzzles/pool/puzzle-0097.json
- puzzles/pool/puzzle-0169.json
- puzzles/pool/puzzle-0197.json
- puzzles/_retired/cq6-quality/puzzle-0092.json
- puzzles/_retired/cq6-quality/puzzle-0097.json
- puzzles/_retired/cq6-quality/puzzle-0169.json
- puzzles/_retired/cq6-quality/puzzle-0197.json
- puzzles/_drafts/cq6-en-replacements-wave1/puzzle-0092.json
- puzzles/_drafts/cq6-en-replacements-wave1/puzzle-0097.json
- puzzles/_drafts/cq6-en-replacements-wave3/puzzle-0169.json
- puzzles/_drafts/cq6-en-replacements-wave3/puzzle-0197.json
- docs/TODO.md
- docs/KNOWN_LIMITATIONS.md
- docs/reports/FOLDWINK_RELEASE_READINESS_CQ6.md

## Tests Run

- Draft/reference validator: final replacement wave passed with 0 warnings.
- Active validation: 500 EN puzzles; 275 easy, 191 medium, 34 hard.
- TypeScript: passed.
- ESLint: passed.
- Vitest: 23 files, 174 tests passed.
- Production build and sound-pack check: passed.
- Release preflight: free build GO; paid CTAs correctly hidden without public
  checkout configuration.
- Browser E2E: 47/47 passed, including iPhone 390x844, Pixel, itch embed,
  PWA offline, RU localization, and supporter-return paths.
- Fresh itch package: itch.io/export/foldwink-itch-upload-v0.8.2-2026-07-24.zip
  contains 31 files (1,066,897 bytes).
- git diff --check: passed. Existing CRLF working-tree notices are unrelated
  to this milestone.

## Manual QA Notes

A local Playwright session restored each of the four exact active puzzle IDs at
390x844. Every board rendered 16 cards and four Tabs with no document or card
content overflow. The smallest card surface measured 84x66 px.

## Open Risks

- 28 active Medium/Hard boards still use the explicit full-label fallback
  (27 EN and ru-0465). This remains a mobile readability backlog.
- Physical iPhone/Android Safari, audio, install, share, deployment, and paid
  checkout-return checks remain external human work.

## Go / No-Go

GO for the four promoted content replacements and the free web/PWA build.
NO-GO for paid activation until public provider URLs, canonical deploy, and
real-device checkout-return verification exist.
