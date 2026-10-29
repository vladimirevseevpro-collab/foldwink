# Release Notes

## 0.8.5 - 2026-10-29 - W7 pilot moves to the web

This build replaces `0.8.4` as the W7 pilot before participant 001. `0.8.4`
predates the October duplicate-board cleanup, and the pilot no longer runs on
itch.io.

- The pilot is a frozen copy of clean commit `c874de7`, committed as
  `pilot/0.8.5/` and served by GitHub Pages at
  `https://vladimirevseevpro-collab.github.io/foldwink/pilot/0.8.5/` beside the
  moving main app. Every deploy re-checks it against its manifest.
- Tree SHA-256 `d91e97fe42d65532cb9a067bc6f851f2e9f1ef19db0b8810ade61f5850a47567`
  (146 files); a clean rebuild of the commit reproduces every file.
- The pilot contract, operator form, observation validator and template pin
  this build instead of `dist/` and `package.json`.
- Daily runs through 2027-02-10 (two schedules since 2026-10-14).
- W7 remains incomplete: physical devices, real participants and complete
  D1/D7 windows are still required.

## 0.8.4 - 2026-09-16 - W7 pilot version-integrity fix

This build supersedes `0.8.3` before participant 001. The frozen `0.8.3`
bundle was labelled correctly by the package and itch channel but its voluntary
research export still reported app version `0.8.2`. No participant records
exist, so the pilot starts only on this corrected identity.

- Runtime app version now comes from `package.json`, eliminating the duplicate
  analytics/export constant.
- Unit and production-browser E2E verify that the downloaded research export
  matches the packaged app version.
- Public itch **Run game** is upload `#19242763`, build `#1984826`; the download
  channel is build `#1984827`.
- ZIP SHA-256:
  `b9e5dde25558e27dc9f846f28e8ad4b9dbb0d134136e2efa2bb8c9d7cf7fc645`.
- Dist tree SHA-256:
  `b41e3ce52dd56f28e96719a6e4872bc7701e6305cbfe270a5e8f02bdd64eb385`.
- Both channels were fetched back and matched all 137 files. Live EN/DE/RU
  export parity and gameplay smoke pass at 1440×900, 1024×768 and 390×844.
- W7 remains incomplete: real participants, exact-build physical devices and
  complete D1/D7 windows are still required.

## 0.8.3 - 2026-09-15 - W7 pilot candidate

This build is browser-staged on itch.io for the real-participant W7 balance and
retention pilot. It is not a commercially accepted release: physical iOS,
Android and external-desktop smoke, 20–30 observed first sessions and complete
D1/D7 windows remain outstanding.

Superseded before participant 001 by `0.8.4` because the runtime research
export reported app version `0.8.2`. Retained below as immutable history only.

### Product and content

- 3,000 curated puzzles: 1,000 each in English, German and Russian.
- Versioned Daily calendar, Foldwink Tabs + one-shot Wink, local-first
  persistence, offline PWA, collection/share surfaces and consent-safe pilot
  export.
- The menu now reports the verified 1,000-board selected-language catalogue,
  not the 30-board lazy boot chunk.

### Verified staging

- itch upload `#19242763`, build `#1981655`, version `0.8.3`.
- Legacy download upload `#17237271`, build `#1981682`, now serves the same
  `0.8.3` tree as the browser-playable channel.
- Exact 137-file channel fetch matches tree SHA-256
  `182628d9a1a80b10437fb90dbcf879522d345387db394cbb6687d180d2655d0e`.
- EN/DE/RU external smoke passes at 1440×900, 1024×768 and 390×844 with
  HTTP 200, one correct group per locale and zero console/page errors.
- 55 Vitest files / 362 tests, 74/74 production E2E scenarios, all three
  1,000-puzzle validators, build budgets, notices and production dependency
  audit pass.

---

## 0.8.2 - 2026-07-24 - Mobile-first release candidate

This is the first release-candidate line after the closed-beta era. It is ready
for a free direct web/PWA deployment after the documented physical-device
checks. It is not yet approved for paid activation.

### Product

- Responsive mobile shell, tactile 2.5D cards, motion tokens, nine local audio
  cues, persistent sound/haptics controls, and a canvas-based share card.
