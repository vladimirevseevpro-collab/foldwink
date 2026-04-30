# Foldwink — Phase G2b: Psychology & Playability Audit

**Version under audit:** v0.6.5 (post-ramp release)
**Auditor:** Claude Opus 4.7 (1M ctx)
**Scope:** As-played behaviour, not as-documented. All hook proposals respect `CLAUDE.md` red lines (no FOMO, no guilt streaks, no variable-ratio rewards, no leaderboards, no dark patterns).

---

## Executive summary

Foldwink plays clean, quiet and psychologically honest. Its three strongest hooks are already firing: a tight competence loop (grid → select → lock → tab letters grow), a literal curiosity gap baked into the tabs, and a restrained tactile palette (wood/paper/bone synths at `src/audio/sound.ts:219-341`, motion tokens at `src/styles/motion.ts:12-44`). The biggest playability gaps are all "last-mile": (a) the **win moment is under-celebrated** — the 4th correct group fires the same `tabReveal` cue and then the screen replaces with a result panel, there is no dedicated board-clear beat (`src/screens/GameScreen.tsx:93-111`, `store.ts:342-415`); (b) the **Wink confirm flow** costs a precious affordance to a subtle "tap to confirm" inline state instead of a deliberate, scarce gesture (`src/components/FoldwinkTabs.tsx:33-43`, `83-91`); (c) **one-away copy** is present but has no accompanying emotional cushioning beyond a 1.4s amber flash (`GameScreen.tsx:89, 213-215`). Five concrete ethical wins below, biggest-ROI first. Overall shipping posture: healthy.

---

## 1. Playability pass — first-time walkthrough

I imagine a fresh player, no localStorage, desktop or mobile portrait.

### 1.1 Landing & onboarding

- `src/app/App.tsx:11-12,35` — on first load `onboarded=false` from persistence and the `<Onboarding/>` modal mounts over the menu. Modal is full-focus-trapped (`Onboarding.tsx:16-49`), escape-dismissable, language-toggle-present at top.
- **Friction:** the preview mock-grid (`Onboarding.tsx:73-86`) shows `R··`, `✦ FLY`, `B··`, `S··` — but "FLY" as a fully-revealed example is not labelled as a *winked* tab and the `✦` marker is not introduced anywhere else in the dialog. A newcomer sees an asterisk-star without a concept to attach it to. **Cite:** `Onboarding.tsx:77-79` vs the body copy `strings.ts:352-354` ("One free" + "✦ Wink") which appears further down and is discontiguous from the visual.
- The bullet about Wink is interrupted by a sentence break: `strings.ts:352-354` reads "— tabs reveal letters as you solve. One free ✦ Wink." That trailing fragment lands as incomplete prose. A first-time reader has to parse two pieces of grammar in one bullet.
- The dialog closes and the menu is underneath. No residual pointer to "How to play" until the player scrolls down to find the footer link (`MenuScreen.tsx:178-184`). That's fine for retention, but a post-dismiss first-game coachmark over the Foldwink-Tabs row would reduce the "what are these?" moment on the first medium.

### 1.2 Menu decision

- `MenuScreen.tsx:94-166`. New player sees five buttons top-to-bottom: *Play today's puzzle* (primary), *Easy puzzle* (secondary), *Medium puzzle — locked* (secondary/disabled), *Master Challenge — locked* (only if content; otherwise hidden), *Stats*.
- The **locked Medium** button (`MenuScreen.tsx:122-129`) with `disabled` is correct for affordance but the player gets zero information about *why*. The "Warming up · Medium unlocks at 5 easy wins (0/5)" caption (`readiness.ts:146-147`, `MenuScreen.tsx:145-157`) only appears once `stats.gamesPlayed > 0` — so a fresh player sees a locked button with no explanation until after their first game. **Cite:** `MenuScreen.tsx:145` — the gating condition hides the readiness caption before the first play. That's a small discoverability miss.
- Daily is primary. Good choice — it teaches the ritual shape.

### 1.3 Playing a daily (easy)

