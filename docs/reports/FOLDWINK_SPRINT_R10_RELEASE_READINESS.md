# Foldwink Sprint R10 - Release Evidence and Operator Handoff

## Sprint Summary

This sprint corrected release documentation that still described an earlier MVP rather than the current product. The canonical launch path is direct web/PWA; itch.io is an optional discovery channel. The revised human checklist covers the actual phone, installation, sharing, privacy, and payment-return checks that automation cannot prove.

The audit made a material content-pipeline risk explicit: structural validation succeeds, but its broad historical warning stream was too noisy to serve as a reliable editorial queue. R10.4 now prints a concise category summary by default and keeps item-level detail behind --verbose. It exposed 122 active Medium/Hard boards that relied on a full-label Foldwink Tab fallback. CQ6 repaired 11 reviewed English boards; 111 remain for editorial repair.

## Changed Files

- docs/KNOWN_LIMITATIONS.md
- docs/ITCH_QA_CHECKLIST.md
- docs/TODO.md
- docs/reports/FOLDWINK_SPRINT_R10_RELEASE_READINESS.md
- docs/reports/FOLDWINK_TAB_HINT_DEBT_EN.md
- scripts/validate-puzzles.ts

## Tests Run

- npm run typecheck - pass
- npm run lint - pass
- npm test - 23 files, 174 tests passed
- npm run validate - pass; EN 500 (273 easy, 193 medium, 34 hard)
- npm run validate:ru - pass; RU 500
- npm run validate:de - pass; DE 500
- npm run audit:logic - pass; one retained review signal (ru-0205)
- npm run build - pass; main bundle 437.52 kB / 103.80 kB gzip
- npm run test:e2e - 47 scenarios passed

## Manual QA Notes

- Direct web/PWA remains the release candidate. Physical iPhone Safari and Android Chrome checks are still needed for install, safe areas, audio unlock, native sharing, and payment redirects.
- With blank public configuration, analytics and payment CTAs remain hidden. Do not configure public payment URLs until the real canonical return loop has been tested.
- itch.io should be tested only as an unlisted draft after the direct deploy is stable; it should not be treated as the primary payment or support-return origin.

## Open Risks

- Content validation now classifies its review queue. The initial 122-board Tabs fallback debt is down to 111 after two reviewed English backfill packages.
- Cross-puzzle repeat signals remain intentionally broad; use --verbose only for focused editorial passes.
- No human device/audio/accessibility pass has yet replaced automated browser coverage.
- No public deployment or real hosted checkout return has been verified.
- Native store shells remain intentionally unstarted and require a separate compliant workstream.

## Go / No-Go for Next Sprint

**Go** for CQ.6: repair the counted Tabs fallback debt in small language-specific editorial batches. Web/PWA is technically ready for a controlled human-device and unlisted-deploy QA pass, but not yet declared ready for public monetization or store submission.