- Daily Fold retention surface, replay-safe daily history, mid-game resume,
  local-only statistics, PWA offline shell, and player-initiated install flow.
- Optional privacy-gated aggregate measurement plus a hidden-by-default tip jar
  and cosmetic Supporter return surface. No gameplay paywall or pay-to-win.
- Direct web/PWA is canonical. itch.io packaging is maintained as optional
  discovery.

### Content

- EN, RU, and DE pools contain exactly 500 active curated puzzles each.
- EN mix: 275 easy, 191 medium, 34 hard.
- Recent English P0 remediation replaced puzzles 0092, 0097, 0169, and 0197
  one-for-one after draft/reference duplicate checks, independent editorial
  review, and 390px rendering QA.
- Recent English CQ6 remediation also replaced hard-024 / puzzle-0355 as Garden Shed and puzzle-0394 as Car Care after independent editorial review, reference checks, and 390px rendering QA.
- 18 Medium/Hard boards still use the explicit full-label Tabs fallback
  (17 EN and 1 RU). This is a tracked readability backlog, not hidden.

### Verification

- 23 Vitest files / 178 unit tests passed.
- 59 Playwright browser scenarios passed, including iPhone 390x844, Pixel,
  itch embed, PWA offline, localization, and supporter-return flows.
- TypeScript, ESLint, content validation, sound-pack check, production build,
  free release preflight, and fresh itch packaging passed.

### Public launch boundary

A free launch still requires canonical deployment and physical iPhone/Android
checks. Paid activation additionally requires real Ko-fi/hosted-checkout URLs,
a real return redirect, and same-origin cosmetic-badge verification.

See the current reports in `docs/reports/` and
`docs/KNOWN_LIMITATIONS.md`.

---

## 0.4.3 — 2026-04-12 — Master Challenge scaffold + Hard layer

Adds the Hard / Master Challenge difficulty tier as a fully scaffolded but empty-content layer. Engine, store, readiness logic, validator, and MenuScreen button are complete and tested. Hard pool is empty — the button shows "Master Challenge — soon" until the first disciplined batch of curated Hard puzzles ships.

### What Hard means in Foldwink

- **Same 4×4 / 4 groups / 4 mistakes core.** Hard does not add new mechanics.
- **Tabs at half-speed.** Foldwink Tabs show 1 letter until 2 groups are solved, then 2, then full. Formula: `visibleCount = max(1, floor(stage/2) + 1)`. See `revealStageHard()`.
- **No Wink.** The one-per-puzzle Wink is medium-only. On Hard, the player solves purely from the grid and slow Tabs.
- **Difficulty from constraint reasoning, not punishment.** Hard puzzles must create genuine ambiguity through multiple plausible groupings, reduced support, and demanding inference — not through obscure vocabulary, trivia, or random unfairness.

### Progression into Hard

- Visible from the start as an aspirational surface.
- Unlocks after **3 medium wins** (`HARD_UNLOCK_AT`).
- Recommended after **5 medium wins + ≥ 60% medium win rate** (`HARD_RECOMMEND_MEDIUM_WINS`, `HARD_RECOMMEND_MEDIUM_WIN_RATE`).
- Fallback after 2 consecutive hard losses: gentle nudge back toward Medium.

### Engine / schema

- `PuzzleDifficulty` union gains `"hard"`.
- Validator accepts `"hard"` and counts it separately.
- Loader exports `HARD_POOL`, `getHardByIndex`.
- `Stats` gains `hardWins`, `hardLosses`, `hardLossStreak` (all optional, backwards-compatible).
- `StandardProgress` gains `hardCursor` (optional, defaults to 0).
- Store gains `startHard()` action — safe no-op when `HARD_POOL` is empty.
- `buildFoldwinkTabs()` dispatches to `revealStageHard` on hard puzzles.
- `canWinkGroup()` already returns false for non-medium — hard is naturally excluded.
- `hardReadiness()` pure function in `readiness.ts` with `hasContent`, `unlocked`, `level`, `label`, `caption`, `fallback` fields.
- Share card and grading accept `"hard"` difficulty cleanly.

### Content status

**Current library: 98 curated puzzles (65 easy + 33 medium + 0 hard).**
**Target library: 500 curated puzzles (easy + medium + hard).**