- `GameScreen.tsx:164-272`. Layout reads top-down: header (title + difficulty subtitle + timer + mistakes dots) → tab row (suppressed for easy via `buildFoldwinkTabs` returning `[]` at `foldwinkTabs.ts:105`) → 4×4 grid → selection counter + Submit → tiny "Quit to menu" underline.
- **Selection:** tap card, `handleToggle` plays `"select"` cue, `aria-pressed` flips, card lifts via `MOTION_CLASS.selectedLift`. Fourth-tap — Submit gets a ring/glow (`GameScreen.tsx:252-254`). Good visual cue.
- **Submit correct:** flash ring ringflash solved-green (`GameScreen.tsx:154-161`), `correct` cue fires (`sound.ts:262-282`), `solvedPop` applied to the four cards via `Card.tsx:27`, the solved tint replaces idle, and the solved group gets locked out via `disabled={isSolved}` (`GameScreen.tsx:202`). Feedback lag is minimal (clearFlash at 450ms).
- **Submit incorrect (one-away):** `GameScreen.tsx:85-91` plays the `wrong` cue + haptic, grid shakes (keyed by `mistakesUsed:flash`, `GameScreen.tsx:162, 189-190`), and the 1.4s amber "✦ One away" pill appears in the status row (`GameScreen.tsx:213-215`). Decent. But the "one-away" text lives in a 20px-tall strip below the grid; on mobile portrait this is easy to miss if the player's thumb was hovering over the submit button. **Cite:** `GameScreen.tsx:208-216` — the aria-live region is correctly `role="status"` but the visual hierarchy treats this consolation as a whisper.
- **Shuffle button** (`GameScreen.tsx:238-240`) is a `⇄` ghost icon with only `aria-label`. No tooltip. Experienced players will find it; a first-time player may not realise it exists. Low priority.
- **Quit:** two-tap arm-and-confirm (`GameScreen.tsx:68-77`). Good — prevents accidental exits. Small touch: the armed state reads "Tap again to quit" in `danger` colour but there's no keyboard shortcut and no audio cue differentiating the two taps.

### 1.4 Win

- `store.ts:342-415` — the fourth correct `submit()` creates `flash = "correct"`, immediately finalises the game, and in a single `set()` call flips to `screen: "result"`. The GameScreen effectively unmounts before the correct-flash animation completes. **Cite:** `store.ts:351, 404-414`.
- Result screen arrives with `fw-result-pop` (320ms `translateY/scale`, `motion.ts:20, index.css:92-105`) and immediately plays `win` cue (`ResultScreen.tsx:31-37`).
- **Friction:** the "board cleared" moment is invisible. The player never sees the final fourth group locked in on the grid itself — the board unmounts. There is no `setTimeout` holding the GameScreen for a beat to let the `solvedPop` on the last row play out visually. This is the single largest playability gap in the audit.

### 1.5 Loss

- 4th mistake → same flow, `screen: "result"`, `loss` cue fires (`sound.ts:331-340` — low wooden thud, very restrained).
- Result shows "Close one · Every good solver misses a puzzle. A new daily lands tomorrow." (`ResultScreen.tsx:121-131`, `strings.ts:243-247`). Copy is gentle and non-guilting. No "you blew your streak" messaging. Good.
- The solved groups (partial) *are* shown in `ResultSummary.tsx:51-63` so the player sees which categories they got. This is satisfying closure, not a guilt wall.

### 1.6 Share

- `ShareButton` triggers `renderShareCard` + `navigator.share`. Fallbacks: copy-image, download, text-share (`ShareButton.tsx:24-60` visible). Standard. No friction noted in the code path.

### 1.7 Retry / next

- Standard-mode CTA stack: **Next puzzle** (primary), optional **Try a Medium puzzle** (secondary, gated on `mediumReadiness(stats).unlocked` + easy win, `ResultScreen.tsx:149-160`), **Stats**, **Back to menu**. Clean session-end stack.
- Daily has no "next" — instead `DailyCountdown` (`ResultScreen.tsx:133-137`) plus share. Correct, minimal.

---

## 2. Psychological hook inventory

