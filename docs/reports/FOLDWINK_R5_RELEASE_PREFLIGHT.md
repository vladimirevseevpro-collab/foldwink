# Foldwink R5 Release Preflight

## Summary

Added a deterministic operator command for the optional paid launch
configuration. It validates only public values and local build evidence; it does
not contact Ko-fi, a checkout provider, analytics, or any player device.

## Command

    npm run release:preflight
    npm run release:preflight:paid

The strict paid form requires:

- VITE_KOFI_HANDLE
- VITE_SUPPORTER_CHECKOUT_URL
- FOLDWINK_CANONICAL_URL

It checks that dist/index.html exists, validates the Ko-fi handle and HTTPS
URLs, and prints the provider success URL with ?supporter=success.

## Tests Run

- Default preflight: passed with current free configuration and correctly reported hidden optional CTAs.
- Strict paid preflight without configuration: expected NO-GO with all three missing values named.
- Strict paid preflight with safe test public values: passed and printed the expected supporter success URL.
- TypeScript: passed.
- ESLint: passed.
- Vitest: 23 files, 174 tests passed.
- Active English pool validation: passed, 500 puzzles.
- Production build: passed; sound-pack check passed.

## Scope Boundary

The command deliberately cannot prove:

- provider-side checkout return configuration
- public deployment version
- iPhone/Android behavior
- payment success or receipt state

Those remain explicit public-paid release gates.

## Changed Files

- scripts/release-preflight.mjs
- package.json
- docs/MONETIZATION.md
- docs/TODO.md
- docs/reports/FOLDWINK_R5_RELEASE_PREFLIGHT.md

## Go / No-Go

GO for local configuration verification.
NO-GO for paid activation until real public configuration and the documented
device/checkout-return checks are complete.
