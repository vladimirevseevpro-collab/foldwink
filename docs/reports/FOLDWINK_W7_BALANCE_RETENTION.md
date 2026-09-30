# Foldwink W7 — Human Balance, Comprehension and Return Evidence

Date opened: 2026-09-14  
Scope: FW-032–FW-035, GAME-14, OPS-06, TEST-33  
Status: in progress; FW-032 is technically accepted, while FW-033–FW-035 still require real-participant evidence.

## Sprint Summary

W7 starts from a technically verified W6 build, but no automated result is treated as human balance or retention evidence. The local implementation slice is a versioned coarse event contract, local qualified-session/return state, explicit privacy-safe export and optional binary ambiguity feedback. Completion requires a real 20–30 participant pilot and a full seven-day observation window.

The operating protocol is `docs/research/FOLDWINK_W7_PILOT_PROTOCOL.md`. On 2026-09-14 the local FW-032 slice passed its implementation, privacy, E2E and rendered-UI gates. This does not supply human balance, comprehension or retention evidence.

## Execution Plan

1. FW-032 — extend the existing event schema and call sites; add local-only cohort state, exact local-date D1/D7 definitions, voluntary export and deny/revoke/offline/export tests.
2. FW-032 — render and inspect export/feedback/privacy states at 1440×900, 1024×768 and 390×844; verify no forbidden fields or network replay.
3. FW-033 — freeze an exact pilot build, recruit 20–30 real participants with EN-first and separate RU/DE cohorts, and run the neutral observed first-session protocol.
4. FW-034 — change only reproduced friction/ambiguity; require structural tests, independent editorial review and repeat usability for every affected board/surface.
5. FW-035 — wait for complete D1/D7 eligibility windows and report numerator/denominator, locale/version/consent and organic/invited separately.

## Changed Files

- `src/analytics/eventLog.ts` — canonical OPS-06 events, strict per-event property maps, app/content/policy/balance versions, consent/offline send gates, validated multi-page local counter buckets and corrupt-value recovery.
- `src/analytics/researchCohort.ts` — local-day D0/D1/D7 ledger, exact closed-window eligibility, organic/invited split, idempotent board feedback, runtime-safe locale/consent and minimized voluntary export.
- `src/game/state/store.ts` — attempt, first-group, terminal, abandon, next, reward and qualified-return call sites with first/retry and duration semantics.
- `src/components/Onboarding.tsx`, `src/components/ShareButton.tsx`, `src/components/ShareSheet.tsx` — onboarding and share start/completion/cancellation semantics.
- `src/screens/ResultScreen.tsx`, `src/components/AboutFooter.tsx`, `src/i18n/strings.ts` — optional yes/no board feedback, voluntary pilot export and accurate privacy copy in EN/RU/DE.
- `src/puzzles/runtimeContent.ts`, `src/puzzles/byLang.ts`, `src/screens/MenuScreen.tsx`, `src/i18n/strings.ts` — selected runtime catalogue version exposure plus the verified 1,000-board language total; the menu no longer presents the 30-board lazy boot payload as the full library.
- `scripts/summarize-pilot-exports.mjs`, `scripts/build-pilot-artifact-manifest.mjs`, `package.json` — strict export validator/raw-count aggregation plus reproducible ZIP/per-file/tree checksum manifest commands.
- `src/analytics/__tests__/eventLog.test.ts`, `src/analytics/__tests__/researchCohort.test.ts`, `tests/e2e/w7-research-qa.mjs`, `tests/e2e/pwa-offline-qa.mjs`, `tests/e2e/run-all.mjs`, `tests/visual/w7-research-qa.mjs` — regression and rendered evidence coverage.
- `tests/visual/w7-itch-staging-qa.mjs`, `tests/e2e/responsive-smoke.mjs` — reproducible external itch staging smoke and localized catalogue-count regression.
- `docs/research/FOLDWINK_W7_PILOT_PROTOCOL.md`, `docs/TODO.md`, this report — study operations, evidence and remaining gates.
- `docs/research/FOLDWINK_W7_OPERATOR_PACK.md`, `docs/reports/FOLDWINK_W7_PILOT_BUILD_CANDIDATE.md`, `docs/reports/assets/FOLDWINK_W7_PILOT_BUILD_CANDIDATE_V084.manifest.json` — neutral recruitment/session materials and the exact `0.8.4` ZIP candidate with SHA-256 identity; human evidence remains absent.
- `scripts/summarize-pilot-exports.mjs`, `scripts/summarize-pilot-observations.mjs`, `docs/research/templates/foldwink-w7-observation.example.json` — per-file fault isolation, duplicate quarantine, strict privacy/denominator checks and a machine-readable external roster/observation path. No example or automated record is counted as participant evidence.
- `docs/research/FOLDWINK_W7_OPERATOR_FORM.html`, `tests/visual/w7-operator-form-qa.mjs` — standalone offline researcher form with no persistence/network/dependencies, mandatory external study code, frozen build tuple, explicit qualified-D0 membership, D0-derived return dates, aligned cross-field validation, local JSON download and three-viewport evidence. It is not a Foldwink product route and is not human evidence.