| # | Hook | Strength | Implementation cite | Next step (red-line-safe) |
|---|---|---|---|---|
| 1 | Competence loop (skill + progress feel) | **good** | `foldwinkTabs.ts:52-57` (monotonic reveal); `grading.ts:47-102` (post-hoc grade ladder); `StatsScreen.tsx:61-73` (depth strip) | Hold a 400–600ms "board cleared" beat before navigating to result so the competence peak is felt, not only scored. |
| 2 | Curiosity gap (Foldwink Tabs) | **strong** | `FoldwinkTabs.tsx:71-132`; `foldwinkTabs.ts:48-76` | Consider a one-frame letter-reveal animation per tab on solve (stagger 40ms), not just the 220ms `fw-tab-reveal` whole-tab fade — amplifies the "letter landed" micro-beat. |
| 3 | Aesthetic pleasure | **strong** | `motion.ts` (transform-only, 120–420ms range); `sound.ts:143-160` (tight headroom); `Card.tsx:22-32` (selected lift) | Nothing required. Do not add sparkles/glows. |
| 4 | Surprise & delight | **partial** | One-away pill (`GameScreen.tsx:213-215`); No-Wink grade badge (`grading.ts:69-89`); new-best inline accent (`ResultScreen.tsx:106-117`) | Add a single "flavoured" grade caption per base tier rotating across ~3 strings so repeat winners don't see the exact same "0 mistakes" line every run. Stays deterministic per puzzle if seeded by `puzzle.id`. |
| 5 | Meaningful choice (Wink once-per-puzzle) | **partial** | `foldwinkTabs.ts:100-140`; `FoldwinkTabs.tsx:33-43` two-tap arm | Wink feels administrative more than dramatic — see §3. |
| 6 | Flow (difficulty curve) | **good** (post v0.6.5 ramp) | `appStore.ts` ramped getters (`getEasyRampedByIndex` etc.); `readiness.ts:35-43` thresholds | Keep. Consider a "gentle restart" — after `FALLBACK_LOSS_STREAK` a one-time nudge copy change (non-guilt, already implemented at `readiness.ts:218-221`). |
| 7 | Session-end satisfaction | **good** | Result screen stack + `DailyCountdown.tsx:5-22` (closure, not cliffhanger) | See §6. |
| 8 | Mastery over time | **good** | Ramped pools; `Depth` stat block (`StatsScreen.tsx:61-73`) — Flawless / Avg miss / Med W% / Winks | Nothing required. The `Depth` strip is a *mastery mirror*, not a ladder — correct stance. |
| 9 | Self-efficacy (stats improve) | **partial** | Stats page shows raw counts; no delta / no "improvement tick" | Render a small `▲ 3 this week` micro-tick next to `Flawless` / `Med W%` (local, no network, computed from `recentSolves`). Avoid percentages-vs-peers. |
| 10 | Identity (minimalist paper/card) | **strong** | Whole codebase consistent: wordmark, synth palette, 2-column tab grid, no glow bursts | Keep. |

---

## 3. Foldwink Tabs + Wink analysis

### 3.1 Tabs — is the curiosity gap actually felt?

**Yes, moderately.** The mechanism is pure and stateless (`foldwinkTabs.ts:100-124`), and because reveal is deterministic (`revealStage` one-letter-per-solve on medium; `revealStageHard` half-speed on hard), the player builds a mental model within 1–2 puzzles: "solve one group → one more letter on every remaining tab."

Where it's underplayed:

- The reveal animation is tab-level (`MOTION_CLASS.tabReveal` on each tab, `FoldwinkTabs.tsx:101-108`). What reveals is a whole label replacement, not a single new letter arriving. The player sees `R··` become `RI·` in one cross-fade. The curiosity-gap *promise* is "I am owed exactly one letter next time" — showing the letter *land* would reinforce this. Currently every tab fades together via `key={${tab.groupId}:${stageKey}}` which remounts on every stage change.
- The audio cue on tab-level reveal is `tabReveal` (`sound.ts:283-286`): a single very-quiet paper flip. It fires only once per solve — not four times for four tabs (`GameScreen.tsx:99-105` guards with `active.solvedGroupIds.length > prevSolvedCount.current`). That is correct restraint. The gap between *amount of visual change* (four tabs update) and *audio beat* (one tiny flip) is already healthy. No change needed.