Hard is currently scaffolded. The first real Hard batch should use the same disciplined pipeline with batches ≤ 10, rejection quota ≥ 30%, and the quality bar defined in `docs/PROGRESSION_RULES.md`.

### Tests

- `+9` new tests for `hardReadiness`: coming-soon, locked, unlock, recommendation, fallback.
- Total: **108 tests across 11 suites** (up from 99).

### Bundle

Production build: **~248 kB JS / ~81 kB gzip** — approximately unchanged. The Hard plumbing is call-site wiring and a few hundred bytes of readiness logic.

---

## 0.4.2 — 2026-04-12 — Progression split, doc correction, library clarity

Tightly scoped pass on top of 0.4.1. Finishes the Easy → Medium progression model and fixes doc wording so **current 98** and **target 500** are explicit and impossible to misread.

### Critical doc correction

**Library clarity across live docs.** Every live-tier doc that mentions puzzle counts now distinguishes:

- **Current library: 98 curated puzzles** (65 easy + 33 medium)
- **Target library: 500 curated puzzles** via the disciplined batch pipeline (`docs/content/BATCH_WORKFLOW.md`)
- **Near-term content goal:** validate the disciplined pipeline and expand the approved library in reviewed batches toward 150 → 200 → 500. 500 is not claimed anywhere as current.

Updated: `README.md`, `docs/KNOWN_LIMITATIONS.md`, `docs/PROGRESSION_RULES.md`, `docs/RELEASE_NOTES.md`, the MenuScreen footer line ("98 curated puzzles in this build · target library 500"). Archive-tier docs under `docs/` that predate the expansion remain historical and untouched.

### Progression model

- **Mode split.** Standard is now two distinct tracks on the menu: **Easy puzzle** and **Medium puzzle**. Each track walks its own subset of the curated pool with an independent cursor (`progress.easyCursor`, `progress.mediumCursor`). Daily mode is unchanged.
- **Simple unlock.** Medium is always visible. The Medium button is disabled with the label `Medium — locked` until the player has solved **5 easy puzzles**. After that it is enabled and never regresses.
- **Early nudge at 3 easy wins.** Before the unlock, once the player hits 3 easy wins, the menu shows a short nudge: `Almost there · You're getting the hang of it. N more easy wins unlocks Medium — with Foldwink Tabs and one Wink per puzzle.`
- **Smarter recommendation.** Once unlocked, the readiness signal computes one of four levels:
  - `unlocked-weak` — shaky easy stats, no strong push.
  - `recommended` — ≥ 70% easy win rate + ≤ 2 avg mistakes + ≥ 2 recent confident wins (≤ 1 mistake).
  - `strong` — everything from recommended plus a time-based confidence bump (≥ 2 recent fast-confident wins OR median easy solve ≤ 3 min).
    Medium button flips to the primary variant on `recommended` / `strong` and the label line uses the accent colour on `strong`.
- **Time is secondary.** Solve time only contributes to the "strong" bump. It never locks or unlocks anything.
- **Gentle failback.** Two consecutive medium losses trigger a short muted line: `Two tough mediums in a row — try a few more Easy puzzles first.` The line is advisory — medium is never re-locked and the streak resets on the next medium win.
- **Readiness thresholds** live as named constants in `src/game/engine/readiness.ts`. Full behaviour documented in `docs/PROGRESSION_RULES.md`.

### Engine / schema

- `Stats` gains two optional fields: `mediumLossStreak?: number` and `recentSolves?: RecentSolve[]` (capped at `RECENT_SOLVES_LIMIT = 10`). Both are backwards-compatible with 0.4.1 saved state.
- `StandardProgress` gains `easyCursor?` and `mediumCursor?`. Legacy `cursor` is preserved as a fallback for upgrade and kept in sync with `easyCursor` on easy-mode wins.
- `applyGameResult` signature gains `durationMs` — the new field feeds `recentSolves`.
- `StoreDeps` gains `easyPool`, `mediumPool`, `getEasyByIndex`, `getMediumByIndex`. `createStore` now exposes `startEasy` and `startMedium` actions; `startStandard` is an alias that routes to `startEasy` for backwards-compatibility with any external caller.
- `src/game/engine/readiness.ts` rewritten — new `ProgressionSignal` with `unlocked`, `showNudge`, `level`, `label`, `caption`, `fallback`, `easyWins`, `easyWinRate`, `avgMistakes`.
- Loader now exports `EASY_POOL`, `MEDIUM_POOL`, `getEasyByIndex`, `getMediumByIndex`.
- No new persistence keys.

