# Foldwink — Cross-Validated Architecture / Retention / Playability / Psychology Report

**Version under audit:** 0.6.5
**Date:** 2026-04-20
**Sources cross-validated:** G1 (Claude architecture), G2 (Claude retention), G2b (Claude psychology + playability), G3 (GPT / codex CLI structured audit), G4 (e2e test log).
**Red-line gate:** `CLAUDE.md` §143-156 overrides every suggestion below.
**This report:** synthesis-only. No source code was modified.

---

## Overview

Two independent auditors (Claude Opus 4.7 in three passes; GPT via codex CLI in one structured pass) reviewed Foldwink 0.6.5 against four axes — architecture, retention, playability, psychology. The verdicts **converge**: the pure engine and ethical posture are genuinely strong, the red lines hold cleanly, and the one meaningful architectural drift is the eagerly-bundled 1,506 tri-lingual puzzle JSONs (~1.63 MB single chunk). Both auditors independently flag the same UX gaps: a muted win moment, under-served first-time teaching of Tabs + Wink, loss-state deflation, and content-load weight as the only scale risk. GPT's structural pass emphasises architectural seams (store orchestration, persistence coupling); Claude's three passes emphasise specific file:line fixes and copy-tier work. Together they produce a 10-item priority list that is fully red-line-safe and shippable as sprint S1 before 0.7. Overall shipping posture: **healthy**.

---

## Cross-validation summary

### Architecture

| # | Finding | Claude (G1) | GPT (G3) | Severity | Red-line safe? |
|---|---|---|---|---|---|
| A1 | Eagerly-bundled tri-lingual puzzle pools → 1.63 MB single chunk | `loader.ts:3-6`, `loaderDe.ts:3-6`, `loaderRu.ts:3-6`; 1,506 JSONs / 7.8 MB raw | "bundle and startup surface — eager `import.meta.glob`, scales linearly with content+language" | **High** (Both) | Yes — `eager:false` + manualChunks is pure static build |
| A2 | `createStore` orchestrates puzzle selection + progression + finalize + flash + onboarding in one slice | `store.ts:334-415` (`submit` is 81 lines, three domains converge) | "monolithic store has become the de facto app controller" | Medium (Both) | Yes — pure refactor |
| A3 | Persistence observers inline in `appStore` subscribe | Not explicitly flagged, but §2 notes `appStore.ts:217-260` side-effect block | "storage policy coupled to every mutation; broader error surface" | Medium (GPT-only) | Yes |
| A4 | Language-specific `langGet*` wrappers duplicated | `appStore.ts:161-184` vs `MenuScreen.tsx:31-43` | "near-identical EN/DE/RU wrappers, accidental complexity" | Medium (Both) | Yes — one registry object |
| A5 | Dead / near-dead exports: `startStandard`, `selectDailyPlayedDate`, `poolSize`, `resetSoundForTests` | `store.ts:47,135-136,38,179`; `audio/sound.ts:374-386` | Not flagged | Low (Claude-only) | Yes |
| A6 | Storage failures silently swallowed; no degradation surface | Not flagged (noted as acceptable in G1 §7) | "`stats/persistence.ts`, `i18n/useLanguage.ts` swallow errors" | Low (GPT-only) | Yes — local banner only |
| A7 | Missing component tests; loader/i18n fallback untested | §8: loader-malformed, i18n getters, lang-switch subscribe all untested | "missing review surface: App, PuzzleGrid, OnboardingOverlay" | Low (Both, different angles) | Yes |
| A8 | Legacy `progress.cursor` fallback keeps running | `stats.ts:51-56`, `store.ts:378-383` — intentional backward compat | Not flagged | Low (Claude-only) | Yes — comment only |
| A9 | `Stats.hardWins` / `hardLosses` tracked but not displayed | `types/stats.ts:37-39`, `stats.ts:66-67,95-97` | Not flagged | Low (Claude-only) | Yes |

### Retention

