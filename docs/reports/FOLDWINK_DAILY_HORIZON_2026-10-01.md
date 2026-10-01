# Foldwink — Daily Horizon Extension (2026-10-01)

Status: **COMPLETE**. Published Daily horizon extended for EN/RU/DE from
2026-10-14 through 2026-12-12 (60 new days per language).

## Sprint Summary

The checked-in `daily.<lang>.2026-09-14.json` schedules were immutable inputs
and were not touched. A new deterministic generator,
`scripts/build-daily-calendar.mjs`, produced one new 60-day manifest per
language plus matching editorial records:

| Language | New manifest | scheduleVersion | Range | Easy / Medium / Hard |
| --- | --- | --- | --- | --- |
| EN | `puzzles/manifests/daily.en.2026-10-14.json` | `daily-2026-10-14-2026-12-12-v1` | 2026-10-14 – 2026-12-12 | 35 / 19 / 6 |
| RU | `puzzles/manifests/daily.ru.2026-10-14.json` | `daily-2026-10-14-2026-12-12-v1` | 2026-10-14 – 2026-12-12 | 48 / 12 / 0 |
| DE | `puzzles/manifests/daily.de.2026-10-14.json` | `daily-2026-10-14-2026-12-12-v1` | 2026-10-14 – 2026-12-12 | 54 / 6 / 0 |

Selection rules applied by the generator:

- only active-pool boards that are **not duplicates**; a board is a duplicate
  when at least 3 of its 4 groups already occur in an earlier board by
  ascending id (group = frozenset of lowercased trimmed items);
- boards already used by any checked-in Daily schedule or starter manifest are
  never reused;
- the weekday tier rhythm of each language's existing 30-day schedule is
  mirrored by cycling that language's per-weekday tier order, so RU/DE never
  receive a Hard slot they do not own;
- no group label is reused inside a 7-day window;
- dates are contiguous from 2026-10-14 to 2026-12-12.

Runtime integration: `scripts/build-runtime-content.mjs` now reads every
`daily.<lang>.*.json`, emits them as an ordered array in the runtime manifest
(founding 30-board release still boots; extension boards ship in the archive
chunks), and `getDailyEntry` searches all published schedules. New editorial
records are marked `status: "unreviewed"`, `ambiguityRisk: "review"`,
`mobileFit: "pending"`, reviews `null`; no new record is marked approved.

## Chosen puzzle ids

EN (2026-10-14 → 2026-12-12):

```
puzzle-0002, puzzle-0003, puzzle-0021, puzzle-0025, puzzle-0001, puzzle-0007,
puzzle-0008, puzzle-0010, puzzle-0026, puzzle-0027, puzzle-0012, puzzle-0013,
puzzle-0014, puzzle-0016, puzzle-0017, puzzle-0018, puzzle-0030, puzzle-0034,
puzzle-0039, puzzle-0040, puzzle-0041, puzzle-0028, puzzle-0043, puzzle-0044,
hard-001, hard-002, puzzle-0045, puzzle-0029, puzzle-0035, puzzle-0036,
puzzle-0037, puzzle-0038, puzzle-0046, hard-003, hard-004, puzzle-0047,
puzzle-0061, puzzle-0062, puzzle-0048, puzzle-0049, puzzle-0050, puzzle-0051,
puzzle-0052, puzzle-0053, puzzle-0054, puzzle-0056, puzzle-0057, puzzle-0059,
puzzle-0072, puzzle-0063, puzzle-0073, puzzle-0074, hard-005, hard-006,
puzzle-0075, puzzle-0076, puzzle-0064, puzzle-0065, puzzle-0066, puzzle-0067
```

RU:

```
ru-0001, ru-0003, ru-0004, ru-0005, ru-0006, ru-0007, ru-0009, ru-0011,
ru-0012, ru-0013, ru-0014, ru-0015, ru-0016, ru-0017, ru-0002, ru-0107,
ru-0108, ru-0109, ru-0110, ru-0018, ru-0111, ru-0019, ru-0020, ru-0021,
ru-0022, ru-0024, ru-0026, ru-0028, ru-0029, ru-0030, ru-0031, ru-0032,
ru-0033, ru-0034, ru-0036, ru-0037, ru-0038, ru-0039, ru-0040, ru-0042,
ru-0043, ru-0044, ru-0148, ru-0160, ru-0168, ru-0172, ru-0185, ru-0045,
ru-0047, ru-0049, ru-0050, ru-0051, ru-0052, ru-0053, ru-0054, ru-0186,
ru-0055, ru-0056, ru-0057, ru-0058
```

DE:

```
de-0001, de-0002, de-0301, de-0006, de-0007, de-0010, de-0013, de-0017,
de-0018, de-0021, de-0022, de-0024, de-0025, de-0028, de-0031, de-0032,
de-0035, de-0036, de-0037, de-0038, de-0039, de-0041, de-0045, de-0046,
de-0047, de-0049, de-0050, de-0052, de-0302, de-0044, de-0303, de-0057,
de-0058, de-0059, de-0060, de-0062, de-0066, de-0067, de-0068, de-0070,
de-0071, de-0072, de-0073, de-0074, de-0076, de-0080, de-0081, de-0082,
de-0083, de-0084, de-0085, de-0086, de-0087, de-0088, de-0090, de-0091,
de-0307, de-0093, de-0309, de-0094
```