### UX copy

All progression copy is drafted to stay concise, calm, and non-patronising:

- **Locked:** `Warming up · A few easy solves first — Medium unlocks at 5 easy wins.`
- **Nudge (3 easy wins):** `Almost there · You're getting the hang of it. N more easy wins unlocks Medium — with Foldwink Tabs and one Wink per puzzle.`
- **Unlocked-weak:** `Medium unlocked · Try one when you feel ready — or keep polishing Easy first.`
- **Recommended:** `Recommended · A Medium puzzle is a good next step.`
- **Strong:** `Medium-ready · Your Easy form is steady. Foldwink Tabs will feel natural.`
- **Fallback (2 medium losses):** `Two tough mediums in a row — try a few more Easy puzzles first.`

### Tests

- `+17` new tests: 15 covering every readiness path, 4 covering `recentSolves` + `mediumLossStreak` + `applyGameResult` bookkeeping, 4 covering the store's easy/medium mode split.
- Existing tests migrated to the new `GameResultContext` (now includes `durationMs`) and the new `StoreDeps` shape.
- Total: **99 tests across 11 suites** (up from 82 / 11).

### Bundle

Production build: **245.xx kB JS / ~80 kB gzip** — approximately unchanged. The readiness module is a few hundred bytes; the mode split is call-site rewiring; no new dependencies.

### Deferred (unchanged)

- First in-browser / first in-ear QA pass.
- Raster 1200×630 OG PNG.
- Human-designed wordmark / logotype.
- Actual pool expansion beyond 98.
- Premium / ad / network-analytics surfaces.

---

## 0.4.1 — 2026-04-12 — Branding, sound retune, content metadata, medium readiness

Targeted polish pass on top of 0.4.0. Addresses every high-value code-doable gap flagged in the 0.4.0 post-run analysis. Details in `docs/reports/FOLDWINK_0_4_1_POLISH_PASS_REPORT.md`.

### What changed

- **Neural Void branding integrated across the product.** Wordmark lockup now carries a "by Neural Void" sublabel (default on the large size, opt-in on sm/md). Share card draws the same sublabel under the Foldwink wordmark. OG image, HTML meta, `manifest.webmanifest`, and the About footer all reference **neural-void.com** and the real support email **foldwink@neural-void.com**. The stale "One anchor per medium puzzle" line in both `index.html` and `public/og.svg` was removed — it predated the Wink refactor.
- **Sound retune — material-correct tactile palette.** Every recipe in `src/audio/sound.ts` was rewritten against the documented paper / card / wood / bone direction. All oscillator bodies now live in the **80–280 Hz** range. `correct` and `win` lost their triangle-oscillator ascent (520 Hz+) and were rewritten as bone-on-wood settles. `wink` lost its 880/1320 Hz bright chime and became a warmer mid (280/210 Hz) tile lift. Noise taps switched from bandpass to low-pass filters for warmer tone. Default master volume dropped from 0.55 → **0.42**. See `docs/SOUND_DESIGN.md` for the full cue manifest and the asset-replacement plan.
- **Content pipeline metadata.** `Puzzle.meta` is a new optional field (`theme`, `categoryType`, `wordplay`, `fairnessRisk`, `repetitionRisk`, `tags`, `batch`, `status`). Existing 98 puzzles need no migration — every meta field is optional. Validator now reports meta coverage, theme/categoryType distribution, wordplay medium share (target ≤ 25%), and per-batch counts. `fairnessRisk ≥ 2` emits an editorial warning.
- **Medium readiness soft signal.** New pure function `mediumReadiness(stats)` returns `warmup` / `ready` / `strong` with a short label + caption. MenuScreen shows it under the Standard button once the player has solved at least one puzzle. **Never gates anything** — medium puzzles remain reachable from day one. 6 new tests pin every level.
- **Wordmark sublabel toggle.** `Wordmark` component gains a `showSublabel` prop (default: on for `lg`, off for `sm`/`md`). Menu uses the large lockup with sublabel; Stats / Onboarding stay compact.
- **Share flow copy.** Both the text share string and the canvas share-card footer replaced `foldwink.com` with `neural-void.com/foldwink`. Share-test expectation migrated.
- **Share card layout.** Tightened vertical rhythm to accommodate the new sublabel without clipping the solved-grid area.