## Tests Run

Final FW-032 technical gate on the exact local build:

- `npm run lint` — pass.
- `npm run typecheck` (inside the final build and independently during implementation) — pass.
- `npm test` — 55 files / 362 tests pass.
- `npm run validate`, `npm run validate:ru`, `npm run validate:de` — 1,000 puzzles per language pass structural validation; existing advisory queues remain editorial signals, not failures (EN 1,903; RU 2,025; DE 1,554).
- `npm run build` — pass; generated service worker contains 22 exact assets.
- `npm run content:check` — 99 runtime-content files current, 32-board archive chunks.
- `npm run notices:check` — 12 production package notices current.
- `npm run build:budget` — 150,821-byte gzip initial JS + EN manifest/boot against 256,000; CSS 19,222 against 25,600.
- `npm audit --omit=dev` — zero known production vulnerabilities.
- `npm run test:e2e` — 74/74 production-browser scenarios plus 4/4 strict pilot/release-operations suites pass on 2026-09-16, including deny/offline no-send, PWA regression, safe voluntary export, share completion/cancellation, export isolation, observation/denominator validation, fail-closed frozen-build identity and the complete 47-gate W8 acceptance schema. The date rollover exposed and corrected a stale E2E assumption: fresh Daily now verifies the exact reviewed calendar puzzle and tier instead of incorrectly requiring every Daily to be Easy; Practice locks remain independently enforced. The responsive suite now selects the intended ordinary-label typography tier instead of depending on randomized card order.
- `npm run pilot:verify-operator-form` — pass; blank study code and PII-like issue text block download, issue removal is functional, browser-generated qualified and non-qualified `P017` records pass the authoritative CLI, no external request/persistence API is present, and desktop/tablet/mobile have no horizontal overflow.
- `node tests/e2e/w7-pilot-export-ops-qa.mjs`, `node tests/e2e/w7-pilot-observation-ops-qa.mjs` — pass; per-file rejection isolation, privacy rejection, duplicate payload/study-code protection, qualified-D0 cohort separation, closed-window-only D1/D7 denominators and rejection of same-day premature closure.
- Independent adversarial FW-032 re-review — 62/62 focused tests; no remaining P0/P1 finding.
- `npm run pilot:verify-channel -- pilot-2026-09 ...` — fetched build `#1984826`; 137 files, 5,382,077 bytes and tree SHA-256 `b41e3ce52dd56f28e96719a6e4872bc7701e6305cbfe270a5e8f02bdd64eb385` match candidate `0.8.4`.
- The same verifier against legacy download channel `html` / build `#1984827` matches the identical tree, so public **Download Now** and **Run game** do not diverge by version.
- `npm run pilot:verify-staging` — external HTTP/browser smoke passes at 1440×900 EN, 1024×768 DE and 390×844 RU, including Daily start, one correct group per locale, live voluntary-export download with exact app `0.8.4` / content `catalog-2026-09-v1`, and zero console/page errors. The 2026-09-16 run exercised the new reviewed-calendar day (`puzzle-0019` in EN); the harness detects solved-card state directly instead of depending on localized accessible-name wording or an incorrect reduction in total grid buttons.
- Pilot `0.8.3` was superseded before participant 001 after source and bundle evidence proved that its research export still identified the app as `0.8.2`. App version is now single-sourced from `package.json`; unit, local E2E and live staging all enforce parity.
- `npm run pilot:check-contract` and release preflight now recompute the ZIP/dist identity and cross-check package/runtime analytics, public staging, both fetched itch channels, operator form, observation template and validator. A negative regression test tampers the manifest version and proves that drift fails closed.
- `npm run release:check` now applies the exact-commit W8 acceptance contract from `docs/release-evidence/W8_RELEASE_ACCEPTANCE.template.json`. Candidate acceptance requires 46 evidenced non-publication gates; production mode requires the 47th explicit authorization gate as well. The current project correctly remains NO-GO.

