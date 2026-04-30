# Foldwink Architecture Audit — G1 (Claude, Opus 4.7 1M)

Date: 2026-04-20
Version: 0.6.5
Scope: architecture-only. No feature proposals. Red-lines from `CLAUDE.md` respected.

---

## 1. Overall posture

Foldwink's codebase is coherent for a small indie product past MVP. It holds the
CLAUDE.md line on minimalism: 3 runtime deps (react/react-dom/zustand), zero
routing, zero animation framework, zero backend. Logic is centred in a single
Zustand store with pure engine helpers feeding it, and the 4 screens are thin
render layers. The biggest posture risk is no longer conceptual — the red lines
hold — it is mechanical: 1,505 puzzle JSONs across 3 languages are eager-bundled
into one JS chunk (`src/puzzles/loader.ts:3-6`, `loaderDe.ts:3-6`, `loaderRu.ts:3-6`),
which produces a 1.63 MB single-file bundle (`dist/assets/index-*.js`, 1,707,513
bytes). Runtime code remains tiny; content is the only weight. See §6.

---

## 2. Module boundaries

### Engine — pure (src/game/engine/)

All engine modules are pure and testable:

- `submit.ts` — `canSubmit`, `findMatchingGroup`, `isOneAway` take
  `readonly string[]` / `Puzzle` and return values. No state, no IO.
- `progress.ts` — `applyCorrectGroup`, `applyIncorrectGuess`, `isWin`, `isLoss`.
  Immutable spreads only.
- `result.ts` — `calculateResultSummary` is pure; `formatDuration` is pure.
- `share.ts` — `buildShareString` is pure, takes an optional `strings` object
  for i18n.
- `shuffle.ts` — deterministic `shuffleDeterministic`, `seedFromString` via
  FNV-1a, `shuffleItems`. Uses a mulberry32 PRNG — no global state leakage.
- `foldwinkTabs.ts` — `buildFoldwinkTabs`, `canWinkGroup`, `revealStage`,
  `revealStageHard`. Pure.
- `grading.ts` — `gradeResult` is pure.
- `readiness.ts` — `mediumReadiness`, `hardReadiness`, plus display helpers.
  Pure; depends on `Stats` + `Strings`.

The engine/ directory has exactly **zero** side effects. This is good.

### State — side-effectful by design (src/game/state/)

- `store.ts:173-468` defines `createStore(deps)` — the Zustand factory.
  Actions mutate store state immutably and derive values via the pure engine.
- `appStore.ts` composes `createStore` with language-aware loader getters and
  sets up external side-effects (`subscribe` persistence at lines 217-260 and
  cross-store language reset at 267-275).

Boundary is mostly clean. The one blur:

- `store.ts:334-415` (`submit`) contains stats-advancement logic inline —
  `applyGameResult(...)` call (line 366), progress-cursor bumping, daily
  record authoring. That is tied tightly to action dispatch rather than
  extracted into an `advanceAfterResult` engine function. Not a correctness
  bug — just means `submit` is the longest action (81 lines) and the one
  place where all three domains (game/stats/progress) converge. Documented
  here rather than fixed; the shape is still readable.

### Screens — dumb views (src/screens/)

Screens read selectors from the store and call actions:

- `MenuScreen.tsx` — reads pool sizes from loaders directly (lines 17-19) in
  addition to reading from store. Documented further in §5.
- `GameScreen.tsx` — consumes `active`, `puzzle`, `flash`; calls actions.
  Hosts a keyboard-binding `useEffect` and a "confirm quit" UI state. Legal.
- `ResultScreen.tsx` — consumes `summary`, calls `gradeResult` (engine,
  line 52), builds share card data. Legal.
- `StatsScreen.tsx` — read-only consumer.

All four screens are under ~275 lines.

### Verdict

Boundaries are respected. The one inline composition in `submit` is fine at
this scale — extracting it would add a new module without changing the
correctness or testability of the behaviour.

---

## 3. State machine health

The store threads screen transitions through a single `screen: AppScreen`
field (`store.ts:33`). States: `menu | game | result | stats`.

### Transition paths (verified by reading every action in store.ts)

- `menu → game` — `startStandard` / `startEasy` / `startMedium` / `startHard`
  / `startDaily` (lines 188-288). Each sets `screen: "game"` and seeds a fresh
  `active`.
- `game → result` — emitted only inside `submit` (line 410) after
  `finalizeIfEnded` returns `ended: true`.
- `game → menu` — `goToMenu` (line 417). Also reachable from `GameScreen` via
  the "confirm quit" UI.
