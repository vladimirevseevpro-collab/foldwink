# Foldwink Sprint R4 - Retention Audit

**Date:** 2026-07-22  
**Stage:** Pre-implementation audit  
**Scope:** Daily ritual, return intent, local-only retention surfaces, and the smallest coherent R4 slice.

## Current State Audit

### What already exists

- Daily access already has a meaningful product slot. `src/screens/MenuScreen.tsx` gives the daily puzzle top priority and swaps to `Replay daily` once `todayDailyRecord` exists.
- The product already has a calm next-return cue. `DailyCompleteCard.tsx` and `ResultScreen.tsx` both render `DailyCountdown`, which counts down to the next local midnight.
- Daily completion is stored locally and replay-safe. `src/game/state/store.ts` writes a single `todayDailyRecord` for the current date and sets `countsToStats=false` when the same day is replayed, so the daily cannot inflate wins, streak, or best-streak.
- Daily history already persists independently of lifetime stats. `src/game/state/persistence/statsObserver.ts` appends `todayDailyRecord` into `foldwink:daily`; `src/components/DailyArchive.tsx` reads that store and renders the latest 30 dated rows.
- Personal progress already exists in the generic stats model. `Stats` tracks `currentStreak`, `bestStreak`, `solvedPuzzleIds`, `totalMistakes`, `flawlessWins`, `winkUses`, difficulty-specific win/loss counters, and a rolling `recentSolves` window of 10 attempts.
- The result flow already supports personal-positive feedback without network comparison. `ResultScreen.tsx` shows grade, deterministic affirmation copy, and a `newBest` callout when `bestStreak` is strictly beaten.
- Share is already local-first and resilient. `ShareButton.tsx` attempts native file share, then clipboard image, then download, then text share/copy; `shareCard.ts` is dependency-free and stays inside the Night Print Studio look.
- Existing E2E already protects key retention-adjacent behavior: daily replay does not count to stats, result-screen navigation remains reachable across repeated rounds, onboarding does not mutate records, and share degradation does not white-screen the app.

### What is missing

- There is no explicit seven-day ritual surface. The app stores daily history, but the UI exposes only a 30-row archive list inside Stats, not a glanceable recent week.
- There is no daily-specific meaning layer beyond countdown. After a daily solve, the player sees time, mistakes, streak, grade, and share, but not “how today fits my recent pattern.”
- There is no “next daily moment” framing on the menu beyond the countdown card. The message is functional, not ritualized.
- Stats are mostly lifetime totals. They are useful, but they do not answer the more motivating daily questions: “How have my last few days gone?” and “What was notable about today?”
- `DailyArchive.tsx` is static after mount because it memoizes `loadDailyHistory()` with an empty dependency array. In current routing this is usually acceptable because Stats is a separate screen render, but it is still a brittle surface for future live refresh behavior.
- The data model does not distinguish daily attempts from standard attempts inside `Stats.recentSolves`, so post-result “personal pattern” insights cannot safely derive recent-daily trends from the current stats blob alone.

### Architectural read

The current implementation is sound for local persistence and anti-dark-pattern behavior. R4 does not need new infrastructure. It needs one calm layer that turns existing local records into a visible return ritual.

## Market Signals

- Adjust’s 2026 gaming report says acquisition costs are rising and retention is now a core focus, with studios adding depth to drive long-term value and loyalty.[1]
- Adjust’s 2026 mobile trends page reports a 19% YoY increase in casual-game installs and a 15% increase in session length, and explicitly recommends daily streaks and difficulty tuning to reduce churn.[2]
- Foldwink should reject the streak-pressure part of that playbook. Its product constraints ban FOMO, missed-day punishment, and manipulative continuity loops. The useful takeaway is not “push streaks harder”; it is “make return value legible.”
- LinkedIn frames daily thinking games as short, few-minute rituals released on a daily cadence rather than prize-driven events.[3]
- Netflix Puzzled shows that daily puzzles, sharing, and progress can work without an account, with progress saved on-device or in-browser depending on context.[4]
- Puzzmo’s public product notes are the closest fit to Foldwink’s ethos: it moved streaks off the homepage, added easier archive access, and reworked completion so personal history and personal records matter more than global comparison.[5][6]

### Product implication

Foldwink should not chase retention with pressure. It should chase retention with orientation:

- a visible recent history strip
- a gentle “come back tomorrow” anchor
- one or two post-completion insights derived from the player’s own local history

That is enough for R4.

## Recommended R4 Experience

### Must-ship

#### 1. Calm seven-day Daily Fold

Add a compact seven-day daily-history strip as the new primary retention object.

