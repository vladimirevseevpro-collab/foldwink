# Foldwink Release QA Checklist

Run this on the canonical direct deploy first. itch.io is an optional second channel and must not block web/PWA launch. Every unchecked item is human work; code review is not a substitute.

## Test setup

- [ ] Canonical URL opens over HTTPS: `https://neural-void.com/foldwink/`
- [ ] Test a fresh private window and a returning browser with an active saved game.
- [ ] Test desktop Chrome or Firefox, iPhone Safari, and Android Chrome.
- [ ] Record device, browser, OS, date, and any failure in the release report.

## Core game

- [ ] First-run tutorial appears, is readable, and can be dismissed.
- [ ] Easy game can be won and lost; timer, mistakes, solved groups, result, and retry behave correctly.
- [ ] Medium game shows readable Tabs on a narrow phone; a Wink reveals one label without solving it.
- [ ] Hard game has slow Tabs and no Wink affordance.
- [ ] Reload during a game restores the same state.
- [ ] Daily completion records once; replay is marked and does not change statistics.
- [ ] Russian and German switch fully changes menu and live puzzle content, not just navigation text.
- [ ] No clipped text, overlapping controls, or horizontal scroll at 320 px, 390 px, 430 px, and desktop.

## Input, sound, and accessibility

- [ ] Tap targets work accurately on iPhone Safari and Android Chrome.
- [ ] Keyboard: arrow keys move the grid; Enter/Space select or submit; Escape clears selection.
- [ ] Game-state announcements are understandable with a screen reader in one real assistive-technology pass.
- [ ] First user interaction unlocks audio on mobile; mute persists after reload.
- [ ] All nine cues are acceptable on phone speakers and headphones: select, deselect, submit, wrong, correct, tab reveal, Wink, win, loss.

## PWA

- [ ] Browser offers or completes player-initiated install where supported.
- [ ] Installed app opens standalone, respects iPhone safe areas, and has a readable portrait layout.
- [ ] Menu, today's entry, and a recently opened game work after a controlled offline check.
- [ ] App icon, name, and theme colour are correct in install surfaces.

## Share, privacy, and payment readiness

- [ ] Share output is readable for win, loss, long localized copy, and Supporter state.
- [ ] About/privacy surface explains local storage and optional measurement clearly.
- [ ] With blank public config, no tip, purchase, or analytics CTA is visible.
- [ ] After operator configuration, consent blocks analytics before acceptance and enables only approved coarse events after acceptance.
- [ ] Hosted checkout return on the canonical origin sets the cosmetic Supporter badge and shows one thank-you message.

## itch.io only, if retained

- [ ] `dist/` package loads in an unlisted itch.io draft using click-to-launch.
- [ ] Launch window shows the game at usable phone-like scale; full-size escape action works when constrained.
- [ ] First click unlocks sound; assets and local storage load without broken paths.
- [ ] Do not rely on itch.io for hosted supporter checkout until its return flow has been tested on the real embed origin.

## Verdict

- [ ] Direct web/PWA: READY / NOT READY
- [ ] itch.io discovery listing: READY / NOT READY / NOT USED
- [ ] Monetization activation: READY / NOT READY / NOT CONFIGURED
- [ ] Store-shell work: NOT STARTED / BLOCKED / READY FOR CAPACITOR