## Manual QA Notes

Six fresh screenshots under `reports/w7-balance-retention-2026-09-14/visual/` were rendered from the final production build:

- board feedback at 1440×900, 1024×768 and 390×844;
- About/privacy/research export at the same three viewports.

All six were inspected at 100%: no horizontal overflow, overlap, clipped control/text, broken wrapping or unintended empty state was found. The W6 reliability states were also rerendered after the privacy-copy change. Automated Playwright actions remain engineering evidence only and are not comprehension observations.

After itch activation, fifteen additional screenshots under `reports/w7-balance-retention-2026-09-14/itch-staging/` were rendered from public build `#1984826`: public listing and copy, localized app menu/footer and a one-group-correct Daily board at each required viewport. All were inspected at 100%. The three solved-state screenshots were regenerated and reinspected after the 2026-09-16 Daily rollover and the `0.8.4` deployment. No horizontal overflow, overlap, broken hierarchy or unrecoverable clipping was found. The 1024×768 and 390×844 menus correctly scroll to their footers, and the footer shows 1,000 puzzles/Rätsel/пазлов instead of the 30-board boot-chunk count.

The actual installed Windows Chrome `152.0.7977.84` was repeated against exact public build `0.8.4/#1984826`: the public page showed version `0.8.4`, the new iframe loaded, RU Daily accepted the correct «Воздушный транспорт» group, the two-step quit returned to Menu, EN/DE/RU menu localization rendered, and the browser console had zero errors. This is physical desktop-browser smoke, not a participant observation and not evidence for iOS/Android behavior.

The offline operator form was rendered and inspected at 1440×900, 1024×768 and 390×844, with full-page companions under `reports/w7-balance-retention-2026-09-14/operator-form/`. The form collapses to one readable column on mobile and shows no clipping, overlap or horizontal overflow. Its screenshots and synthetic export are tooling evidence only.

## Human Pilot Results

Not started. Required denominators, locale split, interventions, board/version evidence, Wink explanation responses, voluntary-next behavior and ambiguity reports are unknown.

## D1 / D7 Results

Not started. There is no eligible observation window and therefore no retention percentage to report.

## Open Risks

- The deduplicated local cohort ledger, not raw `return_observed` events, is authoritative for D1/D7. Two tabs can both emit the coarse remote return event in an extreme simultaneous-start race without corrupting the day ledger.
- Per-page counter buckets avoid lost updates across tabs but are not compacted automatically; a very long-lived, high-reload profile could eventually exhaust localStorage and silently stop optional counters.
- Identical minimized exports can legitimately belong to different people, but are now quarantined and excluded from aggregate N until the external consented roster resolves them. One malformed/private/inconsistent file no longer prevents valid neighbouring exports from being summarized.
- The external observation aggregator rejects duplicate study codes, wrong frozen-build identities, direct personal-data patterns, impossible session transitions, mismatched D0+1/D0+7 dates and prematurely populated return windows. It emits raw numerators/denominators, locale/acquisition slices, missing windows, coverage and unresolved P0/P1 gates.
- Recruited or consented people without a qualified D0 remain visible in participant-flow counts but are excluded from D1/D7 cohort and missing-window denominators. A D1/D7 window cannot be marked complete on or before its target local day.
- The direct canonical URL still serves an older bundle and the GitHub Pages mirror remains unavailable. Verified W7 staging is itch.io build `#1984826`; direct-site parity remains W8 work.
- Automated external browser evidence and the completed physical Windows Chrome smoke do not substitute for physical iOS Safari/PWA or Android Chrome/PWA. This host has no ADB executable/device available.
- The exact `0.8.4` ZIP and both remotely fetched trees are accepted as the W7 immutable pilot identity. The source worktree remains dirty, so clean commit provenance is still mandatory for W8/release even though it no longer blocks the pilot artifact itself. Historical `0.8.3` evidence is preserved but explicitly excluded from the cohort.
- Wink use cannot be interpreted as Wink understanding; the latter requires a participant answer.
- Board IDs are permitted only in the explicit research export path, never in default network analytics.
- Invited return visits can inflate apparent retention unless separated from organic visits.
- A balance change before the baseline cohort closes destroys version comparability.

## Go / No-Go for Next Sprint

**NO-GO for W8 and public release.** FW-032 is GO for a frozen pilot build. W7 remains incomplete until the real 20–30 participant pilot and full D1/D7 windows exist and all reproduced P0/P1 fairness or comprehension issues are resolved and retested.