- Show the last 7 local dates including today when available.
- Use tiny resolved states only: win, loss, or no record.
- Keep it non-judgmental. Missing a day must read as absence, not failure.
- Surface it in two places only:
  - Menu, directly under `DailyCompleteCard` or under the main daily CTA area
  - Stats, above or instead of the current long archive list

Why this fits the code:

- `foldwink:daily` already stores date-keyed daily outcomes.
- No backend, notification, or new gameplay rule is required.
- It increases return intent by making the daily cadence visible without converting it into a streak penalty system.

#### 2. Post-completion personal highlight

Add one small local-only highlight block on the daily result screen.

Recommended priority order:

1. Personal-best daily time for the current difficulty or for daily mode overall
2. Fewest mistakes on a daily win
3. “3 of last 5 dailies solved” or similar recent pattern summary

The block should show at most one primary insight plus one quiet secondary line. Example direction:

- `Best daily time`
- `3 solved in your last 5 dailies`

Why this fits the code:

- `todayDailyRecord` already carries `durationMs` and `mistakesUsed`.
- `foldwink:daily` already contains historical daily records.
- This is consistent with the existing `newBest` language, but makes it daily-specific instead of only streak-specific.

#### 3. Clear next-daily moment

Keep the existing countdown, but make the R4 framing more explicit:

- menu card: “Today is logged” + seven-day strip + next daily countdown
- result card: keep countdown, but pair it with the personal highlight so the end state feels complete rather than merely delayed

This should stay calm, factual, and local. No “don’t miss tomorrow” copy.

### Nice if it fits

- Replace the 30-row archive’s default collapsed view with the 7-day strip plus an optional “View full archive” expansion on Stats.
- Reuse `StatStrip` styling language for the personal highlight block, but avoid turning it into another dense metric wall.

### Later ideas, not R4

- Monthly calendar or heatmap
- Difficulty-specific daily history filters
- Sharable “last 7 days” card variant
- Recovery language, streak freezes, missed-day forgiveness, reminder surfaces, or notification prompts
- Social comparison, leaderboard rank, or network analytics-driven personalization

## Data Model and Migration

### Current data support

Already available:

- `foldwink:daily` stores `{ date, puzzleId, result, mistakesUsed, durationMs }` per local date.
- `Stats` stores aggregate lifetime counters and `recentSolves` for the latest 10 completed attempts.

### Smallest safe R4 data path

Recommended approach: keep `foldwink:daily` as the source of truth for all daily-history UI and daily-specific insights.

This means:

- no required migration for the initial seven-day strip
- no required migration for “best daily time” or “fewest daily mistakes”
- no need to infer daily attempts from `recentSolves`

### Optional additive extension

If R4 wants more nuanced daily insights later, extend `DailyRecord` rather than overloading `Stats`:

- optional `difficulty?: "easy" | "medium" | "hard"`
- optional `winkUsed?: boolean`

Migration policy:

- additive only
- no version gate required
- old records remain valid
- missing fields are treated as unknown, not false

### Explicit recommendation

Do not add a second retention ledger. Reuse `foldwink:daily`. The app already has the right persistence boundary; it lacks presentation, not storage.

## Exact Implementation Surface

### Primary UI files

- `src/screens/MenuScreen.tsx`
  - Add the calm seven-day strip near the daily CTA / completion card.
  - Keep daily first in visual priority.
- `src/screens/ResultScreen.tsx`
  - Add one daily-only personal-highlight block below the grade / close-call surface and above share.
  - Keep countdown.
- `src/screens/StatsScreen.tsx`
  - Promote recent daily history from a long log into a clearer recent-week-first structure.

### Daily-history components

- `src/components/DailyArchive.tsx`
  - Split responsibilities:
    - compact seven-day strip for R4 must-ship
    - optional full archive list for Stats later
  - Stop relying on a single mount-time `useMemo(loadDailyHistory)` pattern if the component is expected to react to live record changes.
- `src/components/DailyCompleteCard.tsx`
  - Evolve from “today complete + countdown” into “today complete + recent week + countdown” if space permits.
- `src/components/StatStrip.tsx`
  - Reuse only if the new insight truly reads as a metric strip. Do not force the seven-day history into metric boxes.

### State and persistence

- `src/game/state/store.ts`
  - No behavioral rewrite needed for replay-safety or daily completion accounting.
  - If additive `DailyRecord` fields are introduced, populate them at daily completion only.
- `src/stats/persistence.ts`
  - No migration required for the base R4 slice.
  - Only touch if optional `DailyRecord` extensions are added.
- `src/stats/stats.ts`
  - Leave aggregate lifetime logic alone unless a new daily-best helper is deliberately centralized here.

### Strings / i18n

- `src/i18n/strings.ts`
  - Add copy for:
    - seven-day strip labels
    - no-record / not-played state
    - personal daily highlight labels
    - next-daily framing if copy changes
