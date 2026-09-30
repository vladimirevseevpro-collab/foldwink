# Foldwink W7 Human Balance and Return Pilot Protocol

Protocol version: 1.0  
Date: 2026-09-14  
Scope: FW-032–FW-035 / GAME-14 / OPS-06  
Status: ready for instrumented-build verification; recruitment and observation have not started.

## 1. Purpose

This pilot answers four questions that automated tests cannot answer:

1. Can a new player explain and perform the select-four → Submit → lock-group loop without coaching?
2. Do the starter, Daily and early Medium boards feel fair rather than arbitrary?
3. After a result, is Retry versus another puzzle clear, and does the player voluntarily continue?
4. Does a player voluntarily return on local day +1 or +7 when no compulsory reminder is used?

The pilot is diagnostic, not an A/B test and not a statistically powered retention study. Bot solves, scripted E2E runs and the content validator are engineering evidence only and must never be entered as human observations.

## 2. Frozen build and change control

Before participant 001 starts, record:

- exact Git commit and whether the worktree was clean;
- staging URL and deployment time;
- app version, content version, calendar version, event-schema version and balance-policy version;
- enabled languages and exact starter/Daily manifests;
- device/browser matrix actually available;
- checksum or immutable artifact identity used for every participant.

No product, rules, copy, board or balance-policy change is allowed inside one baseline cohort. A release-critical privacy, data-loss, crash or demonstrably ambiguous-answer defect pauses recruitment. Record the defect, freeze the affected data, deploy a new version and start a separately labelled validation cohort; never merge the two versions into one denominator.

## 3. Recommended cohort

Target 26 completed first sessions, inside the required 20–30 range:

| Locale | Target | Minimum usable | Notes                                                           |
| ------ | -----: | -------------: | --------------------------------------------------------------- |
| EN     |     14 |             10 | First and largest diagnostic slice                              |
| RU     |      6 |              4 | Native/proficient Russian; never reuse EN comprehension results |
| DE     |      6 |              4 | Native/proficient German; never reuse EN comprehension results  |

Recruit adults who can independently use a phone or desktop browser and who play word, trivia or casual puzzle games from never to several times per week. Exclude the puzzle authors, independent validators and anyone who has seen the answers. Record only coarse recruitment bands: locale, device class, puzzle-frequency band and invited/organic acquisition. Do not store name, email, IP address, exact age, precise location or advertising identifier in Foldwink data.

Recommended device coverage across the full cohort:

- at least 12 mobile sessions, split across iOS Safari/PWA and Android Chrome/PWA where devices are available;
- at least 6 desktop sessions;
- at least 3 keyboard-only walkthroughs;
- at least 2 sessions with reduced motion or another participant-requested accessibility setting.

Missing device/accessibility coverage remains an explicit limitation; do not invent it from emulation.

## 4. Consent and participant handling

Use an external study roster controlled by the researcher. Assign a random study code such as `P017`; the code is never generated or stored by Foldwink and is added by the researcher only after the participant voluntarily hands over an export.

Before the session, explain:

- gameplay works without analytics consent;
- local coarse counters and local-date return observations stay on the device;
- external analytics is off by default and is never required for the study;
- the optional pilot JSON export contains coarse gameplay summaries and, only when recorded, board identifiers for ambiguity review;
- the export contains no words, free-text feedback, answer trace, attempt ID, seed, raw profile, exact timestamp or participant identifier;
- the participant may decline export or withdraw future observation without losing game access.

If the participant declines export, retain only the researcher's anonymous observation sheet with their permission. Never enable external analytics merely to simplify study collection.

## 5. Session script

The facilitator reads only the neutral prompts below. Do not teach the answer or interpret Foldwink Tabs before the comprehension question.

1. Open the frozen build on a fresh profile. Say: “Please use this as you would a new small puzzle game. Think aloud when comfortable.”
2. Observe first screen orientation. Record whether the participant can state what the main action is.
3. Start onboarding. Record `started`, every independently completed step, Skip if used and any facilitator intervention.
4. Let the participant start the assigned starter board. Record first-group success, foreground time to first correct group, mistakes before it and abandon if applicable.
5. Finish or abandon the first board without giving answers. Record first-attempt terminal outcome separately from any retry.
6. If Medium/Tabs is shown, ask: “What do you think these letters do? What would happen if you tapped one?” Record the answer as understood / partly understood / not understood before any explanation. Wink usage alone is not comprehension.
7. On Result ask: “What would Retry do? What would the other-puzzle action do?” Record whether the distinction is correct.
8. Do not suggest the primary CTA. Record whether the participant starts a different board, retries, opens Share, returns to Menu or stops.
9. After a loss, ask whether any connection felt disputable. If yes, use the binary in-app flag and write a separate de-identified researcher note containing board/version, claimed alternative and whether it is knowledge-gap, wording friction or a valid competing answer.
10. Return to Menu. Ask the participant to distinguish Daily and Practice and locate their progress/collection.
11. Offer the voluntary anonymous pilot export. The participant initiates the download; the researcher verifies the preview/file contains no forbidden fields.

The facilitator records every intervention. A solve after an answer hint is excluded from first-group and first-board success numerators but remains in the intervention count and qualitative issue list.

## 6. Qualified sessions and return observation

A qualified session is a foreground visit in which the player reaches Menu and performs at least one meaningful gameplay action: starts an attempt, resumes an attempt, submits a quartet or views a committed Result. App opens that never reach Menu/gameplay do not qualify.