- `result → game` — `startNextSame` (line 433) routes by difficulty.
- `result → stats` — `showStats` (line 429).
- `result → menu` — `goToMenu`.
- `stats → menu` — `goToMenu`.
- `menu → stats` — `showStats`.

No unreachable states. No duplicate paths. `startStandard` is a thin alias
for `startEasy` (`store.ts:188-190`) retained for test fixtures
(`store.test.ts` uses it throughout); at runtime the MenuScreen calls
`startEasy` directly. Harmless, but see §9.

### Mid-session resume

`appStore.ts:75-102` restores an unfinished session from `localStorage:
foldwink:active-session` on boot. The guard is correct:

- Finalised sessions are cleared, not restored (lines 80-83).
- The puzzle id must still be in the **current language's** pool (lines 87-96).
- Mismatched `session.active.puzzleId` vs loaded puzzle clears the session
  (lines 97-99).

### Language switch

`appStore.ts:266-275` subscribes to `useLangStore`. On change, if a game
is active or the user is on game/result, it forces `goToMenu()` and clears
the session. This is the right call — language-mixed chrome/content would be
jarring. Potentially subtle: the language-listener callback uses the mutable
`prevLang` closure. Since `appStore.ts` is a module singleton and
`useLangStore` is too, this is fine in practice.

### Stale state risks

- `StoreState.poolSize` (`store.ts:38, 179`) is seeded once from `deps.pool.length`
  and never updated when language changes. It is not read by any screen —
  MenuScreen recomputes pool size from the loader directly
  (`MenuScreen.tsx:43`). Safe but dead; see §9.
- `progress.cursor` is a pre-0.4.2 legacy field (`stats.ts:52-56`) kept in
  sync with `easyCursor` for backward compatibility (store.ts:378-383). Old
  saves without the per-tier cursors still work; new code reads
  `progress.easyCursor ?? progress.cursor ?? 0` (`store.ts:130`).

### Verdict

State machine is small, healthy, and fully reachable. Resume logic is careful.
One dead `poolSize` field in the store (never read).

---

## 4. Type safety

Overall: strict-TypeScript-clean. `tsc --noEmit` is wired as a build gate
(`package.json:8`).

### `any`

None in `src/`. `grep -r ": any" src/` and `grep -r " as any" src/` return zero
matches.

### `unknown` casts

Used sparingly and justifiably:

- `src/audio/sound.ts:114-116` — `(window as unknown as { AudioContext?: ... })`
  to support the legacy `webkitAudioContext` prefix on older Safari. This is
  the standard dance.
- `src/components/ShareButton.tsx:55` — `(window as unknown as { ClipboardItem?: ... })`
  for feature-detection of `ClipboardItem`. Standard.
- `src/puzzles/loader.ts:16, 22` (and DE/RU twins) — walking `v.groups as unknown[]`
  inside an `isValidPuzzle` type-guard. Correct pattern: every field is
  re-narrowed before the function returns `true`.

### Non-null assertions (`!`)

Not used in `src/` production code. `grep "!\." src/` matched only test files
(`store.test.ts`, `persistence.test.ts`, `stats.test.ts`) where they narrow
mocked-puzzle types. Acceptable.

### Discriminated unions

The three union types are:

- `AppScreen = "menu" | "game" | "result" | "stats"` (`game.ts:2`)
- `GameResult = "win" | "loss"` (`game.ts:3`)
- `GameMode = "daily" | "standard"` (`game.ts:1`)
- `SoundEvent` / `HapticEvent` — string unions.

All are plain string literal unions, not tagged-object unions. Given how small
the domain is this is the right choice — a full discriminated union for
`ActiveGame` by result state (`active | won | lost`) would add ceremony
without unlocking new correctness, because only `submit` transitions between
states and it already narrows `finalized.active.result` explicitly.

### Minor tightening opportunities

- `Puzzle.groups` is `[PuzzleGroup, PuzzleGroup, PuzzleGroup, PuzzleGroup]`
  (tuple-of-4, `puzzle.ts:75`). Good.
- `PuzzleGroup.items` is `[string, string, string, string]` (`puzzle.ts:63`).
  Good.
- `ResultSummary.solvedGroupIds: string[]` (`result.ts:7`) is a plain array.
  Could be tightened to `readonly string[]` since consumers only read.
  Non-blocking.

### Verdict

Type safety is strong. No `any`, no unsafe non-null assertions, unknown casts
are isolated to browser-feature detection or a type-guard. No tightening
action is load-bearing.