- Keep tone neutral. No loss-language for absent days.

### Share flow

- `src/components/ShareButton.tsx`
  - No structural change required for R4 must-ship.
- `src/share/shareCard.ts`
  - Leave untouched for the smallest R4 unless a later retention pass wants a daily-history share variant.

### Tests / E2E surfaces

- `src/game/state/__tests__/store.test.ts`
  - Extend only if `DailyRecord` gains fields.
- `src/stats/__tests__/persistence.test.ts`
  - Add round-trip coverage only if the `DailyRecord` schema changes.
- `src/stats/__tests__/stats.test.ts`
  - Add helper tests if daily-best derivation is centralized.
- `src/game/state/persistence/__tests__/observers.test.ts`
  - Verify additive daily fields persist if introduced.
- `tests/e2e/progression-validator.mjs`
  - Add assertions around daily strip rendering and replay-safe daily insights.
- `tests/e2e/results-next-flow.mjs`
  - Add a daily-result case so new retention blocks do not break result-screen reachability on mobile.
- `tests/e2e/gameplay-smoke.mjs`
  - Consider one smoke case that confirms onboarding still does not mutate daily history.

## Test Plan

### Unit

- history selector returns exactly 7 days in reverse-chronological order
- missing dates render as empty states, not failures
- personal-daily-best helper handles:
  - no history
  - first recorded daily
  - win after losses
  - equal best time
  - replay of the same day not double-counting
- additive `DailyRecord` fields remain backward-compatible when absent

### Store / persistence

- first daily completion writes one record for today
- replaying today does not create duplicate logical outcomes
- seven-day selector reads correctly from sparse `foldwink:daily`
- full reset still clears daily history and derived retention surfaces

### E2E

- fresh player: menu shows daily CTA and empty recent-week state
- after one completed daily: menu shows today logged + recent-week strip + countdown
- after seeding multiple daily records: Stats shows the recent week correctly
- daily result screen shows the personal-highlight block only for daily mode
- result-screen vertical reachability remains intact on iPhone and Android after the new block is added
- share button still functions or degrades correctly with the new result layout

### Manual QA

- 320 px and 390 px menu readability
- result screen after win and after loss
- seven-day strip legibility in EN/DE/RU
- missing-day visual tone feels neutral, not punitive
- archive/history surfaces remain consistent after a timezone-local date rollover

## Risks

### Product risks

- A visible streak-first treatment would drift toward pressure and conflict with Foldwink’s constraints. The R4 UI must emphasize history, not obligation.
- A dense stats treatment could make the app feel like a tracker rather than a small daily puzzle.

### Technical risks

- If daily insights are derived partly from `Stats.recentSolves` and partly from `foldwink:daily`, the product can drift into conflicting truth sources. Use `foldwink:daily` for daily meaning.
- Adding too much result-screen content risks reintroducing the mobile reachability problems already guarded by `results-next-flow.mjs`.
- `DailyArchive.tsx` currently loads history once per mount. If the component is reused more dynamically, that pattern can become stale.

### Scope risks

- Full archive redesign, monthly history, heatmaps, and share-card extensions are all tempting, but they are beyond the smallest coherent R4.

## Scope-Keeper Verdict

### Must-ship

- seven-day daily history strip
- one daily-only personal highlight after completion
- preserved next-daily countdown with slightly stronger ritual framing

### Should stay out of R4

- notifications or reminder prompts
- streak saver / missed-day forgiveness
- paywalled retention surfaces
- rewarded hint or replay boosts
- network analytics, social ranking, or friend comparison
- full calendar or large archive redesign

### Verdict

The smallest coherent R4 is a **calm recent-week ritual plus one personal daily insight**. The codebase already supports this safely with local-only data. It does **not** support a larger retention system without unnecessary new state, new UI complexity, or pressure mechanics that violate the product line.

That makes the recommended R4:

- visible recent week
- clear “today is part of your run” framing
- one “something meaningful happened today” highlight

No more is required for this sprint.

## Sources

1. Adjust, “The gaming app insights report: 2026 edition.” https://www.adjust.com/blog/gaming-app-insights-2026/
2. Adjust, “Mobile app trends: 2026 edition.” https://www.adjust.com/resources/ebooks/mobile-app-trends-2026/
3. LinkedIn Help, “Games on LinkedIn.” https://www.linkedin.com/help/linkedin/answer/a6863543
4. Netflix Help Center, “Netflix Puzzled - Game Support.” https://help.netflix.com/en/node/485029095813732
5. Puzzmo Blog, “Puzzmo Tech Stack: 2025.” https://blog.puzzmo.com/posts/2025/12/9/tech-2025/
6. Puzzmo Blog, “The new completion section.” https://blog.puzzmo.com/posts/2024/04/18/completion-sidebar-2/