- `D0` is the local calendar date of the first qualified session.
- `D1` is a qualified session on exactly local date `D0 + 1`.
- `D7` is a qualified session on exactly local date `D0 + 7`.
- A participant enters the D1 denominator only after the full D1 date is available; D7 only after the full D7 date is available.
- Record local date only, never a precise timestamp in the pilot export.
- A visit caused by a scheduled study appointment, direct reminder or facilitator message is `invited`; an unprompted visit is `organic`.
- Report organic and invited returns separately. Never relabel an invited visit as retention.

For instrumented study links, use the exact query marker `utm_medium=research_invite` on first entry. No other campaign/source value is interpreted as invited. The external roster and observation sheet remain authoritative when a participant was invited through an untagged channel.

Recommended observation design: do not remind the organic group during the seven-day window. If operational follow-up is necessary, place those participants in a separate invited stratum before observation begins.

## 7. Metric definitions

| Metric                | Numerator                                  | Denominator                                | Required breakdown                                  |
| --------------------- | ------------------------------------------ | ------------------------------------------ | --------------------------------------------------- |
| Onboarding completion | completed both actions                     | onboarding started                         | locale, Skip separate                               |
| First-group success   | independently solved first group           | first starter attempts started             | locale, board/version; abandon visible              |
| First-group time      | foreground duration to first correct group | successful measured observations           | median, p75, N; abandon separate                    |
| First-board win       | first-attempt wins                         | first-attempt terminal outcomes            | starts and abandons alongside rate                  |
| Retry recovery        | retry wins                                 | retries started after loss                 | locale, board/version                               |
| Voluntary next        | different-board starts                     | Results with a next option shown           | win/loss separate; retry separate                   |
| Wink understanding    | correct explanation before coaching        | participants shown Wink                    | locale; usage reported separately                   |
| Ambiguity signal      | independent substantiated complaints       | participants exposed to that board/version | knowledge gap vs wording vs competing answer        |
| Share completion      | completed native share/copy/download       | share flows started                        | cancellation and failure separate                   |
| D1 / D7               | qualified returns on exact target date     | cohort members with complete windows       | locale/version/consent and organic/invited separate |

Starting diagnostic flags, not release promises:

- first starter win below 75%: inspect onboarding, ordering and board fairness;
- first starter win above 90%: acceptable unless interviews report boredom or obviousness;
- median first-group time outside 20–45 seconds: inspect comprehension and difficulty, not player speed as a score;
- voluntary different-board next below 50% after first win: inspect Result hierarchy and satisfaction;
- any reproducible alternative valid grouping: immediate independent editorial review;
- the same blocking misunderstanding in two independent participants: P1 UX/content issue even if aggregate success looks acceptable.

Small-N percentages are always printed with raw numerator/denominator and confidence limitations. No single target alone decides release.

## 8. Issue classification and repair loop

| Severity | Definition                                                                        | Action                                                                                                 |
| -------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| P0       | privacy/data loss, inaccessible core path, crash, impossible published board      | pause affected cohort and fix before continuing                                                        |
| P1       | reproducible rule misunderstanding, valid competing answer, first-session blocker | create evidence-backed issue; repair affected board/config/UI; independent review and repeat usability |
| P2       | repeated friction, unclear secondary action, localized copy problem               | queue targeted correction; recheck in validation cohort                                                |
| P3       | preference or one-off suggestion without reproduced harm                          | record; do not expand scope during baseline                                                            |

FW-034 changes only an evidenced board, configuration value or UI surface. Every changed puzzle keeps its original evidence, receives a new content version where required, passes structural validation and an independent puzzle-validator review, then is retested with participants who did not see the old answer.

## 9. Required outputs

1. Frozen-build record and participant flow count: recruited → consented → first session started → usable observation → export provided → D1 eligible → D7 eligible.
2. Metric table with numerator, denominator, locale, build/content version and invited/organic split.
   Aggregate participant-triggered app exports with `npm run pilot:summarize -- <directory>`. Identical minimized payloads are quarantined and excluded until resolved against the external roster: two anonymous participants can legitimately match, but automatic double-counting is unsafe. Aggregate strict external observation records with `npm run pilot:summarize-observations -- <pilot-data/directory>`; this supplies participant flow, device mix, behavioral numerators/denominators and closed D1/D7 roster windows.
3. De-identified issue list with board/version, severity, frequency/denominator, observation summary, chosen change and retest status.
4. Export privacy inspection: allowed fields, forbidden-field scan and denied/revoked/offline network log.
5. W7 sprint report stating what is known, unknown and limited by N/device mix.
6. Go/No-Go: W7 cannot pass while critical ambiguity/rule issues remain or while the seven-day window is incomplete.

## 10. Operator checklist

- [x] Freeze exact `0.8.4` artifact, staging URL and version tuple; both channel fetches and external browser delivery match. The staging suite also downloads the live consent-safe export and proves app/content version parity in EN/RU/DE. W7 explicitly accepts the immutable artifact identity while clean source provenance remains a W8 gate. Superseded `0.8.3` must not be used because its export version drift was found before participant 001.
- [ ] Complete physical iOS Safari/PWA and Android Chrome/PWA smoke against build `#1984826`; exact-build Windows Chrome `152.0.7977.84` public-iframe smoke passes with RU correct-group flow, EN/DE/RU localization and zero console errors.
- [ ] Verify FW-032 unit/E2E/privacy/visual gates on that build.
- [ ] Obtain participant consent; assign external study code only in the roster.
- [ ] Run the neutral first-session script and record interventions.
- [ ] Collect export only through the participant-triggered action.
- [ ] Inspect export for forbidden identifiers/content before aggregation.
- [ ] Keep EN/RU/DE and organic/invited denominators separate.
- [ ] Complete D1 and D7 windows before computing those rates.
- [ ] Send confirmed ambiguity changes through independent puzzle validation.
- [ ] Publish raw counts with every percentage and list all missing evidence.
