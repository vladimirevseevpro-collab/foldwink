# FOLDWINK_SPRINT_R5_MONETIZATION_AUDIT

## Executive Verdict

Foldwink already has a small, honest web monetization skeleton. It does not yet have an honest measurable funnel.

What is real now:

- Tip jar and supporter checkout UI components exist.
- Both are config-gated and currently hidden by empty values in `src/monetization/config.ts`.
- Supporter recognition is local and trust-based by design: `?supporter=success` sets a same-origin `localStorage` flag.
- Share-card supporter treatment is real.
- First-touch UTM capture exists and can decorate outbound monetization links.

What is not real now:

- No live web monetization is active in the default config.
- No network analytics sink exists.
- No global funnel measurement exists across users, devices, or channels.
- No E2E covers the purchase-return loop.
- No rewarded ad UX exists on a live screen.

Primary recommendation for a Germany-based hobby/validation product:

- Use direct web/PWA as the canonical paid surface.
- Primary offer: one-time cosmetic supporter unlock via Stripe Payment Links.
- Secondary ambient offer: Ko-fi tip jar after a win.
- Keep rewarded ads off in R5.

Fallback recommendation:

- If Stripe account setup is not ready, launch with Ko-fi tip jar only.
- Delay supporter checkout until Stripe is operational on the canonical standalone origin.

This stays inside product constraints: no paywall on daily/easy/archive, no backend, no account, no auto/interstitial/banner ads, no pay-to-win.

## Current Implementation Audit

### `src/monetization/config.ts`

Current state:

- Single source of truth exists.
- `koFiHandle` is empty.
- `supporterCheckoutUrl` is empty.
- `supporterPriceLabel` is set to `€3`.
- `rewardedAdsEnabled` is `false`.

Implication:

- Tip jar is implemented but hidden.
- Supporter checkout is implemented but hidden.
- Rewarded ads adapter exists but is off.

### Tip jar: `src/components/TipJarLink.tsx`

Current state:

- Real component.
- Renders only after a win.
- Hidden when `koFiHandle` is blank.
- Opens hosted page in a new tab.
- Appends local first-touch attribution via `ref`.

Reality level:

- Code-real.
- Product-hidden by empty config.
- Measurement-limited to provider-side link/ref visibility only.

### Supporter unlock: `src/components/SupporterUnlockCta.tsx`, `src/monetization/supporter.ts`

Current state:

- Real component and real boot-time return handler.
- CTA opens hosted checkout in a new tab.
- Hidden when `supporterCheckoutUrl` is blank.
- Hidden for existing supporters.
- Success depends on return URL containing `?supporter=success`.
- Recognition is same-origin localStorage only.
- No receipt, no signature, no server verification.

Reality level:

- Code-real.
- Product-hidden by empty config.
- Explicitly trust-based.

Failure modes already visible from the design:

- User pays but does not return through the configured success URL.
- User returns to a different origin than the one they later play on.
- User clears storage, switches browser, or changes device.
- Hosted provider success flow is misconfigured.
- Any user can self-grant supporter status by typing the success query.

Because the perk is cosmetic only, the trust model is acceptable on web for validation-stage product work.

### Supporter badge: `src/components/SupporterBadge.tsx`, `src/screens/StatsScreen.tsx`

Current state:

- Real badge exists.
- Shown only on Stats.
- Driven only by local supporter flag.

Reality level:

- Code-real.
- Local-only recognition.

### Share-card supporter treatment: `src/share/shareCard.ts`, `src/screens/ResultScreen.tsx`

Current state:

- Real.
- Supporter share card gets a visible seal.
- Result screen passes `supporter: isSupporter()` into card options.

Reality level:

- Code-real.
- Local-only.
- Good cosmetic payoff for a trust-based unlock.

### Placement audit: Result / Menu / Stats

Current actual placement:

- `ResultScreen`: share button is always present; tip jar and supporter CTA render only on win.
- `StatsScreen`: supporter badge is present; supporter CTA is not mounted.
- `MenuScreen`: no tip/support CTA is mounted.

Observed mismatch:

- `SupporterUnlockCta` supports contexts `result | menu | stats`, but only `result` is used.
- This means there is no ambient supporter surface on menu or stats yet.

Recommendation:

- Keep result as the primary conversion surface.
- Stats may carry a quiet supporter CTA later, but only after the direct purchase-return loop is verified on the standalone web origin.

### Analytics and event log: `src/analytics/eventLog.ts`

Current state:

- Local-only aggregate counter exists.
- No network transmission.
- Clear affordance exists in `AboutFooter`.

Declared event types:

- `app:open`
- `menu:view`
- `stats:view`
- `daily:start`
- `daily:win`
- `daily:loss`
- `standard:start`
- `standard:win`
- `standard:loss`
- `wink:used`
- `share:clicked`

What is actually wired now:

- `menu:view` is logged.

What appears unwired in the inspected code:

- `app:open`
- `stats:view`
- `daily:start`
- `daily:win`
- `daily:loss`
- `standard:start`
- `standard:win`
- `standard:loss`
- `wink:used`
- `share:clicked`

Implication:

- The local event schema is broader than the live instrumentation.
- Current event data is not sufficient even for reliable single-device funnel analysis.

### Attribution: `src/monetization/attribution.ts`

Current state:

- Captures first-touch `utm_*` locally at boot.
- Only stores first touch, never last touch.
- Adds compact outbound ref to tip/supporter links.
- Uses `client_reference_id` for Stripe-compatible links.
- Explicitly documents itch embed query-loss limitation.

Reality level:

- Code-real.
- Useful for provider dashboards on direct web only.
- Not a substitute for product analytics.

### App startup and success-query handling: `src/main.tsx`

Current state:

- `captureUtm()` runs at boot.
- `consumeSupporterReturnUrl()` runs at boot.

Good:

- Startup order is coherent for a local-only web funnel.
- Success query is stripped after consumption.

Limitations:

- No thank-you state is surfaced from the returned boolean.
- No event is logged for successful supporter recognition.
- No restore mechanism exists beyond local same-origin state.

### `index.html`, `vite.config.ts`, base behavior

Current state:

- Vite `base: "./"` supports relative asset paths.
- Existing E2E already checks subpath safety for itch-like embed conditions.
- `index.html` includes canonical direct web metadata.

Monetization relevance:

- Relative assets are good for embeds.
- Purchase-return recognition remains origin-bound, so embed compatibility does not solve supporter restore across origins.
- Canonical direct web should be the only promised supporter-return path.

### `docs/MONETIZATION.md`

Current state:

- Honest operator guide.
- Correctly documents trust-based nature.
- Correctly documents itch risk.
- Correctly states rewarded ad adapter is not wired into a live screen.

Gap:

- It is an operator guide, not a measurable funnel spec.
- It does not define a privacy-aware network sink because none exists yet.

### Tests

Unit tests that exist:

- `src/monetization/__tests__/supporter.test.ts`
- `src/monetization/__tests__/attribution.test.ts`

They verify:

- supporter flag set/clear behavior
- success query consumption and cleanup
- case-insensitive success handling
- UTM first-touch capture
- outbound attribution decoration

What is not covered:

- CTA rendering by config state
- Result-screen monetization placement
- share-card supporter branch
- actual payment return on the canonical production origin
- cross-origin/itch return behavior
- real provider URLs

### E2E

Existing E2E suite is real and healthy for general product regression, but monetization-specific coverage is missing.

What current E2E does cover:

- Vite preview boot
- relative asset behavior
- itch-like host degradation
- share resilience
- responsive result-screen reachability

What current E2E does not cover:

- tip CTA visibility by config
- supporter CTA visibility by config
- outbound attribution param presence on CTA URLs
- `?supporter=success` boot return in browser automation
- supporter badge appearance after success return
- provider redirect behavior

## Funnel Map

### Current actual funnel

1. Visit/source
   - Direct standalone visit can carry `utm_*`.
   - Itch embed loses query-based attribution in practice.

2. Onboarding
   - Real product onboarding exists.
   - No onboarding event instrumentation was found in the local log.

