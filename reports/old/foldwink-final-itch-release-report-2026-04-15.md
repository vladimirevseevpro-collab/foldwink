# Foldwink Final Itch.io Release Report

**Date:** 2026-04-15
**Version audited:** 0.6.1
**Scope:** final pre-itch.io release gate — verify, harden, report. No feature work.

---

## 1. Executive summary

**Verdict: READY FOR ITCH.IO TEST RELEASE.**

Foldwink 0.6.1 is a finished-feeling minimalist daily grouping puzzle. A
previous sprint chain (0.4.x visual polish → 0.5.x progression/content → 0.6.x
release-hardening + QA triage) has already closed the major surface issues.
This pass did one targeted correctness fix to the personal-record path and
verified every release-gate category end-to-end.

### Fixed in this pass

- **False "new best" celebration on ResultScreen.** The UI used
  `currentStreak === bestStreak && bestStreak >= 3`, which fires on ties as
  well as strict improvements because `bestStreak = max(old, current)` makes
  them equal whenever `current ≥ oldBest`. Replaced with a dedicated
  `newBest` flag in the store, set only when `nextStats.bestStreak >
stats.bestStreak` on a stat-counting win. Added 7 store tests and 2
  persistence tests covering first win, strict improvement, tie, loss,
  reset, daily replay, and abandon-mid-run.

### Already closed by earlier passes (verified, not re-touched)

- Onboarding, Foldwink Tabs + Wink, daily deterministic pick, stats
  persistence, clear-all-data two-tap, mobile viewport + safe area, `base:
"./"` for embed, ESLint `no-console` in prod, 200-puzzle pool with
  validator gate, itch-embed smoke test, content expansion to
  105/75/20 (E/M/H), haptics with mute-persisted gate, sound palette
  with useSound hook, share string + SVG share card.

### Intentionally postponed (non-blocking)

- Human audio-palette listening pass (all 9 cues currently synthesised).
- Raster OG image (SVG only today — works for itch.io page, weaker for
  social link previews).
- Final wordmark / brand polish.
- Real itch.io upload walkthrough (only approximated via embed smoke test).

---

## 2. Current implementation snapshot

### Stack

- React 18.3.1 + TypeScript 5.6.3 + Vite 5.4.10 + Tailwind 3.4.14
- Zustand 4.5.5 for app state; pure functions for engine/grading/share
- Vitest 2.1.4 for unit tests; Playwright 1.59.1 for e2e smoke
- ESLint + Prettier; `no-console` rule allows `warn`/`error` only
- `base: "./"` in Vite — relative asset paths, embed-safe

### Build

- `npm run build` → `tsc --noEmit && vite build`, 1.57s cold.
- Output: `dist/index.html` 1.86 kB, `index-*.css` 18.48 kB (4.54 kB gzip),
  `index-*.js` 325.36 kB (104.04 kB gzip). Single JS/CSS bundle, no
  runtime chunking — appropriate for a static puzzle app.
- Favicon + manifest rewritten to relative paths in the produced
  `dist/index.html` (verified: `href="./favicon.svg"`, `./manifest.webmanifest`).

### Core loop

1. Menu (Daily / Easy / Medium / Hard) →
2. Game (16 cards, 4×4 grid, select 4, submit; 4 mistakes = loss; all
   4 groups solved = win; medium adds Foldwink Tabs + one Wink per
   puzzle) →
3. Result (grade, streak celebration if earned, share, next puzzle / back
   to menu) →
4. Repeat via `startNextSame` (one tap, preserves difficulty).

### Persistence model

All `localStorage`, namespaced `foldwink:*`:

- `foldwink:stats` — `Stats` object (wins, losses, streaks, recent solves,
  medium/hard counters, wink uses).
- `foldwink:progress` — easyCursor / mediumCursor / hardCursor.
- `foldwink:daily` — per-date `DailyRecord` dictionary.
- `foldwink:onboarded` — boolean, dismissal flag.
- `foldwink:active-session` — mid-game snapshot; restored only if not
  finalised.
- `foldwink:events`, `foldwink:sound`, `foldwink:haptics` — settings.

`clearAllLocalData()` scans `localStorage` and removes every `foldwink:`
key, leaving unrelated keys untouched.

### Mobile / browser context

- Viewport: `width=device-width, initial-scale=1.0, viewport-fit=cover`.
- Theme colour set for mobile chrome.
- Grid uses `grid-cols-4 gap-2 sm:gap-3 w-full max-w-md`; tested at
  320×568 / 390×844 / 1280×800 with zero horizontal overflow.
- State-driven routing (no URL router), so iframe back-button and refresh
  behave as full reload → session restore.

---

