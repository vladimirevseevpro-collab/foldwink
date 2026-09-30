# Foldwink Platform Strategy

## Decision

Foldwink's canonical product is direct web/PWA first. The same React 18 + TypeScript + Vite app can be packaged later with Capacitor for iOS and Android once the app-like shell, offline behavior, and retention foundation are proven. There is no planned Swift or Kotlin rewrite.

## Role of each channel

- Direct web/PWA is the zero-install funnel for TikTok, shares, embeds, and fast replay.
- Store apps are a retention, trust, and discovery layer for installed users. They do not replace the web product.

## Verified platform facts

- Apple Developer Program: 99 USD/year
  - https://developer.apple.com/support/compare-memberships/
- Apple App Review Guidelines:
  - Guideline 4.2 requires more than a repackaged website
  - Guideline 3.1.1 governs digital purchase flows and IAP expectations
  - https://developer.apple.com/app-store/review/guidelines/
- Google Play developer account:
  - full distribution account registration is a one-time 25 USD
  - personal accounts must meet current testing requirements before full distribution
  - https://support.google.com/googleplay/android-developer/answer/14659200?hl=en
- Google Play quality policy requires stable, engaging, meaningful functionality:
  - https://support.google.com/googleplay/android-developer/answer/9898783?hl=en
- Google Play digital-goods payments policy:
  - https://support.google.com/googleplay/android-developer/answer/9858738?hl=en
- Capacitor:
  - can be added to an existing JavaScript project
  - targets iOS, Android, and web from the same app base
  - https://capacitorjs.com/docs

## Release sequence

1. Web/PWA polish plus privacy-aware funnel measurement.
2. Android internal or closed testing.
3. iOS TestFlight.
4. Public Play Store and App Store release.

## App-like acceptance package before store push

- Offline-capable shell for menu, today's daily entry, and archive/history surfaces.
- Native haptics, share, status bar, and safe-area handling.
- Durable local-storage migration so existing users do not lose local progress.
- Deep links back into the daily/archive flow.
- Store assets, privacy page, and support page ready.
- No mandatory account.

## Monetization boundary by channel

- Web: hosted Ko-fi / Stripe links are acceptable.
- Native shells: any cosmetic supporter purchase must use compliant store billing, or an eligible regional program where allowed.
- Do not blindly reuse external digital-goods checkout flows inside store shells.
- Core gameplay stays free everywhere: today's daily, easy mode, and archive must remain free.

## Go / No-Go criteria

Go to store shells only when all of the following are true:

- web/PWA retention loop is stable and worth installing
- offline/app-like shell behavior is real, not nominal
- native haptics/share/safe-area behavior is implemented
- privacy/support/store metadata package is ready
- channel-specific billing rules are implemented correctly

No-Go if any of these remain unresolved:

- store build is effectively just a wrapped website
- native billing rules for digital unlocks are not compliant
- local progress migration is brittle
- safe areas, browser chrome, or share flows still fail on real devices

## Operational risks

- iOS release tooling requires macOS and Xcode, or a managed macOS CI path.
- Apple review risk is high if the build feels like a thin web wrapper.
- Google testing/distribution rules for personal accounts must be planned before launch timing is committed.