### Engine / schema

- `PuzzleMeta` interface added to `src/game/types/puzzle.ts`. All fields optional. Validator reads the same shape; unknown meta fields are ignored.
- `mediumReadiness` pure function in `src/game/engine/readiness.ts`.
- No store shape changes.
- No persistence key additions.
- `DEFAULT_SETTINGS.volume` changed from `0.55` → `0.42` in `src/audio/sound.ts`. Players who already persisted a different volume keep their preference.

### Tests

- `+6` new tests for `mediumReadiness`. Share-test expectation migrated.
- Total: **82 tests across 11 suites** (up from 76 / 10).

### Bundle

Production build: **244.40 kB JS / 79.79 kB gzip**, 17.68 kB CSS / 4.43 kB gzip. +0.4 kB gzip over 0.4.0 for the new sound recipes, readiness function, meta validator coverage, and branding wiring.

### Deferred (unchanged from 0.4.0)

- First in-browser / first in-ear QA pass — the 0.4.1 sound retune is documented, not heard.
- Raster 1200×630 OG PNG.
- Human-designed wordmark / logotype.
- Actual pool expansion beyond 98 — pipeline + metadata + readiness signal exist; the disciplined authoring batches remain human-driven.
- Premium / ad / network-analytics surfaces.

---

## 0.4.0 — 2026-04-11 — Post-MVP polish, sound, share image, grading, content pipeline

The big post-MVP pass. Eight sprints executed against the Foldwink Master plan, scope-constrained by an explicit audit so the minimalist identity stays intact. Details in `docs/reports/FOLDWINK_POST_MVP_SPRINTS_REPORT.md`.

### Headline changes

- **Hygiene.** React error boundary at the app root; stale `AnchorTwist` references purged from `docs/PUZZLE_SCHEMA.md`, `CLAUDE.md`, and `scripts/validate-puzzles.ts`; `StatsScreen` duplicate cells removed; `store.ts::winkTab` refactored to call `canWinkGroup`; `dailyPlayedDate` dropped in favour of a selector over `todayDailyRecord?.date`; `.gitignore` tightened; stray repo-root files relocated.
- **Visual polish + motion foundation.** New `src/styles/motion.ts` holds shared transition tokens (one source of truth, CSS/transform-only, no libraries). Cards get an active-press scale, a subtle 2.5D lift on selected state, and a one-shot pop on solve. The grid shakes on a wrong submit. Foldwink Tabs gain a gentle reveal animation on every stage change. Every animation respects `prefers-reduced-motion`.
- **Sound system.** New `src/audio/sound.ts` synthesises the entire palette with the Web Audio API — no asset files, no third-party dependencies. Tactile paper / card / wood / tile vocabulary: short band-limited noise taps + low oscillator bodies + envelope shaping, ≤120 ms per cue, peaks well below 0 dB. Nine cues (`select`, `deselect`, `submit`, `wrong`, `correct`, `tabReveal`, `wink`, `win`, `loss`) wired into GameScreen and ResultScreen via a thin `useSound` hook. A `SoundToggle` on the menu persists mute to `foldwink:sound`.
- **Framed share-card as an image.** New canvas renderer (`src/share/shareCard.ts`) draws a 1080×1080 PNG: Foldwink wordmark + accent underline, mode/date line, result headline, status row (time · mistakes · Wink flag), coloured solved grid, footer. `ShareButton` now tries `navigator.share` with a file first, falls back to clipboard image (`ClipboardItem`), then to a download, then to the text-only path. Zero deps.
- **Retention layer.** New `gradeResult` pure function (`flawless`, `clean solve`, `steady solve`, `clutch`, with a `No-Wink Medium` composable flag). `ResultScreen` surfaces the grade as a quiet card. `Stats` gains aggregate counters (`mediumWins`, `mediumLosses`, `totalMistakes`, `winkUses`, `flawlessWins`) and `StatsScreen` gets a new "Depth" section (flawless count, avg mistakes, medium win %, winks spent). All local-only.
- **Mid-game persistence.** Active games now survive a reload. `foldwink:active-session` stores the current `ActiveGame` + puzzle id on every in-game mutation and clears on menu / result transitions. On app init, `appStore.ts` verifies the saved puzzle still exists in the pool and restores the game transparently.
- **Content pipeline extensions.** `scripts/validate-puzzles.ts` now reports a diversity score (distinct group labels / total groups), flags cross-puzzle label collisions, tracks label theme signatures, and emits niche-character warnings. New `docs/content/EASY_VS_MEDIUM_PROFILE.md` pins the cognitive profile; new `docs/content/BATCH_WORKFLOW.md` codifies the scale-to-500 process. Pool held at 98 pending disciplined editorial batches — see report for rationale.
- **Monetization readiness (scoped down).** No ads, no premium, no network analytics in 1.0. A new `AboutFooter` on the menu carries a one-sentence privacy note, a support email, and a clear-local-data affordance. `src/analytics/eventLog.ts` is a purely local aggregate counter — the data never leaves the device. Scope-keeper cut the rest of the master plan's S6 past 1.0.

