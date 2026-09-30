# Foldwink CQ6 - Draft Reference Guard

## Sprint Summary

Added an optional reference-pool mode to the puzzle validator. Candidate groups are compared as order-independent sets of four normalised items against an active pool, so exact group copies are surfaced before editorial promotion.

## Changed Files

- scripts/validate-puzzles.ts
- docs/TODO.md

## Usage

Run: npx tsx scripts/validate-puzzles.ts --dir=<draft-dir> --reference-dir=<active-pool-dir>

The check is advisory. It catches exact four-item group copies and does not replace native-language editorial review for near-duplicates, broad labels, or false trails.

## Tests Run

- Reference check against the fifth Russian draft wave: initially found 11 exact copied groups; after reauthoring the copied groups, found 0 exact copies.
- npm run typecheck: passed.
- npm test: 23 files and 174 tests passed.
- npm run build: passed.
- npm run test:e2e: 47 scenarios passed.

## Manual QA Notes

- Fifth Russian wave remains draft-only. The independent semantic audit still requires reauthoring before promotion.

## Open Risks

- Exact-set comparison cannot identify semantically similar but non-identical groups. Human review remains mandatory.

## Go / No-Go

Go for use on all future content drafts; no-go for promoting the current fifth Russian wave until its editorial REVISE findings are closed.
