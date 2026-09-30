# Foldwink monetization and privacy operator guide

Foldwink keeps gameplay local-first and monetization peripheral.

Hard rules:

- no paywall on today's daily puzzle
- no paywall on easy mode
- no paywall on the archive
- no pay-to-win hints, retries, or extra Winks on the active puzzle
- no auto-play ads, interstitials, or banners

## Public config

Public env values:

- `VITE_UMAMI_WEBSITE_ID`
- `VITE_UMAMI_SCRIPT_URL`
- `VITE_KOFI_HANDLE`
- `VITE_SUPPORTER_CHECKOUT_URL`

Optional runtime overrides for host-specific injection and E2E:

- `window.__FOLDWINK_CONFIG__.umamiWebsiteId`
- `window.__FOLDWINK_CONFIG__.umamiScriptUrl`
- `window.__FOLDWINK_CONFIG__.koFiHandle`
- `window.__FOLDWINK_CONFIG__.supporterCheckoutUrl`

No secrets belong here.

## Privacy boundary

Game progress, stats, streaks, tutorial state, supporter badge, and local aggregate event counters stay in browser storage on this device.

Optional analytics is available only when:

1. a website id is configured
2. the player explicitly grants consent
3. Umami has loaded

Before consent:

- no analytics script is injected
- no analytics network event is sent
- local aggregate counters still work

After consent, Foldwink loads Umami once with:

- `data-auto-track="false"`
- `data-do-not-track="true"`
- `data-exclude-search="true"`
- `data-exclude-hash="true"`

Only manual events are sent via `window.umami.track`.

Allowed coarse properties:

- `surface`
- `mode`
- `difficulty`
- `outcome`
- `channel`
- `source_bucket`
- `has_support_flag`
- `lang`

Forbidden analytics data:

- puzzle text, card text, category text
- puzzle IDs or titles
- raw URL or referrer
- user IDs or fingerprints
- free text
- timestamps
- cross-site data

## Manual analytics events

- `app_open`
- `menu_view`
- `stats_view`
- `onboarding_complete`
- `onboarding_skip`
- `mode_start`
- `round_submit`
- `round_finish`
- `wink_used`
- `share_clicked`
- `tip_opened`
- `supporter_checkout_opened`
- `supporter_return_success`
- `privacy_choice`

## Tip jar

Tip jar is secondary and hidden by default.

1. Create or reuse a Ko-fi page.
2. Set `VITE_KOFI_HANDLE` to the public handle.
3. Redeploy.

The app validates the handle and hides the CTA if the value is blank or invalid.

## One-time supporter

Supporter is a one-time €3 cosmetic thank-you. It does not unlock gameplay advantages.

1. Create a hosted checkout page for a one-time €3 payment.
2. Configure its success return URL to the canonical Foldwink deploy with `?supporter=success`.
3. Set `VITE_SUPPORTER_CHECKOUT_URL` to the hosted HTTPS URL.
4. Redeploy.

The app validates HTTPS and hides the CTA if the value is blank or invalid.

### Preflight before activation

Build first, then run:

    npm run release:preflight:paid

The command requires the two public Vite values above and a local-only
FOLDWINK_CANONICAL_URL environment value. It prints the exact URL that the
hosted checkout must use as its success return:
https://your-domain.example/foldwink/?supporter=success.

It does not contact Ko-fi or the checkout provider and it cannot prove the
provider-side redirect. The documented real deploy return check remains required.

Return flow:

1. Player opens hosted checkout.
2. Provider redirects back with `?supporter=success`.
3. Foldwink sets the local supporter flag.
4. Foldwink removes only the `supporter` query parameter and preserves unrelated query parameters.
5. Foldwink shows one localized thank-you acknowledgement.

This flow is trust-based because there is no backend receipt verification. That is acceptable because the perk is cosmetic only.

## Provider tradeoffs

### Umami

Pros:

- manual-event mode
- privacy-aware relative to mainstream analytics
- no user account requirement

Cons:

- still requires explicit consent before any load/send
- hosted analytics availability becomes part of the funnel

### Ko-fi

Pros:

- simple low-friction tip flow

Cons:

- limited post-payment UX control

### Stripe Payment Link or similar hosted checkout

Pros:

- clean one-time supporter flow
- success redirect works with the local supporter flag

Cons:

- no secure receipt verification without a backend
- return behavior must be verified on the real deploy

## Rewarded ads

Rewarded ads remain disabled. `src/monetization/ads.ts` stays dormant until real-world evidence justifies a peripheral reward surface that still respects the no-pay-to-win rules.