### Engine / schema

- `ActiveGame` unchanged.
- `Stats` gains 5 optional counters (all backwards-compatible with 0.3.3 saved state).
- `StoreState` drops `dailyPlayedDate`; consumers use `selectDailyPlayedDate` or the `todayDailyRecord` directly.
- `StoreDeps` gains `initialActive`, `initialPuzzle`, `initialScreen` for mid-game resume wiring.
- New persistence keys: `foldwink:sound`, `foldwink:active-session`, `foldwink:events`.
- `applyGameResult` signature changed: now takes a `GameResultContext` (puzzleId, difficulty, mistakesUsed, winkUsed) instead of a bare puzzle id. Internal module only — not exposed to consumers.

### Tests

- `+11` new tests: 8 for `gradeResult`, 3 for the new `applyGameResult` counters. Existing `applyGameResult` and `dailyPlayedDate` test cases migrated to the new signature.
- Total: **76 tests across 10 suites** (up from 65 / 9).

### Bundle

Production build: **243.16 kB JS / 79.39 kB gzip**, 17.60 kB CSS / 4.41 kB gzip. +16 kB gzip over 0.3.3 for a motion token layer, a Web Audio engine, a canvas share-card renderer, a retention layer with grading + mid-game persistence, a local event log, and a privacy/support footer. Three runtime dependencies still.

### Deferred past 1.0 (explicit scope-keeper verdict)

- Any paid / premium / ad surfaces (red-flag)
- Network analytics (red-flag)
- New twist mechanics beyond Foldwink Tabs + Wink (red-flag)
- Accounts, cloud sync, leaderboards (red-line)
- Full 3D or a motion framework (red-line)
- A human-designed wordmark / logotype and a raster OG image (human-art task, not Claude Code)
- Pool beyond 98 — pending disciplined editorial batches (see `docs/content/BATCH_WORKFLOW.md`)
- First in-browser QA pass on a phone-sized and a desktop-sized viewport (unblocks the public-launch checklist)

---

## 0.3.1 — 2026-04-11 — Wink mechanic refinement

Targeted mechanic-quality pass. Makes the Foldwink signature mechanic _active_ instead of purely passive.

### What's new

- **Wink — one-per-puzzle strategic reveal.** On medium puzzles, the player can now tap any unsolved Foldwink Tab to **Wink** it — fully revealing its category keyword immediately, regardless of the progressive-reveal stage. One wink per puzzle. No penalty. Optional. The header row shows a clear `✦ wink ready` / `✦ wink used` chip.
- **Onboarding updated** with the Wink explanation and a visual sample (three concealed tabs + one winked tab in the accent state).
- **Foldwink Tabs component** now accepts `winkedGroupId`, `onWink`, `gameEnded` props and renders unsolved tabs as buttons while a wink is still available.

### Why

The 0.3.0 Foldwink Tabs were a passive progressive reveal — the player watched letters appear but never decided anything. The audit correctly flagged that as "feedback, not a mechanic". Wink adds one small, player-driven, scarcity-constrained decision per medium puzzle: _when_ to spend the rescue. It's anti-snowball (most valuable when stuck), fair (no penalty, optional), and earns the second syllable of the Foldwink name.