---

## 5. Dependency graph

Direction: screens → store → engine → types. Plus screens → loaders (read-only).

### Sanctioned cross-layer imports

- Screens import engine helpers directly for read-only computations:
  `GameScreen.tsx:10` imports `canSubmit`; `ResultScreen.tsx:8-10` imports
  `buildShareString`, `gradeResult`, `mediumReadiness`. This is the
  engine-as-library pattern, not state bypass, and is healthy.
- Components import `formatDuration` from `engine/result` (`DailyCompleteCard.tsx:2`,
  `DailyArchive.tsx:4`, `ResultSummary.tsx:3`) and `buildFoldwinkTabs` in
  `FoldwinkTabs.tsx:3`. All are pure helper calls.

### Notable direct loader imports from screens

`MenuScreen.tsx:17-19` imports from all three loaders:

```
import { HARD_POOL, PUZZLE_POOL } from "../puzzles/loader";
import { DE_PUZZLE_POOL, DE_HARD_POOL } from "../puzzles/loaderDe";
import { RU_PUZZLE_POOL, RU_HARD_POOL } from "../puzzles/loaderRu";
```

This is the only leak — the store exposes no language-aware pool-size
selector, so `MenuScreen` computes one itself (`MenuScreen.tsx:31-43, 57-58`).
Symmetrical but duplicated against `appStore.ts:161-184` (`langGetPool`,
`langGetHardPool`). Both files encode the same "prefer language pool, fallback
to EN" rule. This duplication is small but real. Documented in §9.

### No imports exist in the "wrong direction"

- engine/ does NOT import from state/ or screens/.
- types/ imports nothing from state/, screens/, or components/.
- store.ts imports only from engine/, types/, stats/, puzzles/, utils/,
  i18n/ (for lang read).

### Verdict

Graph is clean. One small duplication (pool-selection logic in MenuScreen vs
appStore). Nothing structurally broken.

---

## 6. Bundle size risk (the actual problem)

### Measured

`dist/assets/index-D71bZRwb.js` = **1,707,513 bytes** (~1.63 MB, ungzipped).
The CLAUDE.md baseline in TODO.md:87 cites 321 kB JS / 103 kB gzip as the
0.6.1 shipping number. Today's build has grown roughly 5× on that raw figure.
CSS is stable at ~20 kB.

### Root cause: confirmed

All three loaders use `import.meta.glob` with `eager: true`:

- `src/puzzles/loader.ts:3-6` — `../../puzzles/pool/*.json`
- `src/puzzles/loaderDe.ts:3-6` — `../../puzzles/de/pool/*.json`
- `src/puzzles/loaderRu.ts:3-6` — `../../puzzles/ru/pool/*.json`

`eager: true` inlines every matched module into the importing chunk.
Counts (measured):

- puzzles/pool (EN): 501 files, 3.2 MB raw
- puzzles/de/pool (DE): 500 files, 2.3 MB raw
- puzzles/ru/pool (RU): 505 files, 2.3 MB raw

Total: **1,506 JSONs, 7.8 MB raw**, all loaded into the single bundle. The
bundle compresses to under 200 kB gzipped because the JSONs are highly
repetitive, but the uncompressed-parse cost sits in JS memory regardless.

### Why this matters on a static web deploy

- Every user, including those who only ever play English, downloads and
  parses the DE + RU content (~two thirds of the payload).
- `vite.config.ts` (read, 11 lines) has no `build.rollupOptions.output.manualChunks`
  configuration — everything lands in one chunk.
- React + React-DOM + Zustand compresses tightly and is not the culprit.

### Proposed mitigation (code-splitting per language)

Two options, both within red lines (no backend, no services, no new deps):

- **Option A (minimal):** switch the three loaders from `eager: true` to
  `eager: false`. `import.meta.glob` then returns `Record<string, () => Promise<T>>`
  and Rollup code-splits each language's JSONs into its own async chunk.
  The store's language-aware getters become async, which is a meaningful
  refactor — every `startEasy/Medium/Hard/Daily` becomes async-aware.
- **Option B (less invasive):** keep EN eager (always needed as fallback;
  also the most common language) but make `loaderDe.ts` and `loaderRu.ts`
  eager = false, and front-load them only when `useLangStore.lang` becomes
  `de` / `ru`. The store already reads language lazily (`getLangSync` on
  every call) so this is the lightest touch.

Recommendation: **Option B**. It cuts the bundle by ~two thirds for EN users
(the majority) without forcing every action path to go async, and it does
not reshape the store API.