| # | Finding | Claude (G2) | GPT (G3) | Severity | Red-line safe? |
|---|---|---|---|---|---|
| R1 | Streak is invisible on menu *before* today's play | `MenuScreen.tsx:94-118` — stats not surfaced pre-play; value hidden behind DailyCompleteCard | Not explicitly flagged | Medium (Claude-only) | Yes — "×N" chip, no loss-framing |
| R2 | FTUE dismissal doesn't auto-route to the daily | `Onboarding.tsx:113` + caller | "ensure first game cleanly explains 4-of-4, one-away, Tabs, Wink without menu exploration" | Medium (Both, different fix) | Yes |
| R3 | Loss copy variants absent — one trio only | `strings.ts:244-247,424-427,610-613` | "'Close one' + try-fresh is kind, not memorable or reconstructive" | Medium (Both) | Yes — seeded rotation, not random |
| R4 | Grade missing from share string | `share.ts:28-35` — time/mistakes only; no Flawless / No-Wink | "emphasise grade, wink usage, solved pattern as identity moment" | Medium (Both) | Yes |
| R5 | "Yesterday's daily" latent signal not surfaced on menu | `MenuScreen.tsx:105-109`; `loadDailyHistory()` exists but only read in Stats | Not flagged | Medium (Claude-only) | Yes — info card, no guilt |
| R6 | Trend feedback absent on Stats (no improving-over-time signal) | `StatsScreen.tsx:61-73` — raw counts only | "make result feel complete; clearer solved-group recap" | Low-Medium (Claude-only, adjacent in GPT) | Yes — local sparkline, no network |
| R7 | Readiness caption hidden until after game 1 | `MenuScreen.tsx:145` (`stats.gamesPlayed > 0` guard) | "first-run teaching must not rely on inference" | Medium (Both, G2b + G3) | Yes — transparency ≠ FOMO |
| R8 | Loss-state recap is visually flat | `ResultSummary.tsx:51-63` shows partial groups but without teaching emphasis | "show cleaner reveal/review of missed structure so players leave with insight" | Medium (Both) | Yes — insight, not extrinsic reward |

### Playability

| # | Finding | Claude (G2b) | GPT (G3) | Severity | Red-line safe? |
|---|---|---|---|---|---|
| P1 | Win moment has no on-board climax — screen swaps instantly | `store.ts:342-415` single-pass set of `active + screen:"result"` unmounts board before `solvedPop` plays | "wins land better than losses but session-end satisfaction needs deliberate result transition" | **High** (Both) | Yes — setTimeout in store, no library |
| P2 | Wink is two-tap arm + confirm — feels administrative for a positive gift | `FoldwinkTabs.tsx:33-43` (armedGroupId state + 3s timeout) | "make affordance more explicit with microcopy" | Medium (Both, different fixes — see note) | Yes |
| P3 | One-away signal is a whisper in 20px strip below grid | `GameScreen.tsx:208-216` | "only one-away gets explicit text; ordinary wrong guesses rely on a/v only" | Medium (Both) | Yes — CSS pulse only |
| P4 | Shuffle icon-only, no discoverability | `GameScreen.tsx:238-240` `⇄` with aria-label only | "clarify shuffle affordance, keep submit visually dominant" | Low (Both) | Yes |
| P5 | Locked Medium caption hidden before first play | `MenuScreen.tsx:145` guard on `gamesPlayed > 0` | "FTUE confidence uncertain without auditable overlay; first-run teaching must be unmissable" | Medium (Both) | Yes |
| P6 | Accessibility not-yet-finished — solved-state colour-dependent; screen-reader phrasing for tab reveals | Not flagged in G2b (noted as considered) | "explicit a11y pass on card semantics, focus order, SR phrasing, contrast" | Medium (GPT-only) | Yes |
| P7 | Onboarding preview mock mixes `✦ FLY` + `R··` without introducing `✦` glyph | `Onboarding.tsx:77-79` vs `strings.ts:352-354` (discontiguous) | "first game must not require inference for Wink / Tabs / one-away" | Medium (Both) | Yes |

