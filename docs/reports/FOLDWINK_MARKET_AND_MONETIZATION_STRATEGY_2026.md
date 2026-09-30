# Foldwink Market and Monetization Strategy - 2026-07-24

## Decision

Position Foldwink as a small daily logic ritual, not as a generic mobile puzzle
catalogue and not as a hybrid-casual ad product.

The canonical product remains direct web/PWA. itch.io remains a discovery
surface. Native store shells become a deliberate later experiment only after the
web funnel proves that players return and voluntarily share.

## External Market Evidence

- Sensor Tower reported that global mobile gaming spend reached about USD 81
  billion in 2024, with puzzle among the genres contributing to growth:
  https://sensortower.com/state-of-mobile-2025
- Its 2025 mobile-gaming report says TikTok mobile-game impression share among
  social networks rose 67 percent year-over-year. This supports a short-form
  creative acquisition test, not an assumption that views become retention:
  https://sensortower.com/state-of-gaming-2025
- Sensor Tower also describes durable ads-first install volume and hybrid
  monetization across casual games:
  https://sensortower.com/blog/gaming-deep-dive-ad-monetization-report
- Puzzle creative is a crowded category. The Sensor Tower and Meta review should
  be treated as a reminder to show actual play rather than fake puzzle ads:
  https://sensortower.com/blog/puzzle-games-creative-trends

These are market-scale observations, not Foldwink forecasts.

## Product Thesis

Foldwink wins only if a player can understand the promise immediately:

1. Sixteen words, four clean groups, one short round.
2. The Foldwink Tabs make a medium puzzle feel learnable rather than punishing.
3. The result has enough personality to share without asking for a social graph.
4. The next daily gives a reason to return without streak punishment.

The tactile paper-and-card presentation, sound, and short daily ritual are the
product differentiators. Do not add more mechanics to imitate broad puzzle apps.

## Monetization Sequence

### Phase A - prove the ritual

Use the current build with no ads and with payment CTA hidden until public URLs
are configured. Measure only consented, coarse funnel events already supported
by the app.

Primary checkpoints:

- onboarding completion
- first puzzle start
- first puzzle finish
- share click after a win
- return to a later daily

Hypotheses for an early healthy signal, not launch promises:

- at least 70 percent onboarding completion among players who begin it
- at least 55 percent first-round completion
- at least 8 percent share-click rate after a win
- at least 25 percent next-day return among players with a finished daily

If one fails, fix the relevant product surface before adding monetization pressure.

### Phase B - voluntary support

After the win, show only the existing optional tip jar and EUR 3 supporter
badge once valid public URLs are configured. The supporter purchase remains a
cosmetic thank-you, not a puzzle advantage.

The supporter offer should be visible after a positive moment, never during
selection, loss, onboarding, or an active daily puzzle.

### Phase C - rewarded-ad experiment

Do not wire an ad SDK before there is repeat traffic. If the experiment is
eventually justified, retain the current rules:

- explicit player action only
- no auto-play, interstitials, or banners
- no retry, solution, extra Wink, or score advantage
- cosmetic or share-card-only reward
- measure opt-in rate and post-ad return, then remove it if it damages the
  daily ritual

## Acquisition Creative

Create vertical 9:16 clips from actual Foldwink play. No fake solution or
bait-and-switch puzzles.

Use six reusable creative angles:

1. One tempting wrong quartet, then the reveal.
2. A 16-card grid solved in under fifteen seconds.
3. The single Wink decision on a medium puzzle.
4. The tactile correct-solve stamp and sound.
5. A daily result card with no voiceover.
6. A challenge prompt that asks viewers to spot one group before the reveal.

Every clip should show the real grid in the first second, then link directly to
the canonical web/PWA URL. Judge each concept by completed sessions and later
returns, not view count alone.

## Channel Order

1. Canonical direct web/PWA: first destination and source of truth.
2. TikTok and short-form reposts: lightweight discovery tests.
3. itch.io: optional catalogue/discovery placement, not the checkout home.
4. Capacitor Android closed test: only after web evidence shows retained use.
5. iOS TestFlight: only after the Android/web comparison justifies it.

A native wrapper is a distribution experiment, not a rewrite and not the next
product milestone.

## Operator Runbook

Before the first public paid test:

1. Configure Ko-fi and hosted checkout URLs outside source control.
2. Set FOLDWINK_CANONICAL_URL locally and run:
       npm run release:preflight:paid
3. Deploy the tested dist build to the canonical origin.
4. Complete the documented real checkout return and physical iPhone/Android QA.
5. Enable consented analytics only after the privacy surface is visible.
6. Publish a small first creative batch and review funnel events after enough
   completed rounds to distinguish noise from a real pattern.

## Red Lines

- no pay-to-win
- no forced ads
- no fake playable-ad creative
- no backend or identity system added merely for monetization
- no retention dark patterns
- no store launch before web evidence justifies its extra operational burden