3. Daily start
   - Real daily mode exists.
   - Start event type exists in schema but appears unwired.

4. Submit / game progression
   - Core gameplay is real.
   - Result event types exist in schema but appear unwired.

5. Result
   - Share button is always present.
   - Tip/support surfaces appear only after wins and only when configured.

6. Share / tip / support click
   - Share button exists, but `share:clicked` appears unwired.
   - Tip and supporter clicks are not event-logged locally.
   - Attribution is only appended outbound.

7. Hosted checkout
   - Entirely external.
   - No product-side visibility without a network sink or provider dashboard.

8. Success return
   - Web return is recognized locally if and only if the player lands on the same origin with `?supporter=success`.

9. Local supporter recognition
   - Badge on Stats.
   - Supporter seal on share card.

### Failure map by stage

Visit/source:

- UTM absent.
- UTM captured only on first touch, not per session.
- itch strips effective attribution.

Onboarding:

- No measurable drop-off beyond local/manual observation.

Daily start:

- No globally measurable starts.
- Current local event schema is not fully wired.

Result:

- Win-gated monetization means losing users never see the offer.
- This is good product ethics, but it reduces early conversion volume.

Share/tip/support click:

- No reliable product-side click counts across users.
- Provider-side link logs are incomplete and fragmented.

Hosted checkout:

- Product cannot see abandon vs pay vs error without external system support.

Success return:

- Same-origin dependency is strict.
- No durable restore across device/browser.

Supporter recognition:

- Can be lost with storage reset.
- Can be self-granted manually.

## Monetization Channel Comparison

### Stripe Payment Links

Best use here:

- Primary one-time supporter unlock on canonical standalone web.

Why:

- Simple hosted checkout.
- Supports one-time pricing and pay-what-you-want patterns.
- Can accept `client_reference_id`.
- Lowest-friction fit for a Germany-based small product that wants direct control and cleaner economics than a tip platform.

Verified provider fact:

- Stripe Payment Links can sell one-time/pay-what-you-want and for German standard EEA cards lists `1.5% + EUR 0.25`.
- Source: https://stripe.com/en-de/payments/payment-links

Tradeoffs:

- You handle your own Stripe account operations.
- Native store shells cannot reuse this checkout for in-app digital unlocks.

### Ko-fi

Best use here:

- Ambient tip jar, not primary unlock rail.

Why:

- Very low setup friction.
- Good fit for voluntary support after a good session.

Verified provider fact:

- Ko-fi current Contributor status applies a `5%` service fee to one-time tips, with payment processor fees separate.
- Source: https://help.ko-fi.com/hc/en-us/articles/360002506494-Does-Ko-fi-take-a-fee

Tradeoffs:

- Weaker product identity than a first-party branded supporter offer.
- Less suitable as the main cosmetic unlock rail.

### Lemon Squeezy

Best use here:

- Fallback supporter commerce option if Stripe operations become a blocker.

Why:

- Merchant of Record model reduces tax/admin load.

Verified provider fact:

- Lemon Squeezy is Merchant of Record, handles taxes, baseline example fee is `USD 0.50 + 5%`, with `+1.5%` international and non-US payout fees.
- Source: https://docs.lemonsqueezy.com/help/getting-started/fees

Tradeoffs:

- Higher effective fee burden for a very small price point.
- Less attractive for a low-ticket hobby-validation product if Stripe is available.

### Rewarded ads

Current code state:

- Adapter exists.
- No screen wiring.
- Config is off.

Verdict:

- Keep off in R5.

Reason:

- DAU is not yet at a level where ad operations are worth the UX and policy complexity.
- The current product has a cleaner honest offer path through tip + cosmetic supporter unlock.
- Any rewarded bonus tied to active puzzle help is too close to pay-to-win pressure for this stage.

## Recommended Web Offer and Pricing

### Primary setup

- Primary offer: `Support Foldwink once — €3`
- Delivery: Stripe Payment Link on canonical standalone web origin
- Perk: cosmetic only
  - Supporter badge on Stats
  - supporter seal on share card
  - optional quiet thank-you copy on return