### Psychology

| # | Finding | Claude (G2b) | GPT (G3) | Severity | Red-line safe? |
|---|---|---|---|---|---|
| S1 | Competence loop is solid but post-solve payoff is muted | §9.1: audio palette considered; §5.2: climax invisible | "strengthen post-solve info payoff and end-of-run recap, esp after losses" | Medium (Both) | Yes |
| S2 | Curiosity gap (Tabs) — cross-fade shows whole label, not letter landing | `FoldwinkTabs.tsx:101-108` (whole-tab remount) | "sharper tab copy, better reveal pacing, stronger visual anticipation" | Low-Medium (Both) | Yes — staggered keyframe only |
| S3 | Meaningful-choice (Wink) feels scarce-but-undramatic | §3.2: "paid affordance converts into a plain text swap" | "improve before/after messaging so registered as deliberate tradeoff" | Medium (Both) | Yes |
| S4 | Aesthetic pleasure — synth palette identified as standout | §9.1: `sound.ts:143-341` — rare artefact | "understated; add tactile polish moments" | Low (Both, framing differs) | Keep |
| S5 | Surprise/delight — caption variety missing on repeat grades | `grading.ts:47-102` single `caption` per tier | "delight moments need more flourish at reveal, win grading, sharing" | Low-Medium (Both) | Yes — seeded-by-puzzle, deterministic |
| S6 | Session-end — daily close is strong, standard loss is soft | §6: `DailyCountdown.tsx:5-22` is ritual anchor | "losses end a bit flat; clearer solved-group recap, stronger closure language" | Medium (Both) | Yes |
| S7 | Psychological safety — no FOMO, no variable-ratio, no guilt streak | §7 anti-pattern scan clean | "preserve this posture" | — (Both agree: keep) | — |

---

## Top 10 priority actions (for v0.7)

Sorted by (impact × cross-validation confidence) / effort. **"Both"** findings dominate the list; Claude-only / GPT-only items admitted only when the evidence is strong and the effort is low.

### 1. Hold the final board for 550–700 ms before navigating to ResultScreen

- **Source:** G2b §5.2 + §8.1 (Claude). G3 psychology §session-end-satisfaction + playability §loss-state-satisfaction (GPT).
- **Where in code:** `src/game/state/store.ts:342-415` (single-pass `set()` flips `active + screen:"result"`); `src/screens/ResultScreen.tsx:31-37` (`play("win")` currently on result mount).
- **What to do:** On a winning submit, split the state write: set `active` + `flash:"correct"` immediately, but schedule the `screen:"result"` flip ~600 ms later (via `deps.scheduleTransition(cb, ms)` injected into `StoreDeps`, testable). Move `play("win")` out of `ResultScreen` mount and into the scheduled callback so the cue lands on the fully-painted grid, not on the result panel. This is the single biggest playability win in the audit.
- **Effort:** M (~0.5–1 day, including test: store test that verifies the deferred `screen` transition fires with a fake scheduler).
- **Red-line check:** CSS/transform-only visual payoff uses existing `solvedPop` + `fw-tab-reveal` motion tokens — no library added. No FOMO, no scarcity, no variable reward.

### 2. Code-split puzzle pools per language (`loaderDe` + `loaderRu` → `eager:false`)

- **Source:** G1 §6 (Claude architecture, top action). G3 architecture §bundle-and-startup-surface (GPT).
- **Where in code:** `src/puzzles/loaderDe.ts:3-6`, `src/puzzles/loaderRu.ts:3-6`, `src/game/state/appStore.ts:266-275` (lang subscribe is the load trigger). Optional: `vite.config.ts:5-11` manualChunks for nicer names.
- **What to do:** Keep `loader.ts` (EN) eager as fallback. Switch DE + RU loaders to `{ eager: false }`, returning `Record<string, () => Promise<T>>`. Front-load a language's chunk when `useLangStore.lang` becomes `"de"` or `"ru"` — use `Promise.all` over the glob's `.json` entries, cache the resolved pool on module scope, and keep the store API unchanged for EN players. Expected: ~60% bundle reduction for EN users (majority). Add a tiny await at startup for non-EN language restore path.
- **Effort:** M (~0.5–1 day; non-EN startup path becomes async — deliberate refactor).
- **Red-line check:** Pure static-web build; no backend, no service worker, no CDN dependency. Passes CLAUDE.md §57-67 + §69-84.

