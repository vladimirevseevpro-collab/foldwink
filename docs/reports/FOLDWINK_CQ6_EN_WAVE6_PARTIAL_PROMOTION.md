# Foldwink CQ6 English Wave 6 - Partial Promotion

## Sprint Summary

Promoted two independently reviewed English fallback replacements into the active 500-puzzle pool:

- `hard-024` in `puzzle-0355.json`: Garden Shed (Hard).
- `puzzle-0394`: Car Care (Medium).

Both boards use short thematic reveal hints, preserve the 4x4 / four-groups contract, and replace their historical boards one-for-one. The prior originals are retained under `puzzles/_retired/cq6-quality/`.

## Changed Files

- `puzzles/pool/puzzle-0355.json`
- `puzzles/pool/puzzle-0394.json`
- `puzzles/_retired/cq6-quality/puzzle-0355.json`
- `puzzles/_retired/cq6-quality/puzzle-0394.json`
- `tests/e2e/foldwink-tabs-layout.mjs`
- Release tracking documents.

## Editorial Decision

The next two candidates were deliberately held rather than promoted:

- `hard-023` / `puzzle-0354.json`: the Kitchen Table draft blurred place settings and decorations.
- `puzzle-0376.json`: the campsite draft still used less-natural item terms and needs a fresh concept.

The active English fallback count is now 17; Russian retains one explicit full-label fallback (`ru-0465`). Total remaining CQ6 fallback backlog: 18 boards.

## Tests Run

- `npm test`: 23 files, 174 tests passed.
- EN, RU, and DE content validators: all active pools validated at 500 puzzles each; advisory queues remain non-blocking.
- `npm run build`: passed, including the 9-cue audio-pack check.
- `npm run release:preflight`: passed; monetization remains intentionally hidden without live provider configuration.
- `npm run test:e2e`: 57 scenarios passed. This includes 390x844 checks for both promoted boards, 16 cards, Tabs, full-width grid, and no horizontal page overflow.

## Manual QA Notes

Automated 390px coverage is green. A physical iPhone Safari pass remains a separate public-release gate.

## Open Risks

- 18 Medium/Hard full-label fallbacks remain.
- Public deployment still requires Cloudflare re-authentication and a physical device check.
- Paid CTA configuration and real hosted-checkout return remain intentionally unconfigured.

## Go / No-Go

GO for the next constrained content-replacement wave. NO-GO for claiming a public paid launch until deployment and human-device/payment gates are completed.
