# Integration Report — Wave 1 merge (`int-wave1`)

Branch HEAD before work: `29c2758` ("integrate wave 1: corpus-dedupe + honest-counts + daily-horizon").

## Context

This branch merges three earlier changes: corpus dedupe/quarantine
(`scripts/quarantine-duplicates.mjs`, `scripts/check-corpus-uniqueness.mjs`,
dup-quarantine dirs), honest counts (`README`/docs/`src/i18n/strings.ts`) and a
daily horizon (`editorial.*.json` manifests, `scripts/build-daily-calendar.mjs`,
`scripts/check-daily-horizon.mjs`, store changes). The generated files under
`public/runtime-content/v1/` were merged mechanically and were stale. The work
below regenerates them and verifies the merged tree.

## Commands run and results

| # | Command | Result |
|---|---------|--------|
| 1 | `npm ci` | OK — `node_modules` was missing; 459 packages installed, 24s |
| 2 | `npm run content:build` | OK — "Built runtime content (52 files, 32-board archive chunks)." |
| 3 | `npm run content:check` | OK — "Runtime content is current (52 files, 32-board archive chunks)." (exit 0) |
| 4 | `npm run typecheck` (`tsc --noEmit`) | OK (exit 0) |
| 5 | `npm test` (`vitest run`) | OK — 57 files, 372 tests passed |
| 6 | `npm run validate:uniqueness` | OK — en 514/514, ru 496/496, de 497/497 unique, 0 duplicates, maxGroupReuse 3 |
| 7 | `npm run lint` (`eslint .`) | OK (exit 0) |
| 8 | `node scripts/check-daily-horizon.mjs` | OK — from 2026-10-03 (min 14 days): every language (en/ru/de) last 2026-12-12, 70 days remaining |

The exact orchestrator gate
`npm run content:check && npm run typecheck && npm test && npm run validate:uniqueness && npm run lint`
passes end to end.

## Changed files

Regeneration only rewrote the three generated runtime manifests (one line each,
since the manifests are single-line JSON):

- `public/runtime-content/v1/manifest.en.json`
- `public/runtime-content/v1/manifest.de.json`
- `public/runtime-content/v1/manifest.ru.json`

No puzzle chunk files under `public/runtime-content/v1/` changed, and no source,
test, script, editorial-manifest or `puzzles/pool` content was modified.

## Fixes made

None required. The merged tree type-checked, tested and linted cleanly on the
first run after regeneration. No duplicate imports, type errors, conflicting
tests or daily calendars referencing quarantined puzzles were found, so no
minimal integration fix was needed. No game behaviour or content was changed.

## Notes / open items

- The three runtime manifests are generated artifacts; the regeneration change
  is metadata-level (produced by `scripts/build-runtime-content.mjs`), not a
  content shuffle. `content:check` confirms the committed artifacts now match
  the source of truth.
- `npm ci` reported pre-existing dependency advisories (9: 1 low, 3 moderate,
  5 high). These are upstream and out of scope for this integration; not
  addressed.
- No design decisions were required; nothing was left unresolved.