### 3.2 Wink — does it feel meaningful?

**Partial.** The scarcity model is correct in code (`canWinkGroup` at `foldwinkTabs.ts:130-140` enforces medium-only + once-per-game) and in strings (`winkShort`, `winkReady`, `winkUsed`, `winkConfirm`). But the *moment* is muted:

- The activation UX is a two-tap arm-then-confirm (`FoldwinkTabs.tsx:33-43`). First tap puts the tab in `isArmed` style (`border-2 border-accent`, 3s timeout). Second tap on the same tab commits the wink and calls `onWink`.
- **Psychology read:** the two-tap pattern *is* meaningful-choice architecture (it's the same pattern as the quit button, `GameScreen.tsx:68-77`). But a wink is a *positive* choice, and reusing the "arm → confirm" pattern typically reserved for destructive actions can feel defensive. The player has to press twice to *receive a gift*. That cognitive tax diminishes delight.
- **Celebration of the reveal:** on commit, `store.ts` sets `winkedGroupId`, `GameScreen.tsx:106-110` fires the `wink` audio + haptic. That's the only ceremony. The tab simply changes from `x··` style to the full word in accent style (`FoldwinkTabs.tsx:83-84`). No small motion emphasis, no letter-by-letter cascade, no even-brief highlight ring. The "paid" affordance converts into a plain text swap.

**Where the reveal happens in code:** `FoldwinkTabs.tsx` line 83-84 (style switch) + the parent effect `GameScreen.tsx:106-110` (sound + haptic only).

**Recommended next step (red-line-safe):**

1. Make Wink **one tap** with a distinct visual (e.g., a small `✦ wink` floating-action badge sitting outside the tab grid, or an inline "tap any tab" affordance that converts first-tap-on-unsolved-tab into the wink directly once `winkReady`). Two-tap confirmation for a free, capped, *positive* choice is over-engineered.
2. Celebrate the reveal: stage the accent-coloured letters with a 40-60ms stagger using only transform+opacity keyframes (fits the motion token model, no library required).

---

## 4. Mistake economy

### 4.1 What each mistake feels like

Per `GameScreen.tsx:79-91`:

- `wrong` cue — soft wood knock-knock, 120/95 Hz bodies (`sound.ts:241-259`), peaks ≤ 0.22.
- `haptic("wrong")` fires (see `useHaptics`).
- Grid shakes 420ms (`motion.ts:21`, `index.css:123-147`) keyed on mistake count so it always re-fires on repeats.
- Mistakes dot turns red (`MistakesDots.tsx:22-27`).
- 450ms ring flash, then clears.

The **progression tension** is correctly built — dot shift + shake + dull audio combined read as a considered "no" rather than a failure buzz. Good.

### 4.2 One-away — satisfying or condescending?

- Detection is pure (`submit.ts:35-47`): incorrect selection where exactly 3 of 4 match one group.
- Trigger: `flash = "one-away"` (`store.ts:347`), which extends the flash window to 1.4s (`GameScreen.tsx:89`), uses an amber/golden ring colour `#e0b25e` (`GameScreen.tsx:160`), and surfaces a small aria-live pill "✦ One away" (`GameScreen.tsx:213-215`).
- Copy reads: **"One away"** (en), **"Eins daneben"** (de), **"Одна мимо"** (ru) — `strings.ts:209, 389, 575`.

Verdict: **neutral-to-encouraging, not condescending.** "One away" is factual ("you had 3 of 4") — it teaches the player to re-examine their fourth pick rather than their whole selection. It does not say "almost!" with an exclamation, which would patronise. Nothing to change in copy.

The only weakness: it lives in a 20px strip *below* the grid (`GameScreen.tsx:208-216`). Given the signal is the single most useful mistake-recovery hint the game provides, it deserves slightly more visual weight — e.g., a subtle glow on the grid (already present: amber ring) + a slightly larger pill or a brief pulse on the mistakes dot to bind the "this cost a mistake but you were close" logic.

### 4.3 Loss copy (out of mistakes)

- `ResultScreen.tsx:121-131` + `strings.ts:243-247`:
  - "Close one" · "Every good solver misses a puzzle. A new daily lands tomorrow." / "Try a fresh one — the pattern won't catch you twice."
- Gentle, no shame, forward-looking. The German ("Knapp daneben"/"Jedem guten Spieler entgeht mal ein Rätsel") and Russian ("Почти!"/"Даже опытные игроки иногда ошибаются") translations preserve the empathy. Zero guilt pattern. **Good.**

---

## 5. Win moment

### 5.1 What fires in what order (code trace)

1. Player submits the 4th correct group. `submit()` runs (`store.ts:334-415`).
2. `applyCorrectGroup` appends the last id → `solvedGroupIds.length === 4`.
3. `finalizeIfEnded` detects win, sets `active.result = "win"` + `endedAt`.
4. `set()` call at line 404-414 writes in one pass: `active`, `stats`, `progress`, `summary`, **`screen: "result"`**, `flash: "correct"`.
5. React re-renders → GameScreen unmounts, ResultScreen mounts.
6. ResultScreen `useEffect` (`ResultScreen.tsx:31-37`) fires `play("win")` + `haptic("win")` once.
7. `ResultSummary` renders with `fw-result-pop` 320ms arrival animation (`motion.ts:20`, `index.css:92-105`).

### 5.2 Is there a climax?

**No, not on the board.** The winning move's visual payoff (the 4th group locking in with its colour + `solvedPop`) is cancelled by the immediate navigation. The player's brain registers: "I picked four, I pressed submit, I am on a new screen." The satisfying "board fully painted" image is never held.

Partial compensation: the `win` audio cue (`sound.ts:309-329`) is a 4-step tile-settle sequence over ~340ms that starts *on result screen mount*. That sequence is well-composed (four descending tile knocks, low-mid range, no chime). But it plays against a static result panel rather than against the final board.

**Cite:** `store.ts:342-415` (single-pass state write forces immediate screen swap); `GameScreen.tsx:113-122` (no "endedAt → hold" branch — if `active.result` is set, the grid is just disabled via `disabled={!!active.result}` on each Card at line 202, but the screen doesn't linger because the store already pushed `screen: "result"`).

**Recommended next step (biggest single win):** a short hold. Two options, I recommend option A.

- **Option A (recommended):** in `store.submit`, on a winning submit, don't flip `screen` immediately. Set `flash: "correct"` + `active` (already done) and schedule the `screen: "result"` flip 550–700ms later via a pure `setTimeout` in the store deps. Let the `solvedPop` play on the final four cards and let the player see the fully-painted grid. The `win` cue can fire at the end of that hold (moved out of the ResultScreen mount effect into the scheduled transition).
- **Option B:** an in-grid "board cleared" overlay that fades in over the complete grid before navigation. Heavier in code (new component), same behavioural outcome.

This is the single highest-impact ethical change in this audit.

---

## 6. Session closure

### 6.1 Final image the player leaves with

- **Daily solve, then quit:** last view is `ResultScreen` → "Stats" or "Back to menu". If they return to the menu: `DailyCompleteCard` (`DailyCompleteCard.tsx:11-35`) shows "✦ Daily · solved" + time + mistakes + current streak count + countdown to next daily. **Closure shape: strong.** The countdown sets a *ritual expectation* ("same time tomorrow") without creating scarcity pressure — the daily is not a resource they can lose, it's a habit they can maintain.
- **Daily miss, then quit:** same card but with "missed" and no streak value rendered when `currentStreak ≤ 0` (`DailyCompleteCard.tsx:22-26` gates on `currentStreak > 0`). No negative reinforcement. No "streak broken" modal. **Excellent.**
- **Standard-mode session end:** player usually hits "Next puzzle" → loops; when they eventually bounce to the menu, they see the same readiness/stats captions and an unused Daily at the top of the button stack. Non-guilting.

### 6.2 Does it invite return without guilt?

**Yes.** Multiple signals support this:

- No streak-protection FOMO modal anywhere. A missed daily is just `missed` in the grid.
- The `DailyArchive` component (`StatsScreen.tsx:75-80`) reportedly shows a history grid — this is a personal record, not a social ladder.
- Copy on loss doesn't push urgency: "A new daily lands tomorrow." (`strings.ts:246`) is calendrical, not scarcity-framed.

No change required. This is a design win.

---

## 7. Anti-patterns check

Scan of forbidden patterns per the brief:

| Pattern | Present? | Evidence |
|---|---|---|
| FOMO / artificial scarcity | **No** | Daily puzzle replays don't count to stats (`mode.replay` badge at `GameScreen.tsx:172`) but they are permitted. Miss does not punish. Countdown is informative, not a timer-bomb. |
| Variable-ratio rewards | **No** | Grade ladder is deterministic per result (`grading.ts:47-102`). No loot, no randomised bonus, no weighted outcomes. `reshuffleActive` uses `Math.random` but it's cosmetic card-order, not game outcome (`store.ts:320-331`). |
| Guilt streaks / punch-card shame | **No** | Streak is shown (`StatsScreen.tsx:57`) but a broken streak is a number going to 0, with no "you lost your streak" modal, no recovery purchase, no fail-save. |
| Dark patterns (hidden/misleading UI) | **No** | Disabled buttons use `disabled` + `aria-disabled` (`MenuScreen.tsx:125-126, 134-135`). Quit uses two-tap confirm (not a trick — the confirm text is explicit). Reset-all armed state is explicit (`strings.ts:343`). |
| Social comparison pressure | **No** | No leaderboard. Share card outputs *your own* time/mistakes only — `shareTextSolvedLine` + footer `neural-void.com/foldwink` (`strings.ts:297-299`). |
| Attention capture (notifications, pull-refresh abuse) | **No** | No `Notification` API usage, no service worker push, no network beacons beyond optional local event log (see `AboutFooter` privacy copy `strings.ts:336-338`). |

**Verdict: clean.**

---

## 8. Top 5 ethical appeal wins for v0.7

Ranked by impact-per-effort. All changes stay within the current mechanic surface.

### 8.1 Hold the final board for 550–700 ms before navigating to ResultScreen (high impact, low effort)

- **Why:** The single biggest playability gap. Player's competence peak is currently invisible.
- **Where:** `src/game/state/store.ts:342-415`. Split the winning submit into two effects: (1) set `active` + `flash: "correct"` immediately; (2) schedule the `screen: "result"` flip via `deps.scheduleTransition` (new dep injected). Move `play("win")` from `ResultScreen.tsx:31-37` into the scheduled callback for tight audio-visual sync.
- **Ethical posture:** pure affordance enhancement. No new retention lever.

### 8.2 One-tap Wink + stagger the letter reveal (high impact, low-medium effort)

- **Why:** Wink is the one *active* player decision the game's name earns. It currently feels administrative.
- **Where:** `src/components/FoldwinkTabs.tsx:33-43` (remove `armedGroupId` intermediate state, commit on first click while `winkReady`); add a `fw-wink-reveal` keyframe in `src/styles/index.css` that staggers letter opacity by `--i` index; motion token entry in `src/styles/motion.ts`.
- **Ethical posture:** clearer meaningful-choice architecture. Scarcity rule (once-per-puzzle) unchanged.

### 8.3 Show readiness caption from game #1, not #2 (medium impact, trivial effort)

- **Why:** First-time player sees a locked Medium button with no explanation of the unlock condition, which invites a "this feels gated" impression. The caption already exists — it's just hidden until `stats.gamesPlayed > 0`.
- **Where:** `src/screens/MenuScreen.tsx:145`. Drop the `stats.gamesPlayed > 0` guard on the readiness caption (or replace with a permanent locked copy). `readiness.ts:146-147` already returns sensible copy for zero-state.
- **Ethical posture:** transparency of mechanics — *anti* dark-pattern.

### 8.4 Let the one-away signal breathe (medium impact, low effort)

- **Why:** The single most useful recovery hint is a whisper under the grid.
- **Where:** `src/screens/GameScreen.tsx:208-216`. Options: (a) also pulse the mistakes dot that was just consumed with the amber tint before settling to red; (b) widen the pill to show full-width inside the grid frame for 1.4s; (c) add a soft underline-fade under the selected cards that were in the correct group (revealing which 3 of 4 the player got right — slightly more teaching, might cross into "hints too strong" territory — probably skip).
- **Ethical posture:** learning signal amplified, no reward schedule change.

### 8.5 Seeded flavour captions on grade tiers (low-medium impact, low effort)

- **Why:** Repeat winners currently see "Flawless · 0 mistakes" verbatim every clean solve. Small surprise-&-delight lift without variable-ratio rewards because the rotation is seeded deterministically per `puzzle.id`.
- **Where:** `src/game/engine/grading.ts:47-102` — replace single `caption` with a small array per base tier, deterministic pick via `hashPuzzleId(puzzle.id) % captions.length`. Keep labels ("Flawless", "Clean solve") unchanged — only the small caption varies.
- **Ethical posture:** not variable-ratio (fixed by puzzle id, same puzzle → same caption every replay). No extrinsic reward.

---

## 9. What's already strong

Highlighting at least three specific, cited things that delight:

### 9.1 The audio palette is genuinely considered

`src/audio/sound.ts:143-341` is a rare artefact — a synth-generated cue bank with an explicit material language (paper / wood / bone / tile) and an explicit anti-goal ("nothing in this palette should sound like a bright mobile-casino chime", `sound.ts:146-149`). Cues peak ≤ 0.30, sit in 80–280 Hz bodies, and the `correct` recipe is three ascending wood-on-bone taps (`sound.ts:262-282`) — an ascent that reads as settling, not dopamine spray. This identity choice holds the paper/card theme together more than any visual token.

### 9.2 No-Wink Medium badge is a *perfectly* scoped mastery hook

`src/game/engine/grading.ts:54-89`. The game's one clean "play-harder-for-bragging-rights" signal lives here: win a medium without spending your free Wink, get a bonus caption. Never unlocks content, never adds a leaderboard, never pops a modal. It's visible only on that run's result card. The tier even stacks correctly with Flawless ("Flawless · No Wink") rather than picking one. This is ethical mastery architecture at its clearest.

### 9.3 Session closure — countdown, not cliffhanger

`src/components/DailyCountdown.tsx:5-22` + `DailyCompleteCard.tsx:30-32`. After a daily — solved or missed — the player sees *"Next daily in 13:42:07"*. This is a ritual anchor, not an urgency weapon. Compare against the dark-pattern version that would be found in weaker games: "Don't lose your streak! Play in the next 13:42:07." Foldwink does not frame it that way. It simply answers the question the player is about to ask.

### 9.4 (Bonus) The quit-to-menu two-tap arm

`GameScreen.tsx:68-77`. Standard destructive-action pattern, correctly applied. The second-tap window is 3 seconds (`GameScreen.tsx:72`) — long enough to feel like a grace window, short enough to disarm if the player wanders. Ethical micro-detail.

---

## Open risks and notes for the G3 merge

- **Readiness signal timing is the one discoverability gap I would want cross-validated with G3.** If G3 (GPT) also flags the hidden caption on first play, this is a confirmed bug-in-UX-flow, not a subjective read.
- **Win-moment hold is a behavioural change that touches game state timing.** If G3 proposes a different fix shape (e.g., an overlay rather than a delay), merge toward the less invasive of the two — my recommendation is the `setTimeout`-in-store approach because it keeps the result screen stateless.
- **The `armedGroupId` pattern on Wink is genuinely defensible** on the theory that the Wink is precious and the player should be protected from a miss-tap. If G3 defends two-tap, leave it — my suggestion there is preference-weight, not a bug. In either case, the *reveal celebration* upgrade (staggered letter fade-in on commit) stands.

---

*End of G2b report. No source files were modified. Report is ~430 lines excluding this marker.*