Suggested copy:

- Headline: `Keep Foldwink independent`
- Body: `One-time support. No gameplay unlocks. Just a quiet supporter mark and my thanks.`
- CTA: `Unlock Supporter for €3`

Pricing hypothesis:

- `€3` is the cleanest first test.
- Secondary experiment later: `€4` if conversion is healthy and complaint rate is near zero.
- Do not start with a higher anchor until the direct web loop is verified.

Why this setup wins:

- Honest.
- Small.
- Aligned with current cosmetic-only recognition.
- Compatible with no-backend constraints.

### Fallback setup

- Tip jar only via Ko-fi.
- Suggested copy: `Enjoyed that round? Tip €2`
- Keep supporter unlock disabled until the return loop is proven on direct web.

Pricing hypothesis:

- Cosmetic default mention: `€2` tip suggestion.
- Let Ko-fi keep pay-what-you-want flexibility.

### What not to do

- No paid daily access.
- No paid easy/archive access.
- No ad-gated retry, hint, or progress.
- No fake urgency.
- No streak-save copy.
- No “limited supporter window”.

## Privacy-Aware Measurement Design

### What can be measured today without new infrastructure

Locally per device only:

- menu views
- stats views
- starts
- wins/losses
- wink uses
- share clicks

Via provider dashboards only:

- outbound purchase attribution ref on direct web
- completed payments by provider account

This is not a global funnel.

### What cannot be measured globally without an explicit privacy-aware network sink

- unique visits
- onboarding completion rate across users
- daily start rate across users
- submit-to-result completion rate across users
- share CTR across users
- tip CTR across users
- supporter CTA CTR across users
- checkout start rate
- checkout abandonment rate
- purchase conversion rate
- cross-channel comparison beyond provider-side revenue events

### Recommended event taxonomy for R5

Constraint:

- No puzzle words.
- No IP.
- No user ID.
- No fingerprint.
- No cross-site data.

Recommended events:

- `session_open`
- `intro_complete`
- `mode_start`
- `round_submit`
- `round_finish`
- `share_open`
- `tip_open`
- `support_open`
- `support_return_success`
- `support_seen`

Recommended properties:

- `surface`: `menu | result | stats`
- `mode`: `daily | standard`
- `difficulty`: `easy | medium | hard`
- `outcome`: `win | loss | success | fail | unsupported | cancel`
- `channel`: `web | embed | pwa`
- `source_bucket`: compact UTM-derived bucket only, for example `tiktok.batch_01`
- `has_support_flag`: `true | false`
- `lang`: `en | de | ru`

Recommended non-identifying counters only:

- aggregate increment rows by calendar day
- no raw URL storage
- no referrer URL storage
- no exact checkout URL storage

### Privacy surface requirement

If R5 wants truly measurable funnel data, Foldwink needs an explicit network sink and matching privacy copy.

Smallest acceptable design:

- one first-party endpoint or privacy-respecting hosted analytics endpoint
- aggregate event POST only
- no cookies
- no user IDs
- no fingerprinting
- no adtech joins
- no cross-site reuse
- clear in-product privacy note describing categories stored

Without that, keep calling the current system what it is: local counters plus provider-side commerce logs.

## Exact R5 Implementation Surface

Code-doable work only:

1. Wire the already-declared local event schema honestly.
   - `app:open`
   - `stats:view`
   - `daily:start`
   - `daily:win`
   - `daily:loss`
   - `standard:start`
   - `standard:win`
   - `standard:loss`
   - `wink:used`
   - `share:clicked`
   - `tip:clicked` and `support:clicked` should be added if the local-only event log remains the measurement layer.

2. Surface a one-shot supporter return acknowledgement.
   - Use the existing boolean returned by `consumeSupporterReturnUrl()`.
   - Show a small thank-you toast or inline note.

3. Add browser-level tests for config-gated CTA visibility and success return.

4. Add E2E that simulates `?supporter=success` on the standalone preview origin.

5. Add E2E that asserts outbound CTA URLs include the attribution parameter when seeded with UTM.

