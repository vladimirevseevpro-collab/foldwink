# Foldwink Accessibility Keyboard Audit

## Scope

Local audit of the game flow's semantic controls, live status surfaces, arrow-key grid navigation, and Enter-key interaction. This is not a substitute for a physical VoiceOver or TalkBack pass.

## Finding and Fix

The GameScreen global Enter shortcut submitted a four-card selection even when keyboard focus was on an interactive control such as Clear. That could make one keypress invoke both the focused control and a hidden submit.

The handler now exits whenever the event target is inside a button, link, input, textarea, or select. Enter on controls is handled only by the focused control's native button behavior.

The Result screen now moves focus to a named, programmatically focusable result region on mount. Its visual outcome headline is a real `h1`, so the end-of-round transition has an accessible starting point.

The replayable How to play dialog now preserves the invoking control in a stable ref when it opens and restores focus when it closes. Changing tutorial steps only updates a separate state ref, so moving through the dialog cannot accidentally return focus to a removed control.

## Evidence

- Game cards are named buttons with selected state through `aria-pressed`; solved cards announce their solved group.
- The puzzle grid has an accessible label and arrow-key focus navigation.
- Mistake state, selection count, and correct/incorrect feedback use labelled polite live regions.
- Game title is an `h1`; primary actions are native buttons.
- New browser regression: select four cards, focus Clear, press Enter, assert selection clears and mistake count does not change.
- New browser regression: after a solved row, ArrowDown skips disabled cards and keeps focus on the next playable row.
- Result transition regression: after a real solved round, focus lands on the named result region before the player continues.
- Dialog-close regression: opening How to play and choosing Skip restores focus to the How to play trigger.

## Tests Run

- `npm test`: 23 files, 178 tests passed.
- `npm run build`: passed, including TypeScript and audio-pack check.
- `npm run test:e2e`: 60 scenarios passed.

## Remaining Human Gate

Run the same game flow with VoiceOver on iPhone Safari and TalkBack on Android Chrome before public launch.