### 3. Show readiness caption from game 1 (drop the `gamesPlayed > 0` guard)

- **Source:** G2b §1.2 + §8.3 (Claude). G3 playability §FTUE + retention §FTUE-clarity (GPT).
- **Where in code:** `src/screens/MenuScreen.tsx:145` (the `stats.gamesPlayed > 0` gate on the readiness caption under the Medium locked button).
- **What to do:** Remove the guard (or replace with a short zero-state line: "Medium unlocks at 5 easy wins"). `readiness.ts:146-147` already returns sensible copy when `stats.gamesPlayed === 0`. Transparency of mechanic is explicitly *anti*-dark-pattern and doesn't violate any red line.
- **Effort:** S (~15 min, plus a store/readiness test for zero-state copy if not already covered).
- **Red-line check:** Disclosure of existing rule, no new retention lever, no FOMO.

### 4. Auto-route first-time user to the daily after onboarding dismissal

- **Source:** G2 Win 2 (Claude retention). G3 retention §FTUE-clarity + playability §first-time-user-experience (GPT).
- **Where in code:** `src/components/Onboarding.tsx:113` (`onDismiss` caller, likely `App.tsx`).
- **What to do:** On first onboarding dismissal only (gate on `todayDailyRecord == null` AND `stats.gamesPlayed === 0`), call `startDaily()` instead of returning to the menu. Teaches the ritual from session 1. Do not hijack returning players who re-open onboarding.
- **Effort:** S (~30 min).
- **Red-line check:** One-time helpful nudge, not FOMO. The daily already respects unlock ladder (`store.ts:262-276`), so a new player won't be dropped into Medium.

### 5. Include grade + wink usage in the share string

- **Source:** G2 Win 4 (Claude retention). G3 retention §share-moments (GPT — "emphasise grade, wink usage, solved pattern as identity moment").
- **Where in code:** `src/game/engine/share.ts:28-35` (`buildShareString` context).
- **What to do:** Extend `ShareContext` to carry `grade: GradeResult`; compute via `gradeResult(puzzle, active, stats)` in `ResultScreen.tsx:52-58` (already available). Append a single line to the share text: `✦ Flawless` / `✦ No-Wink Medium` / `✦ Clutch`. Update all three language tables in `strings.ts`. Localisation note: DE/RU copies of grade labels must be added to `strings.ts` parallel blocks.
- **Effort:** S (~1 h incl. tests in `share.test.ts`).
- **Red-line check:** Local-only, no network, no leaderboard, no social comparison. Player's own grade on their own share.

### 6. Add 3–5 loss + win copy variants, seeded deterministically

- **Source:** G2 Win 3 + §6 copy review (Claude). G2b §8.5 (Claude). G3 retention §share-moments + psychology §surprise-and-delight (GPT).
- **Where in code:** `src/i18n/strings.ts:244-247` (EN), 424-427 (DE), 610-613 (RU); `src/screens/ResultScreen.tsx:121-131` picker; `src/game/engine/grading.ts:98` caption.
- **What to do:** Add arrays of 3–5 variants per outcome. Pick via `seedFromString(puzzle.id) % variants.length` (already-imported FNV-1a from `engine/shuffle.ts`) — same puzzle → same copy every replay, so not variable-ratio. Repeat players see fresh framing without randomness feeling fake. Fix the flat RU "Поделиться" → "Поделиться результатом" while touching this file.
- **Effort:** S (~2 h; pure i18n + tiny helper; extend `share.test.ts` or add `copy.test.ts`).
- **Red-line check:** Deterministic rotation = not variable-ratio (CLAUDE.md §67 + G2b §7 anti-pattern check). Not a reward schedule.