### Verdict

The 1.63 MB bundle is overwhelmingly content, not code. Code-splitting per
language is the correct remediation. One-file mega-bundle is the single
biggest mechanical drift away from the "small indie" posture.

---

## 7. Error surface

What can fail silently:

### Missing puzzle

- `loader.ts:33-47` — in dev (`import.meta.env.DEV`) an invalid JSON throws.
  In prod it `console.warn`s and drops the puzzle. Safe default.
- `appStore.ts:93-100` — a resumed session whose puzzle id is missing or
  mismatched is discarded and the saved session is cleared.
- `store.ts:200, 219, 239, 276` — every `startEasy/Medium/Hard/Daily` uses a
  conservative `if (!puzzle) return;` guard so the action is a safe no-op if
  the pool is empty for that tier. Menu disables tiers that have no content
  via `hardReadiness().hasContent`.
- `daily.ts:5-7` — throws `"Puzzle pool is empty; cannot pick daily puzzle"`.
  Reachable only if **every** tier the player has unlocked is empty. In
  practice `MenuScreen` also renders the "empty pool" card before a daily
  button is even offered (`MenuScreen.tsx:52, 98-104`). Fine.

### Corrupted localStorage

- `utils/storage.ts:1-17` — `safeRead` wraps `JSON.parse` in `try/catch` and
  returns the fallback; `safeWrite` quietly swallows quota errors. Every
  persistence call goes through this. Robust.
- `stats/persistence.ts:16-23` — `loadStats` layers `INITIAL_STATS` under the
  parsed value, so missing new fields (e.g. `hardWins`) are filled in.
  Backward compat honoured.
- Not defended: `loadStats` does not validate shape beyond spreading. If a
  user manually edits `foldwink:stats` in devtools to inject e.g. `wins:
  "abc"`, the app will run with the junk value. Low severity — this is a
  single-user local store.

### Failed audio asset

- `audio/sound.ts:117, 125-127` — if AudioContext construction fails, every
  `playSound` is a no-op. Gameplay doesn't depend on sound (CLAUDE.md red
  line respected at :21).
- `audio/sound.ts:348-372` — iOS suspended-context path is explicitly
  handled.

### Language mismatch

- Resume logic (`appStore.ts:87-100`) guards against a puzzle id that no
  longer resolves in the current language.
- Language-switch handler (`appStore.ts:266-275`) clears active state on
  language change.
- The fallback chain `langGetPuzzleById` in `appStore.ts:108-113` always
  falls back to the EN pool when a non-EN language has no hit. That's defensive
  but also means a DE player could briefly see an EN puzzle title if resumed
  state pointed at an ID only present in EN — but the earlier guard at line 93
  rules that path out.

### Error boundary

`components/ErrorBoundary.tsx` (57 lines) wraps the app (`main.tsx:12-14`)
and presents a Reload CTA. Good last-line defence.

### Verdict

Error surface is small and well-covered. No silent crash vectors.

---

## 8. Testability

### What is tested (vitest)

Count: 11 test files (per `package.json:91`, "108 / 108 across 11 suites"):

- `engine/__tests__/foldwinkTabs.test.ts` (129 lines)
- `engine/__tests__/grading.test.ts` (98 lines)
- `engine/__tests__/progress.test.ts` (79 lines)
- `engine/__tests__/readiness.test.ts` (316 lines)
- `engine/__tests__/share.test.ts` (49 lines)
- `engine/__tests__/shuffle.test.ts` (53 lines)
- `engine/__tests__/submit.test.ts` (46 lines)
- `state/__tests__/store.test.ts` (463 lines)
- `stats/__tests__/persistence.test.ts`
- `stats/__tests__/stats.test.ts`
- `puzzles/__tests__/daily.test.ts`
- `utils/__tests__/countdown.test.ts`

The pure game engine and the Zustand store are both under test. Readiness is
extensively covered (316 lines), which is appropriate — it is the source of
UX nudges.

### What is not tested

- **Components** — zero tests for any `.tsx` component. Acceptable at this
  scale (visual/interaction tests would double the dev burden); e2e in
  `tests/e2e/` (Playwright) covers the rendered flow.
- **Share card renderer** (`src/share/shareCard.ts`) — canvas drawing code,
  not unit tested. Runs against a browser canvas. Visual QA via
  `scripts/preview-share-cards.html` (per TODO.md:24). Reasonable.
