
# Foldwink Sprint R5 - Monetization Readiness

## Sprint Summary

R5 turns the existing support hooks into a privacy-aware, measurable web
monetization surface without gating any puzzle content.

Implemented:

- typed manual-only funnel events with local aggregate counters
- optional Umami loading only after explicit consent
- a localized privacy prompt and control surface
- public environment and runtime configuration for Ko-fi and hosted checkout
- first-touch attribution that decorates outbound support links
- one-shot supporter return acknowledgement and cosmetic local badge flow
- default-off monetization, analytics, and rewarded ads
- R5 browser coverage for zero-network default behavior and supporter return

The active product remains direct web/PWA first. No account, backend, paid
hint, paid retry, content paywall, auto-play ad, interstitial, or banner was
introduced.

## Changed Files

Key R5 implementation zones:

- .env.example
- docs/MONETIZATION.md
- public/privacy.html
- src/analytics/eventLog.ts
- src/analytics/__tests__/eventLog.test.ts
- src/monetization/config.ts
- src/monetization/supporter.ts
- src/monetization/__tests__/config.test.ts
- src/monetization/__tests__/supporter.test.ts
- src/components/PrivacyControl.tsx
- src/components/PrivacyPrompt.tsx
- src/components/SupporterThankYou.tsx
- src/components/TipJarLink.tsx
- src/components/SupporterUnlockCta.tsx
- src/components/ShareButton.tsx
- src/components/Onboarding.tsx
- src/app/App.tsx
- src/game/state/store.ts
- src/screens/MenuScreen.tsx
- src/screens/StatsScreen.tsx
- src/main.tsx
- tests/e2e/r5-monetization-qa.mjs
- tests/e2e/run-all.mjs

## Tests Run

- npm run typecheck - PASS
- npm run lint - PASS
- npm test - PASS, 22 files / 172 tests
- npm run validate - PASS, 500 puzzles; 1,349 pre-existing editorial warnings
- npm run build - PASS
- npm run test:e2e - PASS, 42 browser scenarios
- audio pack check - PASS, 9 local WAV cues / 278,796 bytes

npm audit --omit=dev could not be re-run because the managed environment
blocked the registry request. The last recorded production audit was clean;
this needs a fresh human-approved network audit before public release.

## Manual QA Notes

- Default production build does not show a consent prompt and makes no
  analytics request.
- Supporter return preserves unrelated UTM query data, strips
  supporter=success, stores only the local cosmetic flag, and presents a
  dismissible thank-you.
- R5 support CTAs remain hidden until real public configuration is supplied.
- Existing mobile E2E still covers 320x700, 390x844, 412x915, 430x932, and
  desktop flow reachability. A human pass is still required with real
  configured CTAs and a physical iPhone/Android device.

## Open Risks

- M1-M5 remain human/external work: real Ko-fi handle, hosted checkout,
  provider identity and tax setup, canonical success URL, and first live
  return-loop observation.
- The trust-based local supporter flag is intentionally cosmetic only; it is
  not a payment entitlement system.
- Runtime analytics config is unit-tested; a full configured-provider browser
  pass requires a real hosted configuration on a disposable deployment.
- Fresh dependency audit is pending environment approval.
- Rewarded ads remain disabled and out of scope until sustained usage exists.

## Go / No-Go

**GO** for code-ready, privacy-first web monetization configuration and a
closed test deployment.

**NO-GO** for activating a real payment link until M1-M5, physical-device
QA, and a fresh production dependency audit are completed.