### Engine / schema

- `ActiveGame` gains `winkedGroupId: string | null`. Initialized to `null`. One-time mutation per game via the new `winkTab(groupId)` store action. Reset on every fresh game.
- `buildFoldwinkTabs` accepts an optional third `winkedGroupId` parameter. New `canWinkGroup` pure predicate encapsulates all the guards.
- `FoldwinkTab` interface gains a `winked: boolean` field.
- **No puzzle JSON changes.** The 73-puzzle pool (47 easy + 26 medium) is untouched. No `revealHint` rewrites needed.

### Tests

- `+14` new tests for the Wink mechanic:
  - 7 new `buildFoldwinkTabs` / `canWinkGroup` tests.
  - 7 new store-level tests for `winkTab` action behavior and guards.
- Total: **65 tests across 9 suites** (up from 51 / 9).

### Bundle

**208.71 kB JS / 68.48 kB gzip** — +3.03 kB JS / +0.68 kB gzip over 0.3.0. The entire Wink mechanic costs less than 1 kB gzipped.

### Not changed

- No new runtime dependencies.
- No new persistence keys.
- No puzzle schema changes. Every existing puzzle is still valid.
- Easy puzzles are untouched — they have no Wink affordance by design.
- The daily selector, share string, stats, streak delta, and CI pipeline are all untouched.

---

## 0.3.0 — 2026-04-11 — Foldwink Tabs + originality pass

The mechanic pass. Foldwink gains its first real, felt-during-play signature — **Foldwink Tabs** — and the pool grows meaningfully.

### What's new

- **Foldwink Tabs — the new signature mechanic.** On every medium puzzle, a row of 4 small tabs sits above the grid. Each tab holds a short keyword for one category, masked as `R··`. Every correct solve reveals one more letter on every unsolved tab. When a group is solved, its tab snaps to the full category label in its solved color. One-sentence pitch: _"Medium puzzles reveal their categories one letter at a time, faster as you solve."_
- **New `revealHint` field on puzzle groups.** Optional per group. Used by Foldwink Tabs. Short keyword style: `"RED"`, `"FLY"`, `"BEER"`. Documented in `docs/PUZZLE_SCHEMA.md` and `docs/PUZZLE_EDITORIAL_GUIDELINES.md`.
- **Brand mark everywhere.** New `BrandMark` component (SVG motif with subtle animated accent) rendered on the title screen and the onboarding card.
- **Title hero pass.** Bigger wordmark, accent underline, tagline that names the Foldwink Tabs mechanic, reordered CTAs with "Play today's puzzle" first, daily-done-today label, current streak pill.
- **Onboarding rewrite.** The overlay now shows an actual Foldwink Tabs example (`R·· F·· B·· S··`) above the grid illustration and names the mechanic in plain English.
- **Result screen payoff.** New eyebrow text (`FOLDWINK · CLEARED` / `FOLDWINK · CLOSE CALL`), bigger headline, accent underline, gentle `fw-result-pop` entrance animation, `fw-streak-pulse` on the streak card.
- **Reduced-motion support.** All new animations respect `prefers-reduced-motion: reduce`.
- **Content:** pool expanded from 42 → **73 puzzles (47 easy + 26 medium)**. Every medium now carries Foldwink Tabs hints.

### Removed

- **Anchor twist.** The 0.2.0 "anchor hint" (one ★ card + header banner) is gone. It was a passive sticker, not a felt mechanic. The Foldwink Tabs mechanic replaces it completely.

### Schema changes

- **Added:** `PuzzleGroup.revealHint?: string` — short keyword used by Foldwink Tabs on medium puzzles.
- **Removed:** top-level `Puzzle.twist` field and the `AnchorTwist` type.
- Backwards-compatible for easy puzzles (no field change).
- All 42 legacy puzzles migrated: twist fields stripped, `revealHint` added to every medium group.

### Docs

