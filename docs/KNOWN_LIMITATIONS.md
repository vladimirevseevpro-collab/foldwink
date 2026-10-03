# Known Limitations

This document records the real remaining limits of the current Foldwink web/PWA build. It is a release decision aid, not a historical changelog.

## Product and gameplay

- Daily selection uses the player's local date. It is intentionally not a UTC-global shared daily.
- Daily replays are allowed but do not change daily history or statistics.
- Standard tracks wrap after their curated pool is exhausted; there is no separate "pool complete" celebration.
- Quitting a game abandons that attempt without changing statistics.
- There is no past-daily browser yet. Daily Fold is a seven-day personal history, not an archive of playable old dailies.

## Content

- The local pools are being de-duplicated. A 2026-10-01 audit found that roughly half of the September scale-up consisted of recombined copies of existing boards, so the number of genuinely unique puzzles is lower than the previously quoted per-language inventory and will settle only after quarantine. The active pool size per language is reported by `npm run validate`; do not quote a fixed catalogue count until that quarantine is complete.
- Earlier inventory confirmation was based on files on disk, not on content uniqueness. A file count is not editorial approval, and it is not a count of distinct boards.
- The validator enforces structure and catches a defined set of logic risks. It cannot prove that every category feels natural to a human, so future batches still require editorial review before promotion.
- One review signal remains in the Russian pool: `ru-0205` distinguishes conventional geographic regions of East Asia and Southeast Asia. It was retained after manual review, but belongs on the next editorial revisit list.
- German Tabs audit classified 33 fallback boards as P0 rebuild/retire candidates. All 33 have now been replaced one-for-one with independently reviewed general-audience boards.
- 28 active Medium/Hard boards still rely on a full group-label fallback instead of a short explicit revealHint (27 English and 1 Russian; German has none). They are playable, but this is a mobile readability debt and is now counted by validation.
- Easy puzzles deliberately have no Tabs or Wink. Medium puzzles have Tabs and one optional Wink. Hard puzzles reveal Tabs more slowly and have no Wink.

## Privacy, storage, and monetization

- Progress, statistics, consent, and the cosmetic Supporter flag are local to this browser. Clearing site data removes them; there is no account or cross-device sync.
- Optional Umami measurement is dormant until an operator configures it and the player explicitly consents. No analytics endpoint is configured in the repository.
- Ko-fi and hosted Supporter checkout are code-ready but intentionally hidden until public URLs are configured. The Supporter return is trust-based because there is no receipt-verification backend; its perk remains cosmetic.
- Rewarded ads are not active. The adapter is deliberately dormant until real product evidence justifies a peripheral, non-pay-to-win reward.

## Platform and release

- Direct web/PWA is the canonical product. itch.io is optional discovery, not the primary home or payment flow.
- Service-worker offline behavior and responsive layouts are automated in browser tests, but real iPhone Safari and Android Chrome install/safe-area/share checks remain human work. The exact W7 pilot build is itch `0.8.4` / `#1984826`; older device evidence does not substitute for exact-build acceptance.
- Native Android/iOS shells have not been started. They require a separate Capacitor setup, real-device testing, and channel-compliant purchase handling; a thin wrapped website is not a release target.
- The Cloudflare Pages source has been prepared to serve the current PWA at the canonical route, but the public deploy is blocked by an expired Wrangler authentication token. itch.io was updated separately; direct web publication, support contact verification, and a real hosted checkout return test are still required before an openly monetized launch.

## Accessibility and audio

- Keyboard grid navigation, localized labels, and live game-status announcements are implemented. A full screen-reader audit with real assistive technology is still outstanding.
- The solved palette uses dark ink plus shape markers, but has not been independently tested with colour-blind participants.
- Nine local tactile audio cues are integrated and mute state persists. A human listening pass on phone speakers and headphones remains required.

## Build and QA

- Automated gates currently cover formatting, TypeScript, linting, 57 Vitest files / 367 tests, content validation of the active pool in each supported language, production build, 74/74 production-browser E2E scenarios and 4/4 strict pilot/release-operations suites. The W8 checker represents all 47 acceptance items, cryptographically binds each pass to gate-specific local evidence, checks the real ZIP entry set against its manifest and requires a matching detached exact-commit rebuild receipt. It intentionally remains NO-GO while physical-device, human, rollback or clean-candidate evidence is absent.
- `npm audit --omit=dev` reports zero production vulnerabilities. After the isolated Vite 8/Vitest 5/PostCSS/SDK hardening slice, the full development tree reports four advisories (1 low, 3 moderate; no high or critical). The low item is `tsx`'s pinned development-only esbuild, while the three moderate entries are one Capacitor CLI → xcode → uuid chain used only for future iOS tooling and not shipped in the static web build. npm currently offers a Capacitor CLI downgrade rather than a compatible patched xcode chain. These residuals require an exact macOS/iOS compatibility decision or upstream fix before a native shell release; the clean W8 web candidate must repeat both audits.
- Browser automation cannot replace physical-device checks for Safari audio unlock, safe areas, install UX, native share sheets, payment redirects, or store review expectations.

## Deliberate non-goals for 1.0

- No backend, accounts, cloud sync, leaderboards, multiplayer, or runtime puzzle generation.
- No additional gameplay twist beyond Foldwink Tabs and Wink.
- No 3D renderer, motion framework, autoplay ads, interstitials, banners, or paid active-puzzle advantage.
- All 27 audited Russian P0 boards have now been rebuilt one-for-one after native-language review; no audited Russian P0 candidates remain.