## 3. Release-gate findings

| Category                  | Status   | Key findings                                                                                                                                                                                                                                      | Action taken                                              |
| ------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| **First-run clarity**     | ✅ Green | `Onboarding.tsx` shows a 4-card demo, 3 tier bullets, rules, and a single Got-it action. Flag persists. Acceptable for a public test.                                                                                                             | None — do not overbuild.                                  |
| **Core loop**             | ✅ Green | Result → `startNextSame()` → game in one click; cursor advances on win; preserves difficulty. No dead time.                                                                                                                                       | None.                                                     |
| **Input reliability**     | ✅ Green | Selection capped at 4, deselect on second tap, submit disabled if not 4, solved items non-selectable, wink no-ops on solved/unknown groups (covered by 6 tests in `store.test.ts`).                                                               | None.                                                     |
| **Mobile UX**             | ✅ Green | `viewport-fit=cover`, safe-area friendly layout, Tailwind responsive gaps, `max-w-md` grid, `max-w-xl` main. Longest category label currently 13 chars — fits comfortably at 320 px.                                                              | None.                                                     |
| **Embed readiness**       | ✅ Green | `base: "./"`, built index.html uses relative favicon/manifest paths, no `window.parent` or `requestFullscreen` assumptions, `navigator.share` guarded in `ShareButton`, localStorage used straight (works in iframe on same-origin itch hosting). | Verified; no change.                                      |
| **Performance / startup** | ✅ Green | 104 kB gzip bundle, no blocking work before first render, all puzzles bundled statically, no module-level `new Audio()` (goes through `useSound` hook).                                                                                           | None.                                                     |
| **Feedback / polish**     | ✅ Green | Card flash (correct/incorrect), streak pulse only when earned, grade chip on result, haptics gated by support + mute toggle, sound gated by mute toggle.                                                                                          | Record fix removes a false-positive celebration — see §4. |
| **State correctness**     | ✅ Green | `tryResumeSession()` rejects finalised sessions; `countsToStats=false` on daily replay; abandoning mid-run via `goToMenu()` does not touch stats (verified by new test). `newBest` is reset on every `start*` / `goToMenu`.                       | Added `newBest` flag + reset-on-start.                    |

---

## 4. Record / best-result audit

### Canonical metric

**Personal record = `bestStreak`** — longest chain of consecutive wins
across all difficulties and modes. `higher-is-better`. This is the product
record; no parallel "best time" / "best score" exists, and none was added
(scope red line: minimalism).

### Storage

- Key: `localStorage["foldwink:stats"]`.
- Shape: `Stats.bestStreak: number`, alongside `currentStreak`.
- Read: `loadStats()` in `src/stats/persistence.ts:16-23` (merges onto
  `INITIAL_STATS` defensively).
- Write: Zustand subscriber in `src/game/state/appStore.ts` persists on
  every stats change.

### Update path

`submit()` in `src/game/state/store.ts` → `finalizeIfEnded()` → if ended and
`active.countsToStats === true` → `applyGameResult()` in
`src/stats/stats.ts:49-99` recomputes:

- `currentStreak = result === "win" ? prev + 1 : 0`
- `bestStreak = Math.max(prev.bestStreak, currentStreak)`

### Comparison direction

Correct: `Math.max(...)`, higher-is-better. Streaks monotonically track the
best-ever chain and reset to 0 on loss without shrinking `bestStreak`.

### UI wording

- `src/screens/StatsScreen.tsx` — dedicated **"Best"** cell showing
  `stats.bestStreak`.
- `src/screens/ResultScreen.tsx` — streak pulse "Streak N · new best"
  appended only when the new `newBest` store flag is `true` AND the streak
  is ≥ 3 (keeps the celebration meaningful at public-release volume).

### Edge cases verified (by new tests)

| Case                        | Expected                                           | Verified in                                       |
| --------------------------- | -------------------------------------------------- | ------------------------------------------------- |
| First completed run (win)   | `bestStreak = 1`, `newBest = true`                 | `store.test.ts` "first-ever win"                  |
| Streak below best           | `newBest = false`                                  | `store.test.ts` "strictly beating" (first 2 wins) |
| Tie with previous best      | `newBest = false` (not a record)                   | `store.test.ts` "tying the previous best"         |
| Strict improvement          | `newBest = true`                                   | `store.test.ts` "strictly beating" (3rd win)      |
| Loss                        | `newBest = false`, `bestStreak` unchanged          | `store.test.ts` "a loss never sets newBest"       |
| Fresh game after a new best | `newBest` reset to false                           | `store.test.ts` "newBest is reset"                |
| Daily replay                | `countsToStats=false`, no record change            | `store.test.ts` "daily replay cannot trigger"     |
| Abandon mid-run (no submit) | Stats untouched                                    | `store.test.ts` "abandoning mid-run"              |
| Reload with record          | `bestStreak` round-trips                           | `persistence.test.ts` "round-trips bestStreak"    |
| `clearAllLocalData`         | `bestStreak = 0`, foldwink keys wiped, others kept | `persistence.test.ts` "wipes bestStreak"          |

