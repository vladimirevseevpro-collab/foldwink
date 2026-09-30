# Foldwink Release Readiness - CQ6 Content Closeout

## Decision

- Closed beta: GO.
- Public free web/PWA launch: conditional GO after the human device and deploy checklist is completed.
- Public paid launch: NO-GO.

## Evidence

- Active pools: EN=500, RU=500, DE=500.
- Russian P0 remediation: all 27 audited P0 boards rebuilt and independently reviewed.
- Active validation: EN=500, RU=500, DE=500 structurally valid.
- typecheck, lint, production build, and audio-pack check passed.
- Vitest: 23 files and 178 tests passed.
- Browser E2E: 60 checks passed, including 320px, iPhone 390x844, Pixel 6, itch embed, PWA offline, RU localisation, every promoted CQ6 board at 390px, keyboard Clear behavior, arrow navigation past solved cards, and the consent-gated analytics flow.
- Content logic audit has one retained ru-0205 heuristic signal; independent Russian editorial review returned KEEP.

## Public Paid Launch Blockers

1. No Ko-fi handle or hosted checkout URL is configured in src/monetization/config.ts. The code therefore hides payment CTAs.
2. No public deploy was independently verified during this audit. An attempted fetch of the canonical URL did not return page evidence, so it cannot prove the deployed build or its version.
3. Checkout return must be tested on the real canonical origin: CTA -> hosted checkout -> supporter success URL -> local cosmetic badge.
4. Human physical-device checks remain required for iPhone Safari and Android Chrome: safe areas, browser chrome, PWA install, audio unlock, native sharing, and payment redirect.
5. Support contact verification, audio listening pass, share-card pass, and screen-reader pass remain human-only.

## Non-blocking Product Debt

- 18 Medium/Hard boards use a full group-label Tabs fallback (17 EN, 1 RU). This is a mobile readability backlog, not a confirmed fairness failure.
- Rewarded ads remain intentionally disabled pending real product evidence.

## Next Smallest Release Step

Deploy the current dist build to the canonical direct web/PWA origin, configure real hosted tip/supporter URLs outside source control, then run the documented human device and checkout-return checks before activating paid CTAs.