- **Sound recipes** (`src/audio/sound.ts`) — no tests (Web Audio is hard to
  mock cleanly). The `resetSoundForTests` export exists (`sound.ts:374-386`)
  but is only referenced in the report doc, not in an actual test
  (grep confirms no `.test.ts` uses it).
- **Loader behaviour with malformed JSON** — no explicit test that proves
  `isValidPuzzle` rejects a bad file. In dev it throws; in prod it drops.
  Testable via fixture.
- **i18n fallbacks** — `langGetPuzzleById` etc. have a fallback-to-EN
  branch (appStore.ts:108-137) not covered by the store tests (which pass
  in English-only fixtures).

### What should be tested (priority)

- i18n fallback behaviour in `appStore.ts` language getters (small, self-contained).
- The language-switch subscribe handler in `appStore.ts:266-275` — the only
  test currently exercising cross-store reactivity.

### Verdict

Test coverage is strong where it matters (engine + store). Component-free
testing is a deliberate minimalism choice that pays off — 108 tests, fast
vitest suite. Two small gaps (language getters, lang-switch reset) are worth
closing.

---

## 9. Dead / duplicated code

Identified items, all minor:

### 9.1 `startStandard` is a thin alias

`store.ts:47, 188-190` — `startStandard` calls `startEasy`. It is wired into
`StoreState` and covered in `store.test.ts` (24 call sites), but no screen
calls it (MenuScreen calls `startEasy` directly). Either keep the test alias
and stop exposing it in `StoreState`, or drop it. Low priority.

### 9.2 `selectDailyPlayedDate` selector not referenced

`store.ts:135-136` — exported selector, never imported anywhere. Grep
confirms exactly one match (the definition). Dead export.

### 9.3 `StoreState.poolSize` not read

`store.ts:38, 179` — `poolSize` is in the state shape but no screen reads it;
`MenuScreen.tsx:43` recomputes from the loader. Also non-reactive to language
change (stays at EN pool size forever). Dead field.

### 9.4 Per-language pool-selection logic duplicated

Same rule lives in both places:

- `appStore.ts:161-184` — `langGetPool`, `langGetEasyPool`, `langGetMediumPool`,
  `langGetHardPool` (24 lines).
- `MenuScreen.tsx:31-43, 57-58` — inline `langPool` and `langHardPool` with
  the same fallback ladder.

Not a bug, but both should delegate to a single helper.

### 9.5 Non-ramped `getEasyByIndex` / `getMediumByIndex` / `getHardByIndex`

`loader.ts:95-105` (and DE/RU twins) — these are kept as `StoreDeps` fallback
getters for test fixtures (`store.test.ts:36-38`). At runtime every path now
uses the `*Ramped*` variants (`store.ts:195, 217, 235`). Retained for test
simplicity; worth a comment but not removable without cascading test
churn.

### 9.6 `resetSoundForTests`

`audio/sound.ts:374-386` — exported for test use, but no test currently
imports it (grep confirms only report-doc references). Either add a test
that resets state between cases, or remove.

### 9.7 `Stats.hardWins` / `hardLosses` not displayed

`types/stats.ts:37-39` — tracked by `stats.ts:66-67, 95-97` and consumed only
by `readiness.ts:209-272`. `StatsScreen.tsx` shows flawless / avg misses /
medium win rate / wink uses — there is no Hard breakdown cell. Design choice
(Hard content is minimal at 34 puzzles per TODO.md:49), not a bug. Worth
revisiting once the Hard pool expands.

### 9.8 `FlatItem` type is single-use

`puzzle.ts:80-83` — used only inside `shuffle.ts:5-11`. Could be inlined.
Extremely low priority.

### 9.9 Legacy `progress.cursor` field

`stats.ts:51-56` — kept in sync (`store.ts:382`) for old saves. By design.
Not dead but worth a dated comment about when the fallback can be removed.

---

## 10. Red-line compliance

Cross-checked against the CLAUDE.md red lines:

| Red line                                      | Status            |
| --------------------------------------------- | ----------------- |
| No backend / auth / cloud sync                | Respected. All state is `localStorage`. |
| No ads / premium / pay-to-win                 | Respected. No IAP code paths, no ads tag. |
| No motion framework / animation library       | Respected. Motion tokens in `styles/motion.ts:12-25`, CSS-only. |
| No 3D renderer                                | Respected. Canvas 2D share card only (`shareCard.ts`). |
| No multi-mechanic beyond Tabs + Wink          | Respected. Tabs + Wink is the only twist system. |
| No FOMO / login-streak-saver retention tricks | Respected. No streak-saver, no time-limited gate. Daily archive is informational. |
| Sound never gates gameplay                    | Respected. `sound.ts:21-22` explicit comment; all `play()` calls are decorative. |
| Network analytics gated behind privacy surface| Respected. `analytics/eventLog.ts` is 100% local. The `About` footer surfaces the privacy note and a clear-button. |