- `docs/PUZZLE_SCHEMA.md` — rewritten for `revealHint` and Foldwink Tabs.
- `docs/PUZZLE_EDITORIAL_GUIDELINES.md` — new, three-question test + difficulty rules + revealHint tips.
- `docs/CONTENT_EXPANSION_NOTES.md` — new, pipeline tracker.
- `docs/RESEARCH_SOURCES.md` — new, web research log with query list and source domain notes. **No puzzle boards or wording were copied from any source.**
- `docs/KNOWN_LIMITATIONS.md` — updated.

### Tests

- `+8` new tests for Foldwink Tabs (`revealStage`, `hintFor`, `buildFoldwinkTabs`).
- `−3` old anchor tests removed.
- Total: **51 tests across 9 suites**.

### Bundle

Production build: **205.68 kB JS / 67.80 kB gzip** (+15.95 kB / +5.93 kB over 0.2.0, mostly from +31 puzzles and the new component surface). Same 3 runtime dependencies.

---

## 0.2.0 — 2026-04-11 — Foldwink rebrand + polish pass

Consolidation pass following the internal audit. Same core loop, much closer to a polished indie MVP.

### What's new

- **Brand:** product is now consistently named **Foldwink** across code, UI, docs, and storage keys. The previous internal codename was "Cluster Twist" — preserved only in this historical note.
- **Anchor twist — Foldwink's signature mechanic.** Medium puzzles can declare a `twist: { kind: "anchor", item }` hint. At game start the anchor card shows a ★ badge and a header banner reveals its category. One starting clue, still 12 items to place — a fair head-start that also teaches word-play mediums naturally.
- **First-run onboarding overlay.** Two sentences of rules + a grid illustration + "Got it". Persisted via `foldwink:onboarded`.
- **Sharing.** Result screen has a share-result button that uses `navigator.share` where available and falls back to clipboard. Output is a compact `Foldwink · <date or #NNN>` card with the classic emoji grid.
- **Next-daily countdown** on the daily result screen, counting local hours to midnight.
- **Streak celebration** card on the result screen when a winning run advances the streak.
- **Real brand assets.** New favicon, OG image (`/og.svg`), Twitter Card meta, Open Graph meta, `manifest.webmanifest`, consistent `theme-color`.
- **Content:** pool expanded from 30 → 42 puzzles (26 easy + 16 medium), of which 10 mediums now carry anchor twists.

### Fixed

- **Cross-screen solved-color mismatch.** Colors on the game screen and the result screen are now resolved through a single `src/game/solvedColors.ts` using the puzzle-group positional index. No more "yellow in play, green in reveal".

### Engineering

- **Store refactor.** Persistence is no longer inlined into store action bodies. The game store (`src/game/state/store.ts`) mutates state only; a thin persistence subscriber (`src/game/state/appStore.ts`) writes stats / progress / daily history / onboarding flag when those slices change. The store now takes an injectable `StoreDeps` (pool, clock, today-local) which made it trivially testable.
- **New tests.** Added store-level tests (9) covering standard cursor, daily replay guard, selection limits, streak delta, onboarding dismissal. Added share-string tests (2), anchor-twist tests (3), countdown tests (3). Total: **43 tests**, up from 26.
- **Tooling:** ESLint 9 flat config, Prettier, GitHub Actions CI (`typecheck / test / validate / lint / format:check / build`).
- **Dead code removed:** dead ESLint directive in `loader.ts`, dead `tags` / `editorialNotes` fields in the Puzzle type.

### Bundle

Production build: 188.96 kB JS / 61.87 kB gzip (42 puzzles baked in).

---

## 0.1.0 — 2026-04-10 — Internal MVP (codename: "Cluster Twist")

First playable build. Internal only — never shipped publicly.

### In

- 4×4 grid, select/deselect, submit exactly 4
- Correct group detection, colored lock-in
- 4-mistake budget, win/loss states
- Standard mode sequential progression
- Daily mode deterministic selection by local date
- Result screen, stats screen, local persistence
- 30 curated puzzles (18 easy, 12 medium)
- 26 Vitest tests

### Fixed in 0.1.0

- **BUG-001:** daily replay double-counted stats. Fixed via a `countsToStats` flag on the active game; replays show a "· replay" subtitle and do not touch stats or daily history.

### Not in 0.1.0

No backend, accounts, sync, leaderboards, ads, analytics, localization, procedural generation, one-away hint, share, keyboard shortcuts, or themed packs. All deferred.
