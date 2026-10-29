# TODO - Foldwink

## Detailed implementation specification — 2026-09-12

- [x] Produce the requested technical specification: `docs/FOLDWINK_IMPLEMENTATION_SPEC_2026-09-12.md` — architecture/persistence, fair balance, curated onboarding/daily, reward eligibility, Paper Theatre UI, audio/motion, dependencies, privacy-aware measurement, QA and rollout.
- [x] Specify 39 implementation tasks in waves W0–W8, requirement/test traceability, migration rules and release acceptance gates. This is planning, not completed application implementation.
- **Current integration wave: W7 — human balance, comprehension and return testing.** The historical CQ6/R\* entries below are preserved as history, not a concurrent current implementation plan.
- [x] Confirm the live inventory on 2026-09-14: a full per-language set of JSON files was present on disk. This was a file count, not editorial approval and not a count of distinct boards.
- [x] De-duplicate the active pools after the 2026-10-01 audit found that roughly half of the September scale-up consisted of recombined copies of existing boards. Closed by the 2026-10-10 quarantine and rebalance: on 2026-10-29 `npm run validate:uniqueness` reports EN 1,001 / RU 1,000 / DE 1,000 boards, all unique, 0 duplicates (EN 550/351/100, RU and DE 550/350/100 easy/medium/hard).
- [x] Repository hygiene (2026-10-29): local `main` was 94 commits behind `origin/main` with a stale dirty tree; it now tracks `origin/main`. 449 superseded swarm/Luna/review branches and the `Foldwink-luna` worktree were removed after a verified full backup (`C:/AI/Backups/Foldwink-20261029/foldwink-all-branches-2026-10-29.bundle`, every ref plus the pre-sync working tree). Previously uncommitted TikTok revisions, the Capacitor `ios/` shell, `scripts/check-batch.mjs` and the cited `reports/w*-2026-09-14` evidence are now committed.
- [x] Daily horizon (2026-10-29): `scripts/build-daily-calendar.mjs` now starts the day after the last published Daily (or `--start=`), seeds the 7-day label window from the previous schedule and admits Medium boards only with a full set of Tabs hints. New schedules `daily.<lang>.2026-12-13.json` extend EN/RU/DE through 2027-02-10; their 180 editorial records are `unreviewed`. Rerun before ~2027-01-27 (14-day minimum).
- [x] Windows E2E runner (2026-10-29): `tests/e2e/run-all.mjs` strips ANSI codes before matching Vite's `Local:` line; picocolors always colours output on Windows, so the owned preview server was never detected there.
- [x] Accept `docs/decisions/ADR-001-product-baseline.md` and `docs/decisions/ADR-002-persistence.md`; mark the original mega prompt as historical.
- [x] Finish W0 regression fixtures and `docs/reports/FOLDWINK_W0_BASELINE_DECISIONS.md`.
- [x] W1a: add attempt identity/revision/rules, freeze the Daily completion date, make repeated incorrect quartets non-consuming, and add a deterministic 80 XP unique-solve policy.
- [x] W1a: remove reward creation from `ResultScreen` render and show the committed compatibility receipt inline. No package added.
- [x] W1b.1: make the native IndexedDB aggregate the production bootstrap/write authority; serialize attempt revisions and atomically finalize terminal attempt + stats + profile + reward receipt; retain legacy storage only as a compatibility mirror.
- [x] W1b.2: prove mid-game resume after deleting the legacy session, a real two-tab CAS race, visible storage/conflict warnings, bounded 500-attempt diagnostic history, and full IndexedDB + compatibility-key reset.
- [x] W1b.3: restore terminal Result durably without recalculating rewards; await successful terminal persistence before automatic Result; preserve/export corrupt raw data; confirmation + CAS protect destructive recovery clear. Full backup/import remains FW-026/W5.
- [x] W1c.1: replace the misleading wager contract with a truthful no-wager Mastery attempt (one error allowed, second unique miss ends), refund an unfinished legacy wager once, and add localized/replay-safe result receipts.
- [x] W1c.2: capture and inspect W1 UI evidence at 1440×900, 1024×768 and 390×844; fix the discovered 390px grid-halo overflow.
- [x] W1c.3: complete Mastery focus trap/return focus; prove real two-tab conflict UI and the storage-unavailable warning at all three required viewports.
- [x] W2.1: introduce stable content/item identities, pinned attempt and completed-Daily content, editorial/runtime manifest contracts and changed-board validation gates.
- [x] W2.2: select 6 starters per EN/RU/DE with independent puzzle design/validation review and mobile rendering; rejected candidates never enter starter manifests.
- [x] W2.3: publish immutable 30-day versioned Daily calendars per released language with no unlock/random/English fallback.
- [x] W2.4: separate seen vs solved, add `selectionSequence`, and implement deterministic band/diversity recommendations from versioned balance config.
- [x] W2.5: make Retry/Another semantics explicit, keep Tabs/Wink Medium-only, and remove silent RU/DE Hard fallback.
- [x] Publish `docs/reports/FOLDWINK_W2_CONTENT_DAILY_BALANCE.md` with 320 tests, three language validators, 90/90 mobile Daily renders and inspected three-viewport evidence.
- [x] W3: Today hero + Practice hierarchy, explicit Continue, two-step onboarding, coherent Menu/Game/Result states, common accessible dialog shell and required responsive/keyboard evidence.
- [x] Publish `docs/reports/FOLDWINK_W3_CORE_UX.md` with 323 unit tests, 60/60 production E2E checks and 43 inspected core-slice screenshots.
- [x] W4: consolidate motion lifecycle/reduced-motion, accept the dependency-free CSS runtime, strengthen paper/material assets, and unify audio/haptics through one feedback path.
- [x] Publish `docs/reports/FOLDWINK_W4_AUDIOVISUAL_MATERIALS.md` with 318 unit tests, 65/65 production E2E checks, audio/source evidence and 13 inspected screenshots across the three required viewports.
- [x] W5: collection hierarchy, framed share, bounded challenge/QR payloads, honest share fallback, safe legacy passport compatibility, resumable Palimpsest and atomic full local backup/import.
- [x] Publish `docs/reports/FOLDWINK_W5_COLLECTION_SHARE_TRANSFER.md` with 339 unit tests, 71/71 production E2E scenarios and 15 inspected screenshots across the three required viewports.
- [x] W6: stripped/versioned runtime content, safe PWA update and cold-offline behavior, lifecycle/storage reliability, bundle/privacy/release gates.
- [x] W6.1 / FW-028: generate and integrate stripped immutable selected-language boot/archive chunks; strict locale/reference/content-version/SHA-256 checks and OPS-04 pass at 146,488 bytes gzip initial JS + selected EN manifest/boot.
- [x] W6.2 / FW-029: generate exact-build core precache, cache only the selected language's manifest/boot pack after install, and use a durable-flush-gated Menu/Result update decision; TEST-36/37 local fixtures and three-viewport visual evidence pass. Physical installed-PWA and deployed-base-path verification remain W8 evidence.
- [x] W6.3 / FW-030: visibility-aware foreground timing, rollback-safe duration, pagehide checkpoints, explicit storage failure recovery and awaited namespace clear; TEST-15/24/38 pass.
- [x] W6.4 / FW-031: reproducible third-party notices, build budget, denied/revoked analytics and missing rewarded-ad SDK regression gates; TEST-33/39 pass.
- [x] Publish final `docs/reports/FOLDWINK_W6_OFFLINE_RELIABILITY.md` with 355 unit tests, 72/72 production E2E scenarios, exact budgets, zero production vulnerabilities and 15 inspected W6 screenshots.
- [ ] W7 in progress: consent-safe cohort export/protocol (FW-032), real 20–30 participant pilot with locale split (FW-033), evidence-led balance/friction corrections and independent revalidation (FW-034), then a real D1/D7 readout (FW-035).
- [x] W7 entry scope/audit: local FW-032 preparation is authorized; W7 completion is explicitly prohibited without real participants and complete day windows.
- [x] Publish `docs/research/FOLDWINK_W7_PILOT_PROTOCOL.md` with the recommended 26-person EN/RU/DE split, consent, neutral session script, exact denominators, organic/invited separation, issue severity and retest rules.
- [x] Open `docs/reports/FOLDWINK_W7_BALANCE_RETENTION.md`; human and D1/D7 result sections remain explicitly unknown.
- [x] FW-032: canonical OPS-06 events, local qualified-session/D1/D7 ledger, voluntary minimized export, locale/version/consent and organic/invited split, binary board feedback, strict aggregation, deny/revoke/offline regression, 74/74 production-browser scenarios plus four strict pilot/release-operations suites, and six inspected W7 screenshots. Independent QA found no remaining P0/P1.
- [x] Freeze the current FW-033 candidate `0.8.4` by exact ZIP SHA-256, 137-entry per-file manifest and dist tree hash in `docs/reports/FOLDWINK_W7_PILOT_BUILD_CANDIDATE.md`. W7 accepts this immutable artifact identity; dirty-source provenance remains a W8 gate rather than a participant-001 blocker. Historical `0.8.3` was superseded before participant 001 because its export version drifted to `0.8.2`.
- [x] Push exact candidate `0.8.4` to itch.io channel `pilot-2026-09` and independently fetch it back; all 137 files, 5,382,077 bytes and tree SHA-256 `b41e3ce52dd56f28e96719a6e4872bc7701e6305cbfe270a5e8f02bdd64eb385` match the frozen dist. Verification record: `docs/reports/assets/FOLDWINK_W7_ITCH_CHANNEL_VERIFICATION_V084.json`.
- [x] Update the legacy public download channel `html` to the same exact `0.8.4` artifact (upload `#17237271`, build `#1984827`) so **Download Now** cannot serve an obsolete build; independent channel fetch matches the same 137-file tree. Evidence: `docs/reports/assets/FOLDWINK_W7_ITCH_DOWNLOAD_CHANNEL_VERIFICATION_V084.json`.
- [x] Prepare `docs/research/FOLDWINK_W7_OPERATOR_PACK.md` with neutral EN/RU/DE recruitment copy, privacy-safe session/return sheets, raw denominator fields and aggregation rules.
- [x] Harden W7 pilot operations: isolate invalid exports per file, quarantine identical payloads pending roster resolution, reject privacy/denominator violations, add a strict git-ignored observation template and aggregate participant flow, locale/device coverage, behavioral metrics, missing D1/D7 windows and unresolved P0/P1 gates without fabricating evidence.
- [x] Add and visually accept a standalone offline W7 operator form: no backend/network/persistence/dependencies, mandatory externally assigned study code, frozen build tuple, qualified-D0 separation, D0-derived D1/D7 dates, no premature window closure, CLI-aligned validation and local JSON download. Three required viewports plus privacy/invalid/CLI acceptance checks pass; the form is tooling, not participant evidence.
- [x] Re-run all 74 production-browser scenarios across the 2026-09-16 Daily rollover; replace the stale “Daily must be Easy” assertion with exact reviewed-calendar puzzle/tier verification while preserving independent Practice locks. The same runner also passes export isolation, observation/denominator validation, a fail-closed frozen-build identity contract and the 47-gate W8 acceptance schema. Full E2E returns to 74/74 browser scenarios plus 4/4 pilot/release-operations suites.
- [x] FW-033 pilot freeze: `0.8.5` frozen from clean commit `c874de7` as `pilot/0.8.5/` (tree `d91e97fe…`, 146 files, clean rebuild reproduces every file) and served on GitHub Pages at `…/foldwink/pilot/0.8.5/`; itch is no longer part of the pilot. Supersedes `0.8.4`, whose content predates the October cleanup. Evidence: `docs/release-evidence/0.8.5-w7-pilot/README.md`.
- [ ] FW-033: run 20–30 real observed first sessions on the `0.8.5` pilot URL; do not enter E2E/bot data as participants. Every D7 window must close by 2027-02-10 (the frozen build's last Daily).
- [ ] While a cohort is open, ship no storage-schema or migration change to main: the pilot shares the main app's origin and local storage.
- [x] FW-033 external staging/browser delivery: itch.io **Run game** serves upload `#19242763`, build `#1984826`, version `0.8.4` at `https://html.itch.zone/html/19242763-1984826/index.html`. Automated external EN/DE/RU smoke, live export-version parity, one correct group per locale, zero browser errors and inspected 1440×900 / 1024×768 / 390×844 screenshots pass after the 2026-09-16 reviewed-calendar rollover. Evidence: `docs/reports/assets/FOLDWINK_W7_ITCH_STAGING_VERIFICATION.json`.
- [x] Itch public-metadata truth gate (superseded 2026-10-01): the public listing previously stated 3,000 puzzles and the consent-only privacy/export contract, with AI disclosure **Yes** for Graphics, Text & Dialog and Code, and was inspected at all three required viewports. The fixed count is now known to be inaccurate because roughly half of the September scale-up were recombined copies; the owner must re-publish the listing without a fixed count — see `docs/ITCH_PAGE_COPY.md`.
- [ ] FW-033 physical smoke: Windows 11 Chrome `152.0.7977.84` passes against exact `0.8.4/#1984826` (RU correct group, two-step quit, EN/DE/RU localization, zero console errors). Real iOS Safari/PWA and Android Chrome/PWA remain required; no Android device/ADB is currently available on this host.
- [ ] FW-034: fix only reproduced friction/ambiguity and require independent validation plus repeat usability.
- [ ] FW-035: complete seven full local-day observation windows and report D1/D7 with raw denominators and organic/invited split.
- [ ] Queued after W7: W8 exact-staging, physical installed-PWA and release evidence.
- [x] Prepare a fail-closed W8 acceptance checker and 47-gate evidence template. `npm run release:check` verifies exact package/lock/manifest/git identity, the real ZIP's complete path/byte/SHA-256 set, branch containment, non-symlink evidence boundaries and a gate-specific hashed attestation plus attachment for every pass; `npm run release:check:production` additionally requires explicit publication authorization. Schema, missing rollback, forged ZIP binding, nonexistent branch, capture-only rebuild receipt, tampered rebuild log, tampered/misbound evidence and pending human/mobile blockers have negative regression coverage. This is release-control preparation, not W8 completion.
- [x] W8 toolchain security preparation: pin and verify Vite 8.3, React plugin 6.1, Vitest 5.0, PostCSS 8.5.28 and Anthropic SDK 0.126; compatible audit fixes reduce the full dev tree from 17 advisories (1 critical/5 high) to 4 (1 low/3 moderate, no high/critical), while production remains zero. Typecheck, lint, 362 unit tests, all three validators, build/budget and 74 browser scenarios pass. Residual build-only risks and the non-breaking rationale are recorded in `docs/reports/FOLDWINK_W8_RELEASE_CONTROL_PREP.md`.
- [x] Harden the E2E owner boundary: the runner now waits for its own Vite process and fails immediately on an occupied port instead of accepting a stale server. The negative occupied-port check and a subsequent clean 74/74 + 4/4 run pass.
- [ ] W8 exact-candidate security: repeat the toolchain, production audit, full gates and visual/device acceptance from a clean exact commit; resolve or explicitly accept any then-current Capacitor/tsx-only advisory against the actual web/native release scope.
- [x] W8 exact-commit provenance tooling: pin Node `24.14.1` and npm `11.11.0`; add a detached-worktree `npm ci` + build + deterministic-pack verifier, hashed receipt/log contract, mandatory BLD-01 acceptance binding and CI capture artifact. Two independent rebuilds of current `HEAD` produced identical dist-tree and ZIP hashes and removed their worktrees. A Vite 8 diagnostic build then passed all 74 browser scenarios plus the three applicable operations suites; after restoring frozen `0.8.4`, the strict 74/74 + 4/4 run and pilot identity contract passed. This proves the verifier and compatibility, not the unreleased dirty `0.8.4` worktree.
- [x] W8 provenance remediation: sort normalized ZIP paths and reject non-regular archive inputs; validate artifact/receipt/log parents component-by-component, reject junction/symlink traversal, and create outputs exclusively without overwriting. Five focused regressions pass, the full unit suite is 57 files / 367 tests, and a real post-fix detached capture reproduced the prior HEAD dist/ZIP hashes and removed its worktree. Independent follow-up review confirms both original P1s closed with no remaining P0/P1; its residual P2 pack-parent note was then closed through the same path-safety helper.
- [ ] W8 exact-candidate provenance evidence: after selecting a clean candidate commit, run `npm run release:verify-rebuild -- <record>` and attach the PASS receipt reproducing that candidate's dist tree and ZIP. The current frozen W7 pilot cannot satisfy this gate because its shipped `0.8.4` source was not a clean recorded commit.
- [ ] External evidence still required during implementation: human cohorts, real-device coverage and approved staging/publication actions. Do not mark them passed from local build evidence.
- Deferred/optional: Rive, additional display font, explicit English-hard entry for RU/DE, new content beyond the reviewed plan. Motion requires a documented scope decision and a successful comparison before installation.

## September architecture / balance audit — 2026-09-12

- [x] Inspect current September implementation, run 257 unit tests, typecheck, all three structural validators and a separate diagnostic Vite build; capture and inspect 1440x900, 1024x768 and 390x844 local screens.
- Evidence and recommendations: `reports/architecture-hooks-2026-09-12/AUDIT_RU.md`. This audit does not approve a release or supersede scope by itself; the older CQ6 queue below describes an earlier product state.
- [ ] Proposed next work: attempt-bound idempotent rewards, truthful contract rules, stable daily identity, deliberate first-session content and a real difficulty progression.
- [ ] Proposed design validation: one mobile-first Menu → Game → Result slice, followed by human balance/return testing; visual direction and library choices remain proposals.

## Historical phase — before the September implementation specification

**Recorded earlier status: Sprint CQ6 - Foldwink Tabs content remediation - IN PROGRESS.** See the September specification section above for the current planning state; execution of its W0–W8 waves has not started.

- Keep the canonical product as direct web/PWA first.
- Preserve the no-backend, no-account, local-first gameplay core.
- Treat monetization as peripheral and channel-aware: never gate today's daily, easy mode, or archive.
- Keep privacy explicit before any measurement surface is activated.

### Sprint R5 in progress

- [x] **R5.1** Audit current monetization config, live CTA surfaces, and funnel entry/exit points
- [x] **R5.2** Add privacy-aware first-party event measurement plus consent/privacy surface
- [x] **R5.3** Code-readiness for hosted tip/supporter checkout on web
- [x] **R5.4** Lock channel-aware web/native monetization boundary and platform readiness plan
- [x] **R5.5** Complete local gates and publish report (typecheck, lint, unit, validate, build, and E2E done; external production audit remains human-only)
- [x] **R5.6** Add a deterministic release preflight for the optional hosted tip/supporter configuration; provider-side return and real-device verification remain external
- [x] **R5.7** Publish an evidence-based direct-web/PWA, short-form creative, and honest-monetization strategy with explicit KPI hypotheses

## Release evidence and operator handoff - COMPLETE (R10)

- [x] **R10.1** Audit release documents for claims that contradicted the product and current test evidence
- [x] **R10.2** Replace the itch-only checklist with a direct web/PWA-first human QA checklist
- [x] **R10.3** Publish an honest release-readiness report with external and device-only gates kept explicit
- [x] **R10.4** Make content-validator warnings actionable: concise category summary by default, detail only with --verbose, and explicit Medium/Hard Tabs fallback detection
- [x] **CQ.6.1** Repair 11 reviewed English boards with 44 short Tabs hints (122 fallback boards -> 111)
- [x] **CQ.6.1a** Complete Russian native-language Tabs audit: 38 boards reviewed (P0=27, P1=9, P2=2)
- [x] **CQ.6.1b** Replace four Russian P0 boards one-for-one with verified local drafts; UTF-8 verified and active RU pool remains 500
- [x] **CQ.6.1c** Add short reviewed Tabs to two safe German boards (DE fallback boards 37 -> 35)
- [x] **CQ.6.1d** Add short reviewed Tabs to two safe Russian boards (RU fallback boards 34 -> 32)
- [x] **CQ.6.1e** Complete German native-language audit: 35 boards reviewed (P0=33, P1=2, P2=0)\r\n- [x] **CQ.6.1f** Add short reviewed Tabs to two German P1 boards (DE fallback boards 35 -> 33)\r\n- [x] **CQ.6.1g** Replace six approved German P0 boards one-for-one; active DE pool remains 500
- [x] **CQ.6.1h** Revise and independently approve two held German boards, then replace them one-for-one; active DE pool remains 500
- [x] **CQ.6.1i** Replace four independently reviewed German Wave 2 P0 boards one-for-one; active DE pool remains 500
- [x] **CQ.6.1j** Replace four independently reviewed German Wave 3 P0 boards one-for-one; active DE pool remains 500
- [x] **CQ.6.1k** Replace four independently reviewed German Wave 4 P0 boards one-for-one; active DE pool remains 500
- [x] **CQ.6.1l** Replace four independently reviewed German Wave 5 P0 boards one-for-one; active DE pool remains 500
- [x] **CQ.6.1m** Replace four independently reviewed German Wave 6 P0 boards one-for-one; active DE pool remains 500
- [x] **CQ.6.1n** Replace the final five audited German P0 boards one-for-one; active DE pool remains 500 and has no remaining Tabs fallback boards
- [x] **CQ.6.1o** Replace four independently reviewed Russian P0 boards one-for-one; active RU pool remains 500
- [x] **CQ.6.1p** Replace four independently reviewed Russian P0 boards one-for-one; active RU pool remains 500
- [x] **CQ.6.1q** Replace four independently reviewed Russian P0 boards one-for-one; active RU pool remains 500
- [x] **CQ.6.1r** Replace four independently reviewed Russian P0 boards one-for-one; active RU pool remains 500
- [x] **CQ.6.1s** Add a draft-to-active exact-group reference check to the content validator
- [x] **CQ.6.1t** Replace four independently reviewed Russian P0 boards one-for-one; active RU pool remains 500
- [x] **CQ.6.1u** Replace the final three independently reviewed Russian P0 boards one-for-one; active RU pool remains 500 and has no audited P0 candidates
- [x] **CQ.6.1v** Add independently reviewed thematic Tabs hints to eight Russian medium boards; keep ru-0465 on its clearer full-label fallback
- [x] **CQ.6.1w** Replace one independently reviewed English fairness failure with a full Tabs-ready medium board; active EN pool remains 500
- [x] **CQ.6.1x** Replace a second independently reviewed English fairness failure with a full Tabs-ready medium board; active EN pool remains 500
- [x] **CQ.6.1y** Add advisory draft-to-active 3-of-4 near-duplicate detection to the content validator
- [x] **CQ.6.1ab** Make draft-to-active group comparison conservatively plural-insensitive so Balloon/Balloons-style repeats are surfaced for review
- [x] **CQ.6.1z** Replace English puzzle-0129 one-for-one with an independently reviewed easy board; archive the specialist original and keep the EN pool at 500
- [x] **CQ.6.1aa** Replace English puzzle-0164 one-for-one with an independently reviewed easy board; archive the specialist plant-taxonomy original and keep the EN pool at 500
- [ ] **CQ.6.2** Replace the remaining 18 Medium/Hard boards classified as unsafe or unclear (17 EN, 1 RU) that fall back to full labels; review every changed board on a 390px phone layout before promotion
- [x] **CQ.6.2a** Rebuild or retire the remaining four English boards rejected during Tabs triage for factual, ontology, or specialist-knowledge failures: puzzle-0092, puzzle-0097, puzzle-0169, puzzle-0197. All four were independently reviewed, checked against the active pool, promoted one-for-one, and verified at 390px.
- [x] **CQ.6.2b** Replace four further English Medium fallback boards one-for-one (puzzle-0199, puzzle-0276, puzzle-0290, puzzle-0301); archive originals, independently review every replacement, eliminate reference collisions, and verify each at 390px. Also correct Wink to reveal the full category label as the product contract requires.
- [x] **CQ.6.2c** Replace three further independently reviewed English Medium fallback boards (puzzle-0255, puzzle-0316, puzzle-0325); archive originals, reference-check drafts, and add reproducible 390px E2E coverage. Hold puzzle-0317 for a full replacement because its draft failed editorial review.
- [x] **CQ.6.2d** Fully redesign and promote puzzle-0317 as At the Beach after rejecting the weak Library Day concept; archive the historical decade-classification board, independently approve the new board, and verify it at 390px.
- [x] **CQ.6.2e** Replace two further independently reviewed English fallback boards one-for-one: hard-024 / puzzle-0355 as Garden Shed and puzzle-0394 as Car Care; archive originals, reference-check drafts, and add reproducible 390px E2E coverage.

## Content quality review - COMPLETE (R9)

- [x] **CQ.1** Add repeatable cross-language logic audit for adult/young pairs, category overlap, and vague labels
- [x] **CQ.2** Human editorial review of the highest-risk English and Russian puzzles with keep/revise/reject decisions
- [x] **CQ.3** Revise or retire confirmed unfair puzzles; validate content and mobile readability before promotion
- [x] **CQ.4** Run a second worst-first EN/RU/DE editorial pass; retire all 12 confirmed unsafe boards
- [x] **CQ.5** Backfill active EN/RU/DE pools to exactly 500 each with 18 independently reviewed new boards

## PWA / Store readiness increment

- [x] **PWA.1** Add top-level standalone service worker and offline warm-cache shell
- [x] **PWA.2** Generate Apple 180 and PWA 192/512 raster install icons from the Foldwink mark
- [x] **PWA.3** Add standalone offline browser E2E coverage
- [x] **PWA.3a** Add browser-native, player-initiated install CTA with private coarse outcome measurement
- [ ] **PWA.4** Human install pass on iPhone and Android, including safe areas and homescreen launch
- [ ] **PWA.5** Capacitor Android closed test, then iOS TestFlight after web retention evidence

## Completed milestone - Sprint R4

- [x] **R4.1** Audit daily history, replay semantics, and retention placement
- [x] **R4.2** Implement the pure daily ritual: 7-day Daily Fold in Menu and Stats, restored full archive, and daily-only personal moment
- [x] **R4.3** Add focused unit coverage for daily ritual logic
- [x] **R4.4** Verify EN/DE/RU copy and visual QA at 320x700, 390x844, 430x932, and 1280x800
- [x] **R4.5** Replay-safe behavior, new E2E coverage, full gates, and sprint report

## Completed baseline

**Content scaling - COMPLETE. Active pools restored to 500 curated puzzles each (EN/RU/DE) after editorial remediation and validated backfill.**

- Active pools: EN 500 (275 easy, 191 medium, 34 hard); RU 500; DE 500. Exact language totals are a release invariant.
- Batch-15 (12 pz) promoted 2026-04-18: Nobel prizes, unsolved problems + 10 more
- Batches 11-15 ran without editorial reports (fast-track after batch-10 audit)
- **Content pipeline closed.** Focus shifts to pre-launch human QA and deploy.

## In progress

- [x] **R3.1** Audit sound assets, cue semantics, loudness, and all `useSound` call sites
- [x] **R3.2** Produce and integrate the tactile source pack
- [x] **R3.3** Verify low-latency playback, mobile audio unlock, and persistent mute
- [x] **R3.4** Build a clear audition page and document Suno/source provenance
- [x] **R3.5** Full gates, listening notes, and Sprint R3 report

## Completed milestone - Sprint R2

- [x] **R2.1** Visual-token, component-state, contrast, and colour-blind audit
- [x] **R2.2** Night Print Studio cards, Tabs, controls, solved stamps, and restrained 2.5D depth
- [x] **R2.3** New folded-corner mark, wordmark, Manrope typography, and graphite-paper texture
- [x] **R2.4** Rebuilt 1080 share card with Supporter stamp, 1200x630 OG, and 1080x1920 social asset
- [x] **R2.5** 320/390/430/1280 + iframe QA, full gates, clean E2E server shutdown, and sprint report

## Completed milestone - Sprint R1

- [x] **R1.1** Screen-specific responsive shell and larger 4x4 grid
- [x] **R1.2** Interactive first-run tutorial, separate from repeat help
- [x] **R1.3** Explicit full-size action for constrained mobile embeds
- [x] **R1.4** Responsive E2E coverage at 320, 390, 430, and 1280 px
- [x] **R1.5** Typecheck, unit, lint, validate, build, browser QA, and sprint report

## Next - before public free launch

### Monetization activation

- [ ] **M1** Fill public env/runtime config with the real Ko-fi handle and hosted checkout URL (human-only; see `docs/MONETIZATION.md`)
- [ ] **M2** End-to-end purchase-loop test on the canonical direct deploy: CTA -> checkout -> `?supporter=success` -> badge visible on the same origin
- [ ] **M3** Treat itch.io as optional discovery only; test its purchase return flow only if the channel is retained
- [ ] **M4** Rewarded-ad bonus remains deferred; prefer cosmetic-only reward surfaces over any active-puzzle advantage
- [ ] **M5** Observe the first real conversion/return flow in production and confirm thank-you + badge behavior
- [ ] See `R5.3` and `R5.4` above for the active web/native monetization boundary work

### Human-only tasks (cannot be automated)

- [ ] **H11** First human in-browser QA pass - phone + desktop against `docs/ITCH_QA_CHECKLIST.md`
- [ ] **S1** Physical audio ear pass - listen to all 9 cues on speakers + headphones. Use `tests/visual/sound-lab.html` or the redirect at `scripts/preview-sounds.html`.
- [ ] **S2** Final human share-card pass for loss, long localized copy, and native iOS share sheet. Visual harness: `tests/visual/share-card-preview.html`.
- [ ] **H12** Real iPhone/Android safe-area, browser-chrome, and native share-sheet check for the R4 daily ritual surfaces
- [x] **H2** Raster 1200x630 OG image generated from the real product language at `public/og.png`.
- [x] Designed folded-corner mark and Fold/wink lockup implemented across UI, share card, favicon, and social assets.
- [ ] Deploy the prepared Cloudflare Pages source to neural-void.com/foldwink after Wrangler re-authentication. The source now serves the current PWA at the canonical route; see docs/reports/FOLDWINK_PUBLIC_ROUTE_CORRECTION.md. As of 2026-10-29 neural-void.com/foldwink still serves a pre-W6 build, while GitHub Pages serves current `main`.

### Code-doable if time

- [x] Itch.io draft upload + in-iframe verification (superseded by the verified W7 `pilot-2026-09` and `html` channel uploads of 0.8.4)
- [x] Colour-blind/contrast audit: four light stamp colours retain dark ink plus distinct shape markers.
- [x] **A11** Local keyboard and semantic game-flow audit: fixed global Enter leaking into focused controls, arrow navigation stalling on solved cards, result-transition focus loss, and dialog return-focus loss; added browser regression coverage. Physical VoiceOver/TalkBack pass remains required.
- [ ] Screen-reader audit of game flow

## Queue - after public free

### Content (in flight - batches 03/04/05 merged 2026-04-17)

- [x] batch-03 -> 200 -> 221 (`docs/reports/FOLDWINK_CONTENT_BATCH_03_REPORT.md`)
- [x] batch-04 -> 221 -> 241 (`docs/reports/FOLDWINK_CONTENT_BATCH_04_REPORT.md`)
- [x] batch-05 -> 241 -> 265 (`docs/reports/FOLDWINK_CONTENT_BATCH_05_REPORT.md`)
- [x] batch-06 -> 265 -> 289 (`docs/reports/FOLDWINK_CONTENT_BATCH_06_REPORT.md`)
- [x] batch-07 -> 289 -> 314 (`docs/reports/FOLDWINK_CONTENT_BATCH_07_REPORT.md`)
- [x] batch-08 -> 314 -> 339 (`docs/reports/FOLDWINK_CONTENT_BATCH_08_REPORT.md`)
- [x] batch-09 -> 339 -> 364 (`docs/reports/FOLDWINK_CONTENT_BATCH_09_REPORT.md`)
- [x] batch-10 -> 364 -> 387 (`docs/reports/FOLDWINK_CONTENT_BATCH_10_REPORT.md`)
- [x] batch-11 -> 387 -> 412
- [x] batch-12 -> 412 -> 437
- [x] batch-13+14 -> 437 -> 487
- [x] batch-15 -> 487 -> 499 (2026-04-18)
- [x] More hard puzzles - target 50 exceeded: 100 Hard boards per language since the 2026-10-10 batch 96
- [ ] Editorial report per batch under `docs/reports/` (deferred - fast-track mode)

### Retention (1.1 candidates)

- [ ] Grade-based micro-achievements (local only)
- [ ] Daily calendar browser
- [x] Supporter perk: visible cosmetic stamp on the exported share card plus in-app badge.

### Audio

- [x] Swap synthesised cues for real recorded or generated paper / card / wood / tile samples; tracked in Sprint R3.

## Blocked

(none)

## Deferred past 1.0 (red-flagged by scope-keeper)

- Paid puzzle packs (supporter unlock + tip jar + opt-in rewarded ad are allowed since v0.9.0; core gameplay still stays free)
- Ad SDK wiring (adapter exists in `src/monetization/ads.ts`; defer until sustained DAU)
- Network analytics without an explicit privacy surface
- Accounts, leaderboards, cloud sync
- New twist mechanics beyond Tabs + Wink
- Full 3D / motion framework
- Pool beyond 500 without explicit editorial throughput evidence

---

## Shipping facts - 0.8.2 / R10 complete

|                    |                                                                                    |
| ------------------ | ---------------------------------------------------------------------------------- |
| Version            | 0.8.2                                                                              |
| Automated coverage | 178/178 unit tests across 23 files; 60/60 production browser E2E scenarios         |
| Current library    | Active pools: EN 500, RU 500, DE 500; retired records remain archived with reasons |
| Main bundle        | 437.52 kB JS / 103.80 kB gzip; 36.35 kB CSS / 10.05 kB gzip                        |
| Audio pack         | 9 local WAV cues / 278796 bytes                                                    |
| Responsive QA      | Automated: 320x700, 390x844, 430x932, 1280x800; physical-device pass pending       |
| Content validation | Structural validation passes in EN/RU/DE; warning taxonomy needs R10.4 cleanup     |
| Canonical product  | https://neural-void.com/foldwink/ direct web/PWA first; itch.io optional           |
| Platform decision  | Canonical web/PWA now; Capacitor store shells staged later, not a native rewrite   |
