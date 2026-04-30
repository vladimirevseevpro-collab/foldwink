# Foldwink Retention Audit — G2 (Claude pass)

Version under audit: **0.6.5** (per `package.json:4`).
Scope: retention and engagement hooks only. Source-read only, no edits.
Product rules: `CLAUDE.md` — red lines override every suggestion below.

---

## 1. Executive summary (≤150 words)

Foldwink is already a *quiet-ritual* daily game with real craft under the
hood: deterministic daily hashing that respects the unlock ladder, a
difficulty-ramped standard cursor, a share-string that's Connections-flavoured
but Foldwink-badged, grade captions that reward skill without punishing
losses, and trilingual chrome that doesn't leak across languages. The biggest
retention gaps are not mechanical — they're **moment-of-return signals**: the
current streak only appears *after* the player has played today, the menu
doesn't tell a returning winner "you built a 4-day streak", the
daily-archive is buried inside Stats with no "missed yesterday" surface, and
the post-loss copy is generic. Every fix below respects the red lines (no
FOMO, no guilt, no streak-saver, no backend, no second twist). The game
would come back tomorrow for a player who already cared; it needs two small
nudges to earn the player who almost cared.

---

## 2. Retention posture summary

Foldwink **is** a game someone would come back to tomorrow — *if* they
finished today's daily feeling the ritual. The deterministic daily
(`src/puzzles/daily.ts:4-10`), the live countdown to next midnight
(`src/components/DailyCountdown.tsx:9-21`), and the daily-done card
(`src/components/DailyCompleteCard.tsx:11-34`) together deliver a clean
"come back tomorrow" signal without guilt. The streak is tracked and reset
cleanly (`src/stats/stats.ts:57`), progression unlocks are unambitious and
fair (`src/game/engine/readiness.ts:108-179`), and losses are framed
gracefully (`src/i18n/strings.ts:244-247` — "Every good solver misses a
puzzle"). What's missing is **latent-signal surfacing**: the player who
abandons mid-way through the FTUE, or the player who missed yesterday's
daily, has nothing pulling them back. The core loop is solid; the re-entry
loop is under-served.

---

## 3. Hooks inventory

| # | Hook | Status | Evidence | Concrete next step (red-line safe) |
|---|------|--------|----------|-----------------------------------|
| 1 | **Daily ritual** | **strong** | `src/puzzles/daily.ts:4-10` (FNV-1a deterministic); `src/game/state/store.ts:252-288` respects unlock ladder; `src/components/DailyCountdown.tsx:9-21` live countdown | Ship a tiny "yesterday's daily" peek inside the menu daily card when `todayDailyRecord === null` and history has prior entries — non-guilty informational, no streak-saver. Lives in `src/screens/MenuScreen.tsx:107-109`. |
| 2 | **Within-run progression (Tabs + Wink)** | **strong** | Spec followed in `src/game/engine/foldwinkTabs.ts` (wink gating via `canWinkGroup`); store wires it at `src/game/state/store.ts:461-466`; grading honours No-Wink at `src/game/engine/grading.ts:54-89` | No change. Identity mechanic is intact. |
| 3 | **Session closure ("one more?")** | **partial** | Result screen CTAs `src/screens/ResultScreen.tsx:143-167` — Next puzzle, Try Medium (easy-win path), Stats, Back. Daily has no next-puzzle CTA (intentional). | Add a single "Next Easy" CTA on **daily-complete** result (standard fallback) — labelled plainly ("Try another"), not guilting. Touch `src/screens/ResultScreen.tsx:143` to remove the `!isDaily` gate for a secondary button only. |
| 4 | **Aesthetic delight** | **good** | Motion tokens centralised at `src/styles/motion.ts:12-45`; sound/haptics on result `src/screens/ResultScreen.tsx:31-38`; `prefers-reduced-motion` discipline noted in tokens header | Nothing urgent. Consider a tiny "tabs reveal the final letter" celebratory sub-pulse on final solve — existing `fw-tab-reveal` token is the hook. |
| 5 | **Share moment** | **good** | `src/game/engine/share.ts:6-47` emits mode-aware header with puzzle index; image-first share in `src/components/ShareButton.tsx:89-139` with graceful clipboard/download fallback | Consider including the **grade** ("Flawless", "No-Wink Medium") inside the share string — it's the clearest skill signal Foldwink mints. Would edit `src/game/engine/share.ts:28-35`. |
| 6 | **Mastery ramp (easy→hard within tier)** | **strong** | `src/game/state/store.ts:195, 217, 235` uses `*RampedByIndex` getters shipped in 0.6.5; daily mode keeps id-sorted pools for determinism (comment at `src/game/state/store.ts:81-90`) | No change. |
| 7 | **FTUE (first-time)** | **partial** | `src/components/Onboarding.tsx:11-119` — accessible, focus-trapped, tab-preview illustration, language toggle inside; wired via `loadOnboarded()`. But: no post-onboarding "do the daily first?" nudge; first puzzle is whatever cursor points at. | Have onboarding auto-route to the daily on first dismissal when `todayDailyRecord == null` — builds the ritual from session 1. `src/components/Onboarding.tsx:113` `onDismiss` caller wires this. |
| 8 | **Failure feedback** | **good** | "One away" is computed (`src/game/engine/submit.ts` via `isOneAway`) and surfaced as amber text `src/screens/GameScreen.tsx:213-214`; loss copy dignified `src/i18n/strings.ts:244-247`; no streak-loss shame | Consider subtle amber pulse on the *next* Submit after a one-away miss to cue "you were close, re-check" — CSS-only, no new library. |
| 9 | **Streak — current/best** | **partial** | Tracked `src/stats/stats.ts:57`, `src/game/types/stats.ts:23-24`. Shown on result (`src/components/ResultSummary.tsx:44-47`), on stats screen (`src/screens/StatsScreen.tsx:57-58`), and on daily-done menu card (`src/components/DailyCompleteCard.tsx:22-26`). **But** — not shown on the menu *before* playing today. A player who opens the app on a streak of 4 never sees "4" until they play. | Show `×N` next to the Daily button label or wordmark subtitle when `currentStreak >= 2` and `todayDailyRecord == null`. `src/screens/MenuScreen.tsx:94-97`. Do **not** add "don't lose your streak" framing — just show the number, no guilt. |
| 10 | **Difficulty unlocking** | **strong** | Transparent thresholds `src/game/engine/readiness.ts:35-43`; medium always visible, never hidden; "Warming up → Almost there → Medium unlocked → Recommended → Medium-ready" ladder at `src/game/engine/readiness.ts:136-161`; gentle fallback after 2 medium losses (line 163-165) | No change. Model is the best retention lever in the codebase. |
| 11 | **Result variety** | **absent** | `src/i18n/strings.ts:244-247` — exactly one win-loss copy pair ("Close one" / "Every good solver misses a puzzle"). No variety across repeat plays. | Add 3-5 loss copy variants, cycled deterministically by `summary.mistakesUsed + solvedGroupIds.length` so repeat losers see novelty without randomness feeling fake. Same for win ("Cleared"). Edit at `src/i18n/strings.ts:244-247` + small helper in `src/screens/ResultScreen.tsx:121-131`. |
| 12 | **Cross-language polish (RU/DE)** | **good** | Full parity in `src/i18n/strings.ts:362-730`; language switch drops mid-flight game to prevent chrome/content bleed (`src/game/state/appStore.ts:266-275`); RU pluralization handled (line 670, 685) | No change. This is the quietest strong part of the codebase. |
| 13 | **Ambient "world" feel** | **good** | Single wordmark `src/screens/MenuScreen.tsx:96`; tactile paper/card motion language in `src/styles/motion.ts` comments; consistent `✦` accent across `strings.ts:198, 229, 243, 378, 409, 564`; sound hook discipline enforced in CLAUDE.md:115 | Nothing urgent. Identity is coherent. |
| 14 | **Win-rate feedback** | **partial** | Stats screen delivers Played/Wins/Losses/Streak/Best + Flawless/AvgMiss/MedW%/Winks `src/screens/StatsScreen.tsx:38-72`; daily-archive rows `src/components/DailyArchive.tsx:29-50`. **But** — no visible *trend* (improving avg-mistakes, faster solves). Effort is tracked, progress is not visualised. | Add a one-line sparkline — last 7 solves dots on the stats strip — using pure Unicode/SVG, no library. Lives alongside `src/screens/StatsScreen.tsx:61-73`. |
| 15 | **Session-length control (<3 min target)** | **good** | `src/game/engine/readiness.ts:40` `STRONG_MEDIAN_TIME_MS = 180_000` — 3 min is baked in as the "medium-ready" signal; subtitle claims "2–5 minutes" `src/i18n/strings.ts:184` | No change. Design honours the promise. |

---

## 4. Red-line guardrails — ideas considered and rejected

The following retention patterns are **intentionally not proposed** because
they would cross `CLAUDE.md:143-156` hard red lines or `CLAUDE.md:57-67`
non-goals:

- **Streak-saver / "freeze token"** — rejected. CLAUDE.md:67 explicitly
  forbids login-streak-saver. Even a "one free freeze per week" skin falls
  inside the forbidden guilt-driven daily punch-card pattern.
- **"Puzzle of the week" limited-window bonus content** — rejected.
  FOMO-adjacent per CLAUDE.md:67. A non-timed weekly curation page would be
  OK, but that's content scaling, not retention.
- **Push notifications / browser-notification API for daily reset** —
  rejected. CLAUDE.md constraints on quietness + "no network
  analytics" + deferred-past-1.0 list imply no push-permission prompt.
  Silent ritual is the design.
- **Achievements feed / badge wall** — deferred, not rejected. TODO.md:54
  ("Grade-based micro-achievements (local only)") already queues this for
  1.1. Listing existing Flawless/No-Wink grades in a local-only achievements
  pane would be fine post-1.0; not worth the complexity for v0.7.
- **"Challenge a friend" link with a custom puzzle id** — rejected-ish.
  Sharing today's puzzle id is fine (share string already hints at this),
  but any *asymmetric* challenge that compares results would require a
  backend or a query-param state leak; CLAUDE.md:149 forbids backend,
  param-leak feels brittle.
- **Leaderboards / global daily ranking** — rejected. CLAUDE.md:149.
- **Rewarded video for extra Wink** — rejected. CLAUDE.md:62, 150.
- **Paid hint pack** — rejected. CLAUDE.md:63, 150.
- **Second twist mechanic (e.g. a "shuffle one group" power)** — rejected.
  CLAUDE.md:46-48, 148.
- **Adaptive difficulty that secretly re-orders puzzles** — rejected. Daily
  determinism contract (`src/puzzles/daily.ts` comment discipline) would
  break. Mastery ramp inside the standard cursor is already shipped and is
  the right ceiling.
- **"Lives regenerate over time" mechanic** — rejected. Casino-adjacent,
  CLAUDE.md:67. Foldwink's 4-mistake budget is a design choice, not a
  resource to be monetised or softened by time.

---

## 5. Top 5 concrete retention wins for v0.7

Prioritised by **impact / effort**. Every win respects red lines.

### Win 1 — Surface the streak on the menu before play
**Impact:** high. **Effort:** low (≤30 lines).
The single biggest latent-signal gap: a player returning on day 4 of a win
streak has no reason to notice it until *after* they play today. Show
`×N` next to Play button or subtitle when `stats.currentStreak >= 2` AND
`todayDailyRecord == null`. Guilt-free — it's a fact, not a threat.
**Files:** `src/screens/MenuScreen.tsx:94-118` (add chip/badge);
`src/i18n/strings.ts` — add `menu.streakChip(n)` key in all three langs.

### Win 2 — Auto-route first-time user to the daily
**Impact:** high. **Effort:** low (≤15 lines).
Onboarding dismissal currently leaves the user on the menu. FTUE players
almost always tap the top button; making that button *the daily* teaches
the ritual from session 1. Gate on `todayDailyRecord == null` so returning
users who re-open onboarding aren't hijacked.
**Files:** `src/components/Onboarding.tsx:113` and its caller (likely
`src/App.tsx` / whichever renders the overlay).

### Win 3 — Loss and win copy variants (3-5 each)
**Impact:** medium. **Effort:** low (pure i18n edit, no logic).
Currently exactly one win-loss line repeats forever. A returning player on
their 20th loss has already read "Every good solver misses a puzzle" 20
times. Add 3-5 variants, deterministic cycle by result signature (not
random) so the variety feels authored, not random.
**Files:** `src/i18n/strings.ts:244-247` (EN), matching lines in DE/RU
(line 424-427, 610-613); `src/screens/ResultScreen.tsx:121-131` picker.

### Win 4 — Include grade inside share string
**Impact:** medium. **Effort:** low (1 edit).
The share text today shows time/mistakes but not the grade —
**Flawless** / **No-Wink Medium** / **Clutch** are the only skill flexes
Foldwink mints, and they're absent from what the player copies. Social
proof free-win.
**Files:** `src/game/engine/share.ts:28-35` (inline grade from
`gradeResult`); requires passing `puzzle` + `active` into `ShareContext`
— already available at `src/screens/ResultScreen.tsx:52-58`.

### Win 5 — "Yesterday's daily" peek on menu when applicable
**Impact:** medium. **Effort:** medium (≤60 lines, new tiny component).
When `todayDailyRecord == null` and `loadDailyHistory()` contains at least
one record from within the last 7 days, show a one-line informational
card: "Yesterday — solved in 2:40" or "Yesterday — missed". No guilt, no
catch-up prompt, just a receipt of ritual. Strengthens "I'm a Foldwink
person" identity without punishing absence. Could also replace the
menu's empty-state between "signed-up" and "played today".
**Files:** `src/screens/MenuScreen.tsx:105-109`; read from
`src/stats/persistence.ts:39-45` `loadDailyHistory`.

**Out-of-top-5 but worth queueing:** trend sparkline on Stats (Hook 14),
one-away pulse next-submit (Hook 8).

---

## 6. Copy / string review — weak or too-generic strings

Specific i18n strings that flatten the texture of the game:

- **`src/i18n/strings.ts:244-247`** (EN):
  `closeOne: "Close one"` / `missedMsg: "Every good solver misses a puzzle."` /
  `tryFresh: "Try a fresh one — the pattern won't catch you twice."`
  → The trio is fine once; it's the *only* loss trio. Needs 3-5 variants
  for returning players. Same pattern in DE `strings.ts:424-427` and RU
  `strings.ts:610-613`.

- **`src/i18n/strings.ts:240`** (EN) `noResult: "No result."` —
  dead-end copy. This screen is only ever reached in an error state, but
  the copy makes it look like the player did nothing. Proposal:
  "Result missing — return to menu to start fresh." DE/RU mirrors at 420,
  606 share the flatness.

- **`src/i18n/strings.ts:286`** (EN) `noHistoryYet: "No daily history yet.
  Solve today's puzzle to start."` — this is fine; but when combined with
  the missing pre-play streak surface (Win 1), it's the only empty-state
  guidance in the whole stats flow. Add a second line: "Your streaks and
  solves will appear here after your first daily."

- **`src/i18n/strings.ts:220`** (EN) `hard: "Master"` — the readiness
  label strings use "Master Challenge" (line 313), which reads vaguely
  corporate. The word *Foldwink* is mellow; *Master Challenge* is
  gym-intro. Consider "Foldwink Master" or just "Master" (no "Challenge")
  — also tightens share text downstream.

- **`src/i18n/strings.ts:347-359`** (EN onboarding) — strong, but the
  line `ruleMediumBody: "— tabs reveal letters as you solve. One free"`
  reads awkwardly because the `✦ Wink` glyph lives on its own as
  `wink: "✦ Wink"`. Sentence is grammatically "One free Wink." but the
  hyphen-dash flow breaks rhythm. Small but jarring on first read.

- **`src/i18n/strings.ts:456`** (DE) `medWinRate: "Mittel S%"` — the
  abbreviation `S%` is opaque in German ("Siege-Prozent"?). EN parallel
  at line 275 is `"Med W%"` — equally cryptic. Both should spell out or
  drop the label in favour of a tooltip on hover.

- **`src/i18n/strings.ts:611`** (RU) `missedMsg: "Даже опытные игроки
  иногда ошибаются."` — grammatically clean but tonally stiffer than the
  EN "Every good solver misses a puzzle." Consider "Даже лучшие
  иногда промахиваются." to match the EN dignity.

- **`src/i18n/strings.ts:658`** (RU) `shareResult: "Поделиться"` — the
  EN/DE variants say "Share result" / "Ergebnis teilen" — naming the
  object. Russian lost that noun. "Поделиться результатом" would match.

- **`src/i18n/strings.ts:613`** (RU) `tryFresh: "Попробуй следующий —
  закономерность тебя не поймает дважды."` — "закономерность" is a heavy
  Russian noun for what's a playful English idiom. Consider "следующий
  уже не подловит" or similar.

- **`src/game/engine/grading.ts:98`** — `caption: "2 mistakes"` for the
  "Steady solve" grade reads as a mild insult when in fact the player
  *won*. Consider "solid, 2 misses" or just "2 misses".

- **Share-string footer** `src/i18n/strings.ts:299`, 481, 665:
  `"neural-void.com/foldwink"` — raw URL in share text is functional but
  not warm. The game is called Foldwink; the share could carry its own
  identity ("foldwink · neural-void.com/foldwink" or just the handle).

---

## 7. What's already strong — do not touch

1. **Unlock ladder in `src/game/engine/readiness.ts:1-337`** — the comment
   header (lines 5-33) articulates the design philosophy clearly, the
   thresholds are conservative, medium is *always visible* (never hidden,
   only framed), the fallback after 2 medium losses is gentle
   (line 163-165). This is the single best retention lever in the
   codebase and it respects every red line.

2. **Share-string grid `src/game/engine/share.ts:37-42`** — Connections-
   flavoured 4×4 emoji grid, mode-aware header, puzzle index for standard
   mode, deterministic day label for daily. The image-first share pipeline
   at `src/components/ShareButton.tsx:89-139` degrades gracefully through
   native share → clipboard-image → download → clipboard-text, honouring
   `AbortError` correctly (line 16-22). Zero deps, per CLAUDE.md:84.

3. **Cross-language discipline** — `src/game/state/appStore.ts:266-275`
   drops an in-flight game on language switch rather than bleeding
   old-language content into new-language chrome. This is the kind of
   quiet correctness players never notice until it's absent. RU/DE
   translations are idiomatic (not calque), pluralization is handled
   (`strings.ts:670, 685`), and the daily ritual feels the same in every
   language because the underlying hash is language-agnostic.

4. **Graceful loss framing** — `src/screens/ResultScreen.tsx:121-131`
   + `src/i18n/strings.ts:244-247` — "Close one" / "Every good solver
   misses a puzzle" / "A new daily lands tomorrow" is the exact opposite
   of guilt-driven. The loss state resets streak (`stats.ts:57`) without
   UI theatrics. This is red-line-safe retention done right.

5. **Mid-game resume** — `src/game/state/appStore.ts:75-102` — an
   in-progress game survives refresh/close, but a *finalised* game
   cannot resume (would violate stats integrity). Small feature, large
   ritual-preservation impact: the player who alt-tabs mid-daily doesn't
   lose their puzzle.

6. **Daily-unlock fairness** — `src/game/state/store.ts:262-276` — the
   daily puzzle is drawn only from tiers the player has unlocked, so a
   brand-new player never gets dropped into a Medium puzzle with Foldwink
   Tabs before onboarding explained them. Correctness-by-design.

---

## Appendix — files not edited

This report creates only `reports/architecture/g2_claude_retention.md`.
No source under `src/`, `puzzles/`, `public/`, or `docs/` was modified.