### Verdict

**Record system correct.** Tie-triggered false celebrations can no longer
happen. Record persists across reload, resets cleanly, is immune to
partial/abandoned runs and daily replays.

---

## 5. Changed files (this pass)

| File                                                       | Purpose                                                                                                                                           |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/game/state/store.ts`                                  | Added `newBest: boolean` to `StoreState`; set strictly on `bestStreak` improvement in `submit()`; reset in all `start*` actions and `goToMenu()`. |
| `src/screens/ResultScreen.tsx`                             | "new best" text now reads `store.newBest` instead of the faulty `currentStreak === bestStreak` check.                                             |
| `src/game/state/__tests__/store.test.ts`                   | +7 tests covering first win, strict improvement, tie, loss, reset-on-start, daily replay, abandon mid-run.                                        |
| `src/stats/__tests__/persistence.test.ts`                  | New file: 2 tests covering `clearAllLocalData` wipes `foldwink:*` only, and `bestStreak` round-trip through `saveStats`/`loadStats`.              |
| `docs/reports/foldwink-record-audit-2026-04-15.zip`        | Previous-pass deliverable — targeted record audit bundle with the above files.                                                                    |
| `reports/foldwink-final-itch-release-report-2026-04-15.md` | This report.                                                                                                                                      |

---

## 6. Verification / QA

### Automated

- **Unit / component tests:** `npx vitest run` — **119/119 pass**
  (12 files, 1.38 s). Includes 9 new tests listed in §4.
- **TypeScript:** `tsc --noEmit` — clean, no errors.
- **Production build:** `npm run build` (tsc + vite) — **succeeds in
  1.57 s**. Bundle 325 kB raw / 104 kB gzip.

### Manual spot-checks performed

- Inspected `dist/index.html` — favicon + manifest resolved to `./`
  relative paths (embed-safe).
- Confirmed no `console.log` in prod code paths (ESLint rule + grep).
- Confirmed no `TODO` / `FIXME` / `debugger` in `src/`.
- Confirmed no `window.parent` / fullscreen API coupling.

### Human QA pending (explicit, not done in this pass)

- Real itch.io upload + in-browser play through Chrome, Safari iOS,
  Firefox Android.
- Headphone listen through all 9 sound cues.
- Share-card screenshot on three real devices.
- Verify neural-void.com launcher link once live.

---

## 7. Remaining non-blockers

Real items, none blocking a first public test release:

- **Audio palette is synthesised, not auditioned.** Cues may feel thin on
  speakers. Not required for playability — game works muted.
- **Raster OG image missing.** `og:image` is `og.svg`; some social
  previewers won't render SVG. itch.io's own page cover image supersedes
  this on the itch product page.
- **Wordmark is placeholder text.** Foldwink has a BrandMark element but
  no designed wordmark. Readable but not distinctive.
- **Content pool at 200 puzzles.** Target for 1.0 is higher; product
  message should set expectations (current sustainable: ~7 months of
  daily).
- **No cross-device sync.** By design (no backend red line). Documented in
  `KNOWN_LIMITATIONS.md`.
- **OG `og:url` absolute to neural-void.com/foldwink.** When embedded on
  itch, social shares of the itch URL use itch's own cards, so this is
  only weak noise.

---

## 8. Final verdict

## READY FOR ITCH.IO TEST RELEASE

- Production build succeeds.
- 119/119 tests pass.
- Record logic correct end-to-end (§4).
- No code-side blockers for embed on itch.io (relative paths, no
  frame-coupled APIs, localStorage embed-safe).
- Remaining gaps are content/presentation, not functional.

---

## 9. Recommended next step

Limited to the next 3 moves:

1. **Upload `dist/` to an itch.io test project (draft, unlisted).** Play
   two full rounds on desktop Chrome and on an iOS Safari in the itch
   embed frame. Confirm: favicon, theme colour, daily selection, share
   button, streak celebration, `clearAllLocalData` round-trip.
2. **One-sitting human audio pass** through all 9 cues with `useSound`.
   Replace any cue that feels wrong; keep hook signature.
3. **Ship a raster 1200×630 PNG for `og:image`.** One file, one
   `index.html` edit. Improves external share previews without changing
   the product.

After step 1 signals green, flip the itch project to public.