## Changed Files

New:

- `scripts/build-daily-calendar.mjs`
- `scripts/check-daily-horizon.mjs`
- `puzzles/manifests/daily.en.2026-10-14.json`
- `puzzles/manifests/daily.ru.2026-10-14.json`
- `puzzles/manifests/daily.de.2026-10-14.json`
- `docs/reports/FOLDWINK_DAILY_HORIZON_2026-10-01.md`

Modified:

- `puzzles/manifests/editorial.en.json`, `editorial.ru.json`,
  `editorial.de.json` — +60 unreviewed records each (30 ready + 60 unreviewed)
- `scripts/build-runtime-content.mjs` — enumerate all daily manifests, founding
  manifest stays the 30-board boot release, editorial readiness asserted only
  for released boards
- `scripts/release-preflight.mjs` — runs the horizon check
- `src/puzzles/runtimeContent.ts` — runtime manifest `daily` is now an ordered
  array of schedules; validates language, unique dates and editorial identity
- `src/puzzles/catalog/registry.ts` — `getDailyEntry` searches every schedule
- `src/puzzles/catalog/manifestFiles.test.ts` — added horizon manifest
  enumeration test (existing hard-coded tests untouched)
- `src/puzzles/runtimeContent.test.ts` — added cross-schedule lookup test
- `src/game/state/store.ts` — Daily start fetches the owning archive chunk for
  horizon-extended boards before creating the attempt
- `src/game/state/appStore.ts` — wires `ensurePuzzleLoaded` into store deps
- `src/game/state/__tests__/store.test.ts` — added archive-backed Daily test
- `public/runtime-content/v1/manifest.{en,ru,de}.json` — regenerated

No puzzle payloads were moved, deleted or invented. `package.json`, README,
`docs/KNOWN_LIMITATIONS.md`, `src/i18n/strings.ts` and `src/screens/*` were not
touched.

## Commands Run

Build and data gates, from the repository root on 2026-10-01:

- `node scripts/build-daily-calendar.mjs --dry-run` — pass; deterministic plan,
  no files written; re-running after generation produced byte-identical plans.
- `node scripts/build-daily-calendar.mjs` — pass; wrote the three manifests and
  180 unreviewed editorial records.
- `node scripts/check-daily-horizon.mjs --min-days 14` — pass;
  EN/RU/DE last date 2026-12-12, 72 days remaining.
- `node scripts/check-daily-horizon.mjs --min-days 200` — exits 1 with the
  expected failure listing (negative check).
- `npm run content:build` — pass; 99 generated runtime files.
- `npm run content:check` — pass; generated content is current.
- `node scripts/release-preflight.mjs` — horizon reported `ready` (the
  pre-existing `dist/` check still fails without a build, unrelated).
- `npx vitest run src/puzzles` — 41/41 pass.
- `npx vitest run` — 372/372 pass.
- `npm run typecheck` — pass.
- `npm run validate` — pass (EN 1000 boards, advisory warnings only).
- `npm run build` — pass.
- `npx eslint` on every changed script/source/test file — clean.

Exact task verification command:

```sh
node scripts/check-daily-horizon.mjs --min-days 14 && npm run content:check && npx vitest run src/puzzles
```

Result: all three stages pass.

## Manual QA Notes

- Every new date was independently re-checked against the written manifests:
  contiguous dates, no overlap with historical dates, no puzzle reused from a
  previous schedule/starter, no duplicate board under the 3-of-4-group rule,
  no group label within 7 days, and no Hard board in RU/DE.
- The runtime manifest was loaded through `RuntimeContentCatalog.ensureBoot`
  against the regenerated `public/runtime-content` in tests; a new date
  (2026-12-12) resolves and 2026-12-13 does not.
- `getDailyEntry` keeps returning the immutable 2026-09-14 entry
  (`puzzle-0004`) for that date.
- A store test starts a Daily whose board is only reachable through
  `ensurePuzzleLoaded`: the attempt is not created until the archive board is
  available, then it starts with the published entry identity.

## Open Risks

- The 180 new editorial records are intentionally **unreviewed / pending
  mobile fit**. They are playable but not editorially signed off; human review
  must downgrade or replace any risky board before it is claimed as calibrated.
- The horizon now reaches 2026-12-12; the same check must be wired into the
  recurring release routine or the calendar will run out again.
- `scripts/build-pilot-artifact-manifest.mjs` and
  `scripts/summarize-pilot-observations.mjs` still report the founding
  `daily-2026-09-14-2026-10-13-v1` schedule label; they are outside this
  task's surface and were not changed.

## Go / No-Go for next sprint

**GO.** The horizon, runtime delivery and automated gate are complete; content
review of the unreviewed extension boards remains the next editorial step.