### Drift watch

- The grade system (`grading.ts`) adds "No-Wink Medium" as a positive framing
  (`grading.ts:78-90`). Still a facts-based grade (it reads active state),
  not an unlock. Not drift.
- Retention TODO items under `docs/TODO.md:51-55` ("grade-based
  micro-achievements", "daily calendar browser") would sit adjacent to the
  FOMO line but do not cross it as currently described — local-only,
  non-gating. Worth re-auditing when those land.

### Verdict

No red-line violations. Cleanly within scope.

---

## 11. Top 5 concrete actions (priority order)

### 1. Code-split puzzle pools per language  — HIGH impact / MEDIUM effort

Switch `loaderDe.ts` and `loaderRu.ts` from `import.meta.glob(..., { eager: true })`
to `eager: false`, and lazy-load when `useLangStore.lang` becomes `"de"` or
`"ru"`. Expected impact: ~60% bundle reduction for EN users (majority), no
API changes to the store. The EN loader can stay eager as the fallback.

Files: `src/puzzles/loaderDe.ts`, `src/puzzles/loaderRu.ts`, `src/i18n/useLanguage.ts`
(or `appStore.ts:267-275` to trigger the load). Also consider adding
`build.rollupOptions.output.manualChunks` in `vite.config.ts:5-11` to name the
chunks.

Effort: ~0.5 day. Impact: largest mechanical win available. Aligns with "small
indie" posture and respects red lines.

### 2. Consolidate language-aware pool-selection into one helper — LOW effort

Extract the `langGetPool` / `langGetHardPool` fallback ladder to a tiny
`src/puzzles/byLang.ts` module and consume it from both `appStore.ts:161-184`
and `MenuScreen.tsx:31-43`. Removes ~30 lines of duplicated branching and
lets the two callers stay honest.

Effort: ~1 hour. Impact: removes a documented drift vector (§9.4).

### 3. Remove the four dead exports — LOW effort

- `store.ts:47, 188-190` — drop `startStandard` from `StoreState` (keep as
  test helper only if needed).
- `store.ts:135-136` — delete `selectDailyPlayedDate`.
- `store.ts:38, 179` — delete `poolSize` field (unused by any consumer).
- `audio/sound.ts:374-386` — either import from one test, or drop.

Effort: ~30 minutes. Impact: reduces surface area, no behaviour change.

### 4. Add two targeted store tests — LOW effort

- Test the EN-fallback behaviour of `langGetPuzzleById` /
  `langGetPuzzleByIndex` in `appStore.ts:108-137` (via a thin wrapper that
  exposes the pure function).
- Test the language-switch reset in `appStore.ts:266-275` — a cross-store
  subscribe whose regression would be silent.

Effort: ~1.5 hours. Impact: closes the main untested seam between i18n and
game state.

### 5. Document the `progress.cursor` legacy deprecation — LOWEST effort

Add a dated TODO comment to `stats.ts:52-56` and `store.ts:378-383` noting
when the legacy-cursor fallback can be removed (e.g. "after 2026-Q4, assume
`easyCursor` is always present"). No code change now. Prevents the fallback
from becoming permanent ambient cost.

Effort: ~10 minutes. Impact: documentation hygiene.

---

## Appendix: notable architectural choices that are good

- Single source of truth for motion in `src/styles/motion.ts` (28 lines).
- Every localStorage key is `foldwink:*`-namespaced; `persistence.ts:93-105`
  can wipe all owned state in a single scan.
- `playSound`/`triggerHaptic` are the only call sites that touch
  `AudioContext` / `navigator.vibrate`; every UI call goes through the hooks
  (`useSound.ts:63-66`, `useHaptics.ts:56-60`).
- Daily puzzle determinism is preserved across the scale-to-500 push: the
  daily-mode path reads id-sorted pools (`store.ts:253-256`), not ramped
  pools, so historical dailies stay stable.
- `ErrorBoundary` presence + "your stats are saved" copy in the fallback UI.
- The `countsToStats` flag on `ActiveGame` (`game.ts:15`) cleanly separates
  replay runs (e.g. re-playing today's daily) from recorded ones — a small
  but honest design.