6. Add a minimal monetization funnel spec to docs.
   - Direct web only
   - embed limitations
   - trust-based recognition
   - what counts as measured vs inferred

7. If true global funnel measurement is required in R5, add a privacy-aware network sink and update privacy copy accordingly.

Not recommended for R5:

- wiring rewarded ads
- adding more supporter perks
- adding restore-account concepts
- adding native-shell billing work now

## Checkout Operations Required

Human-only account, identity, payment, tax, and provider actions:

1. Create and verify the Stripe account.
2. Decide legal seller presentation and public support identity.
3. Create the Stripe Payment Link.
4. Set the exact success redirect URL to the canonical direct web origin with `?supporter=success`.
5. Test a real payment on the same origin players will actually use.
6. Confirm provider dashboard visibility for `client_reference_id`.
7. Create the Ko-fi page and handle if tips are enabled.
8. Write final support/refund/contact text on hosted provider pages.
9. Decide whether itch is monetized at all or kept optional/free-only.
10. Maintain channel boundary discipline later for Capacitor store shells per `docs/PLATFORM_STRATEGY.md`.

Important channel boundary:

- Web can use hosted external checkout.
- Later native store shells must respect Apple/Google digital purchase boundaries already noted in `docs/PLATFORM_STRATEGY.md`.

## Test Plan

### Unit

- supporter success query consumed and stripped
- supporter return preserves unrelated params
- UTM first-touch stored once
- outbound tip/support URLs get correct attribution params
- config helper returns `null` when disabled

### Integration / component

- tip CTA hidden when `koFiHandle` is blank
- tip CTA visible after win when configured
- supporter CTA hidden when checkout URL is blank
- supporter CTA hidden for supporters
- supporter badge visible when local flag is set
- share card includes supporter seal when local flag is set

### E2E on standalone preview

- seeded UTM visit -> result win -> supporter CTA href contains `client_reference_id`
- seeded UTM visit -> result win -> tip CTA href contains `ref`
- visit with `?supporter=success` -> badge visible on stats
- success query cleaned from visible URL after boot
- result screen remains reachable with monetization surfaces enabled

### Human QA

- real Stripe test payment on canonical direct web URL
- return lands on exact same origin
- badge appears after return
- share card shows supporter seal
- tip/support links open correctly on mobile and desktop
- direct web and itch behavior documented separately

### Explicitly out of scope for automated certainty

- real provider tax/account correctness
- live provider outage behavior
- store-shell billing compliance

## Risks

1. The biggest commercial risk is not code quality. It is origin mismatch in the supporter return loop.
2. The current measurement story can be overstated if local counters are described as analytics.
3. itch remains a weak supporter flow surface because attribution and same-origin return are both compromised there.
4. Trust-based supporter recognition is acceptable only while the perk remains cosmetic.
5. Rewarded ads would add operational and ethical complexity before the product has enough DAU to justify it.
6. A very low-priced supporter offer can be eaten by fees if the commerce stack is chosen poorly.
7. Native packaging later creates a billing boundary; external digital checkout must not simply be carried over.

## Scope-Keeper Verdict

R5 should stay narrow.

Proceed:

- direct web/PWA first
- Stripe one-time cosmetic supporter unlock as primary
- Ko-fi tip jar as secondary
- truthful funnel instrumentation
- explicit distinction between local counters and global analytics
- real checkout verification on the canonical standalone origin

Do not expand R5 into:

- ad monetization
- perk bundles
- restoration/account systems
- native billing work
- broad analytics stack with user tracking

Rewarded ads should remain off.

The smallest coherent R5 is:

- activate and verify honest web support surfaces
- measure only what the product can actually measure
- add a privacy-aware network sink only if global funnel numbers are truly required

## Source URLs

- Stripe Payment Links: https://stripe.com/en-de/payments/payment-links
- Ko-fi fees: https://help.ko-fi.com/hc/en-us/articles/360002506494-Does-Ko-fi-take-a-fee
- Lemon Squeezy fees: https://docs.lemonsqueezy.com/help/getting-started/fees