### 7. One-tap Wink + staggered letter reveal

- **Source:** G2b §3.2 + §8.2 (Claude — strong position). G3 psychology §meaningful-choice + playability §quit-and-interaction-safety (GPT — defends current two-tap discoverability).
- **Where in code:** `src/components/FoldwinkTabs.tsx:33-43` (armed state), `FoldwinkTabs.tsx:83-91` (reveal path); `src/styles/motion.ts` (new `fw-wink-reveal` token); `src/styles/index.css` (stagger keyframe with `--i` index).
- **What to do:** *Disagreement between sources* — Claude argues two-tap on a positive gift is over-engineered; GPT notes the two-tap protects against mobile mistaps and asks for microcopy. **Recommendation:** ship Claude's celebrate-the-reveal half (staggered letter fade-in via transform+opacity, no library) **as primary**, and keep the two-tap arm but add a transient hint ("Tap again to Wink") on first arm (addresses GPT's discoverability concern). This merges both sides without losing mistap protection.
- **Effort:** M (~1 day; pure CSS keyframe + one string key per language + one label swap on arm).
- **Red-line check:** Scarcity rule (once-per-puzzle) unchanged. No animation library. No new twist.

### 8. Consolidate language-aware pool selection into one helper

- **Source:** G1 §9.4 + action #2 (Claude). G3 architecture §language-specific-loader-duplication (GPT).
- **Where in code:** `src/game/state/appStore.ts:161-184` (`langGetPool/langGetEasyPool/langGetMediumPool/langGetHardPool`); `src/screens/MenuScreen.tsx:31-43, 57-58` (inline duplicate).
- **What to do:** Extract to `src/puzzles/byLang.ts` — a single language-registry object mapping lang → `{ pool, easy, medium, hard, getById, getByIndex }`. Consume from both call sites. Removes ~30 lines of duplicated fallback ladder. Also closes the subtle drift where the MenuScreen's size-by-lang uses the same rule but could silently diverge.
- **Effort:** S (~1–2 h).
- **Red-line check:** Pure refactor, behaviour-preserving. No new deps.

### 9. Let the one-away signal breathe (subtle visual weight)

- **Source:** G2b §4.2 + §8.4 (Claude). G3 playability §input-and-feedback-loop (GPT).
- **Where in code:** `src/screens/GameScreen.tsx:208-216` (20px strip under grid); `src/components/MistakesDots.tsx:22-27` (mistakes dot styling).
- **What to do:** Option A (recommended): on `flash === "one-away"`, briefly tint the just-consumed mistake dot amber (`#e0b25e`) for 900 ms before settling to red — binds "this cost a mistake but you were close" in the same visual field. Option B: widen the pill to full-width inside the grid frame. Skip the "underline the 3 correct cards" option (crosses into hints-too-strong territory, per G2b §8.4).
- **Effort:** S (~1–2 h CSS + one dot-state test).
- **Red-line check:** Learning signal amplified, no reward change. CSS-only.

### 10. Split persistence side-effects out of `appStore` subscribe

- **Source:** G3 architecture §persistence-coupling (GPT). G1 §2 notes the block but does not call for extraction.
- **Where in code:** `src/game/state/appStore.ts:217-260` (single subscribe doing `saveStats`, `saveProgress`, `saveDailyHistory`, `saveActiveSession`, `clearActiveSession`).
- **What to do:** Split into two focused observers in a new `src/game/state/persistence/` (or similar): `statsPersistenceObserver(store)` (narrow selector over stats/progress/daily) and `sessionPersistenceObserver(store)` (narrow selector over active-session). Each returns an unsubscribe. `appStore` wires both at boot. Enables unit testing of persistence policy without spinning the whole store.
- **Effort:** M (~0.5 day; includes adding a targeted test per observer + the i18n-fallback tests G1 §8 flagged).
- **Red-line check:** Refactor only; no new deps, no network.

---

## v0.7 deferred backlog

Lower-priority or single-source items worth queueing, not blocking 0.7:

- **Hard stats display cell** — `StatsScreen.tsx` has no Hard win/loss breakdown; `types/stats.ts:37-39` already tracks it. Revisit once Hard pool expands past 34. (G1 §9.7)
- **`startStandard` + `selectDailyPlayedDate` + `poolSize` cleanup** — drop the dead exports from `store.ts:47,135-136,38,179`. (G1 §9.1-9.3, Claude-only, ~30 min)
- **`resetSoundForTests` disposition** — either use from a test or drop (`audio/sound.ts:374-386`). (G1 §9.6)
- **`progress.cursor` legacy deprecation comment** — add a dated TODO at `stats.ts:52-56`, `store.ts:378-383`. (G1 action #5)
- **Trend sparkline on Stats** — 7-day solve dots under `StatsScreen.tsx:61-73`, pure SVG no library. (G2 hook 14)
- **One-frame tab letter-landing stagger** — the tab cross-fade currently replaces the whole label; a letter-level cascade on the `tabReveal` beat. Adjacent to action #7 but separable. (G2b §3.1)
- **Grade caption flavour variants** — deterministic rotation per `puzzle.id` for the grade subcaption (separate from action #6 loss/win copy). (G2b §8.5)
- **"Yesterday's daily" info card on menu** — `MenuScreen.tsx:105-109` when `todayDailyRecord == null` and `loadDailyHistory()` has a prior. (G2 Win 5)
- **Streak chip on menu pre-play** — `MenuScreen.tsx:94-118` when `stats.currentStreak >= 2` AND `todayDailyRecord == null`, renders `×N` only (no loss-framing). (G2 Win 1)
- **Storage-degradation diagnostic banner** — tiny warning when a `safeWrite` actually hits a quota error; no analytics, local-only. (G3 architecture §error-handling-consistency)
- **Accessibility pass (SR phrasing for tab reveals, colour-contrast-independence for solved groups, focus-order)** — before 1.0. (G3 playability §accessibility)
- **Targeted tests** — i18n-fallback for `langGetPuzzleById`, lang-switch reset in `appStore.ts:266-275`, loader malformed-JSON rejection. (G1 §8)
- **RU copy polish** — `strings.ts:611` "Даже лучшие иногда промахиваются" (softer), `strings.ts:613` "следующий уже не подловит" (lighter than "закономерность"), `strings.ts:658` "Поделиться результатом" (restore noun). (G2 §6)
- **Shuffle-button label hint** — `GameScreen.tsx:238-240`, discoverability. (G2b §1.3, G3 playability §mobile-ergonomics)
- **Store-orchestration split (session reducer / progression service / UI store)** — GPT's larger refactor. Explicitly *deferred*: the current shape is readable at 81 lines per action (G1 §2 verdict). Revisit if store mutation count doubles. (G3 architecture §store-orchestration)

---

## Rejected (red-line violations)

Items from the four source reports that would cross CLAUDE.md red lines — not all four sources proposed these; most were listed by G2 §4 as *considered and rejected* precisely to document what not to add. Recorded here for audit completeness:

- **Streak-saver / freeze token** — rejected (G2 §4, CLAUDE.md §67). Login-streak-saver explicitly forbidden.
- **Push notifications for daily reset** — rejected (G2 §4, CLAUDE.md §155 "no network analytics without privacy surface"). Silent-ritual posture.
- **Puzzle-of-the-week timed bonus** — rejected (G2 §4, CLAUDE.md §67 FOMO-adjacent).
- **Leaderboards / global daily ranking** — rejected (G2 §4, CLAUDE.md §59 + §149).
- **Achievements / badge wall** — *deferred*, not outright rejected. TODO.md:54 already queues "grade-based micro-achievements (local only)" for 1.1. OK if strictly local; not 0.7 scope.
- **Rewarded video for extra Wink** — rejected (G2 §4, CLAUDE.md §62 ads).
- **Paid hint pack** — rejected (G2 §4, CLAUDE.md §63 premium).
- **Second twist mechanic** — rejected (G2 §4, CLAUDE.md §46-48).
- **"Challenge-a-friend" link that compares results** — rejected (G2 §4, CLAUDE.md §149 backend).
- **Adaptive difficulty that re-orders puzzles secretly** — rejected (G2 §4 — daily determinism contract).
- **"Lives regenerate over time" mechanic** — rejected (G2 §4, CLAUDE.md §67 casino-adjacent).

No source report *actively proposed* any of the above as a v0.7 action. G2 pre-emptively enumerated them; G3 respected the red lines explicitly (its psychology §psychological-safety reads "preserve this posture"). Clean sheet.

---

## E2E regressions

Three failing tests in `logs/overnight/g4-e2e-stdout.log`. All three are low severity — two are a shared timing/selector issue, one is a copy drift.

### E1. `gameplay-smoke` — "onboarding has a Master Challenge mention" (copy drift, confirmed)

- **Log:** "ENDER U Foldwink How to play R·· ✦ FLY B·· S·· … Easy — 16 cards, 4 groups, no tabs. Medium — tabs reveal letters as you solve. One free ✦ Wink. **Master** — slower reveals, no Wink. Got it" — onboarding says "Master" not "Master Challenge".
- **Root cause:** Copy intentionally changed. G2 §6 flagged "Master Challenge" as "gym-intro, corporate" and recommended "Foldwink Master" or just "Master". The change shipped (`strings.ts:220` uses "Master") while the test assertion `assert onboarding contains 'Master Challenge'` is stale.
- **Fix:** Update the assertion in `tests/e2e/gameplay-smoke.mjs` to look for `'Master'` (and, if desired, also check for the "slower reveals, no Wink" body). Keep the product copy as-is. **Do not revert the copy.** This is pure test maintenance.
- **Effort:** S (~10 min).

### E2 + E3. Two timeouts on the exit-to-menu selector

- **Logs:**
  - `progression-validator` — "opening cards then quitting does not advance any cursor" — `page.waitForSelector("button:has-text('Play today'), button:has-text('Replay daily'), button:has-text('Easy puzzle')")` 10000 ms timeout.
  - `gameplay-smoke` — "quit to menu returns to menu cleanly" — same selector, same 10000 ms timeout.
- **Root cause (likely):** Two hypotheses, in order of likelihood:
  1. **Quit flow is a two-tap arm-and-confirm** (`GameScreen.tsx:68-77`) — the test probably simulates a single click on "Quit to menu" expecting immediate return. First click arms ("Tap again to quit" for 3 s); the menu never appears; selector times out. Both failing tests exercise the quit path (test 1 opens cards then quits; test 2 literally "quit to menu").
  2. The localised menu buttons in all three languages might not exactly match any of `'Play today' / 'Replay daily' / 'Easy puzzle'` — e.g., if the test's preceding language toggle left `lang === 'de'` or `'ru'`, the button text is localised and none of the EN strings match. Unlikely given the other tests pass on the same harness, but worth verifying.
- **Fix:** Update `tests/e2e/lib/*` (or the two test files directly) to execute quit via two clicks with a short pause between them, or bypass via the `goToMenu` keyboard binding if one exists in `GameScreen.tsx`'s keyboard-binding `useEffect`. Also, widen the menu-back selector to a stable `data-testid` (e.g., `data-testid="menu-primary"`) rather than substring-matching localised labels — this is the kind of selector that will keep drifting as copy evolves.
- **Effort:** S (~1 h including adding a `data-testid` attribute in `MenuScreen.tsx` and updating both failing tests).
- **Red-line check:** Test-harness change only, no product impact.

---

## What's already strong

Aggregated strengths cited across all four sources. These are **do-not-touch** items — they make Foldwink Foldwink.

1. **Pure game engine + disciplined store seam.** Every module in `src/game/engine/` is side-effect-free (G1 §2), the store derives via pure engine helpers (G1 §2), 108/108 vitest suites pass (G1 §8), and type safety is strict with zero `any` (G1 §4). GPT independently flagged the engine as "lightweight and well-suited to a static web puzzle" (G3 playability §performance).

2. **Ethical posture holds across every red line.** G1 §10 walked the CLAUDE.md §143-156 list; every line is respected. G3 psychology §psychological-safety independently confirms: no FOMO, no variable-ratio, no guilt streaks, no backend, no premium pressure. G2b §7 anti-pattern check scored 0/6 dark-pattern hits.

3. **Unlock ladder in `readiness.ts`.** G2 explicitly calls this "the single best retention lever in the codebase". Conservative thresholds, medium *always visible* (never hidden), gentle fallback copy after 2 medium losses (`readiness.ts:163-165`), transparent mechanics. G3 retention §mastery-progression concurs: "thoughtful, non-punitive".

4. **Daily-ritual engine.** Deterministic FNV-1a date hash (`puzzles/daily.ts:4-10`), respects the unlock ladder (`store.ts:252-288`), replays don't count to stats (G2b §7), live countdown (`DailyCountdown.tsx:9-21`) frames return as a calendrical ritual not a scarcity bomb. G3 retention §daily-ritual: "solid … the next step is presentation polish, not stronger pressure."

5. **Cross-language discipline.** Language switch drops an in-flight game rather than bleeding chrome/content (`appStore.ts:266-275`); RU/DE translations idiomatic not calque; RU pluralization handled (`strings.ts:670, 685`); daily-hash is language-agnostic so the same puzzle surfaces in every language the same day (G2 §7.3).

6. **Audio palette is genuinely considered.** G2b §9.1 highlights this as "a rare artefact" — `sound.ts:143-341` has explicit material language (paper/wood/bone/tile), explicit anti-goal ("nothing in this palette should sound like a bright mobile-casino chime"), peak-≤-0.30 headroom, and the `correct` cue is three ascending wood-on-bone taps — an *ascent that reads as settling*, not dopamine spray. Sound never gates gameplay (CLAUDE.md §154 respected).

7. **No-Wink Medium badge.** G2b §9.2 — perfectly scoped mastery hook. Win medium without spending Wink → bonus caption. Never unlocks content, never pops a modal, never compares to other players. Stacks with Flawless ("Flawless · No Wink"). Ethical mastery architecture at its clearest.

8. **Session closure is ritual, not cliffhanger.** G2b §9.3 — `DailyCompleteCard` + `DailyCountdown` show "Next daily in 13:42:07" as an answer to the question the player is about to ask, not as a scarcity weapon. Compare to the dark-pattern "Don't lose your streak! Play in the next 13:42:07." — Foldwink doesn't frame it that way.

9. **Mid-game resume done right.** G1 §3 + G2 §7.5 + G3 playability §performance. In-progress game survives refresh/close; finalised games cannot resume (protects stats integrity); language-mismatched resume is cleared (`appStore.ts:87-100`); resume honours the current language's pool.

10. **Quit-to-menu two-tap arm.** G2b §9.4 — standard destructive-action pattern, 3-second grace window (`GameScreen.tsx:68-77`). Long enough to feel like grace, short enough to disarm naturally. (This is the same pattern that's causing the two e2e timeouts — strong UX, test-harness lag.)

11. **Error surface covered.** `ErrorBoundary` wraps the app (`main.tsx:12-14`); `safeRead`/`safeWrite` in `utils/storage.ts:1-17`; every `start*` action guards on `!puzzle`; every `foldwink:*` localStorage key is namespaced so a single scan can wipe owned state (G1 §7).

---

*End of cross-validated report. Generated 2026-04-20. No source files were modified. One file produced:
`reports/architecture/ARCH_RETENTION_REPORT.md`.*
