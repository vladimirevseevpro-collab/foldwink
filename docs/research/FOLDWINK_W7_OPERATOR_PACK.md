# Foldwink W7 Pilot Operator Pack

Use with `FOLDWINK_W7_PILOT_PROTOCOL.md`. This document is an operational template, not participant evidence. Open `docs/research/FOLDWINK_W7_OPERATOR_FORM.html` locally for the safest data-entry path; it sends and stores nothing, fixes the pilot build identity, computes return dates and downloads only locally validated JSON. The CLI validator remains authoritative. The raw example is `docs/research/templates/foldwink-w7-observation.example.json`. Store completed copies only in the researcher's access-controlled `pilot-data/` workspace, which is git-ignored. Never enter the external study code into Foldwink, its URL, localStorage or app export.

## Current pilot constants — build 0.8.4

- Public listing: `https://neural-void.itch.io/foldwink`
- Exact playable URL: `https://html.itch.zone/html/19242763-1984826/index.html`
- Invited first-entry URL: `https://html.itch.zone/html/19242763-1984826/index.html?utm_medium=research_invite`
- itch upload/build: `#19242763` / `#1984826`; channel `pilot-2026-09`
- Deployment: 2026-09-16 12:02 Europe/Berlin; external staging verification: 12:04
- Artifact: `foldwink-itch-upload-v0.8.4-2026-09-16.zip`
- Artifact SHA-256: `b9e5dde25558e27dc9f846f28e8ad4b9dbb0d134136e2efa2bb8c9d7cf7fc645`
- Dist tree SHA-256: `b41e3ce52dd56f28e96719a6e4872bc7701e6305cbfe270a5e8f02bdd64eb385`
- Version tuple: app `0.8.4`; content `catalog-2026-09-v1`; Daily `daily-2026-09-14-2026-10-13-v1`; events `ops-06-v1`; privacy `privacy-v1`; balance `balance-2026-09-v1`
- Physical smoke: Windows Chrome `152.0.7977.84` passes on exact `0.8.4/#1984826`; iOS Safari/PWA and Android Chrome/PWA are still open.

Use the direct tagged URL for invited attribution: itch does not guarantee that a query parameter on the outer listing is forwarded into its game iframe. Do not modify the build, rules, copy, manifests or balance configuration after participant 001 without closing the baseline cohort and versioning the change.

Build `0.8.3` / `#1981655` was superseded before participant 001 because its runtime research export incorrectly reported app version `0.8.2`. Do not use that URL or mix its exports into the `0.8.4` cohort.

## Neutral recruitment message

### English

> We are testing a short browser-based grouping puzzle. The session takes about 15–20 minutes, followed by an optional return over the next week. We are evaluating the game, not you; no puzzle knowledge is expected. Participation and the anonymous local report are voluntary, and you can stop at any time. Please do not join if you helped create or validate the puzzles or already know their answers.

### Русский

> Мы тестируем короткую браузерную игру на поиск смысловых групп. Первая сессия занимает около 15–20 минут; затем можно добровольно вернуться к игре в течение недели. Мы проверяем игру, а не вас: специальных знаний не требуется. Участие и передача анонимного локального отчёта добровольны, остановиться можно в любой момент. Пожалуйста, не участвуйте, если вы создавали или проверяли эти задачи либо уже знаете ответы.

### Deutsch

> Wir testen ein kurzes browserbasiertes Gruppierungsrätsel. Die erste Sitzung dauert etwa 15–20 Minuten; danach ist eine freiwillige Rückkehr innerhalb einer Woche möglich. Wir testen das Spiel, nicht Sie; besonderes Wissen ist nicht erforderlich. Teilnahme und die Übergabe des anonymen lokalen Berichts sind freiwillig, und Sie können jederzeit abbrechen. Bitte nehmen Sie nicht teil, wenn Sie die Rätsel erstellt oder geprüft haben oder die Lösungen bereits kennen.

## Pre-session freeze record

- External study code:
- Consent recorded externally: yes / no
- Artifact SHA-256:
- Staging URL:
- Deployment timestamp and timezone:
- App / content / daily / event / privacy / balance versions:
- Locale: EN / RU / DE
- Device class: phone / tablet / desktop
- OS and browser family/version:
- Launch mode: browser tab / installed PWA
- Input: touch / mouse / keyboard / mixed
- Accessibility setting requested: none / reduced motion / keyboard-only / other coarse category
- Puzzle frequency: never / monthly / weekly / several times weekly
- Acquisition: organic / invited
- If invited, exact tagged-link marker present: yes / no

Do not record name, email, IP, advertising ID, exact age, precise location, disability details or any credential.

## First-session observation

Record raw facts before interpreting them:

- Recruited → consented → app opened → first session started → usable observation → export offered → export provided: yes/no for each step.
- Onboarding: started / completed both steps / skipped.
- First meaningful gameplay action without coaching: yes/no.
- Core loop explanation before coaching: correct / partial / incorrect.
- First group solved without answer-level help: yes/no.
- Time to first group: under 1m / 1–3m / 3–5m / over 5m / not solved.
- First attempt: win / loss / abandon.
- Mistakes used: 0 / 1 / 2 / 3 / 4 / not terminal.
- Facilitator interventions: count; classify only as navigation / rule clarification / answer-level help / technical recovery.
- Result reached: yes/no.
- Retry distinction explained correctly: yes / partial / no / not asked.
- Retry after loss: started yes/no; terminal result win/loss/abandon.
- Different-board action available: yes/no; voluntarily started yes/no; previous result win/loss.
- Wink shown: yes/no; explained before coaching correct / partial / incorrect / not asked; used yes/no.
- Share started: yes/no; completed / cancelled / failed / not started.
- Ambiguity concern: none / knowledge gap / wording friction / plausible competing answer / confirmed competing answer.
- If a concern exists: board ID, content version, affected group, de-identified paraphrase, severity P0–P3, independent validator status.
- Voluntary export: declined / provided / invalid and rejected / valid.
- Export locale/content/consent fields match the session: yes/no.
- Forbidden-field inspection passed: yes/no.

Never count an E2E run, bot solve, facilitator demonstration or puzzle author as a participant observation.

## Return sheet

Use the participant's D0 local calendar day. A window enters the denominator only after the entire target local day has elapsed.

- D0 qualified session recorded: yes/no. If no, leave D0/D1/D7 dates and return outcomes empty; the participant remains in the recruitment/session flow but is not part of a retention cohort.
- D0 local date: record only after a qualified D0 session.

| Window | Exact target day | Window complete | Qualified return | Organic | Invited | Export received |
| ------ | ---------------- | --------------- | ---------------- | ------- | ------- | --------------- |
| D1     | D0 + 1           | yes/no          | yes/no           | yes/no  | yes/no  | yes/no          |
| D7     | D0 + 7           | yes/no          | yes/no           | yes/no  | yes/no  | yes/no          |

Do not convert a scheduled appointment, direct reminder or facilitator message into an organic return.

## Aggregation procedure

1. Place only participant-triggered Foldwink JSON exports in a dedicated input directory.
2. Run `npm run pilot:summarize -- <directory>`.
3. The export summarizer preserves valid files while rejecting malformed, privacy-unsafe or denominator-inconsistent neighbours. Preserve every rejection and never edit the participant's original file.
4. Identical minimized exports are quarantined and excluded from N until the researcher resolves them against the external roster. They may represent two real people, but counting both automatically is unsafe.
5. Create one external observation JSON per consented participant from the example template. Record only the assigned `P000` study code and de-identified categories; never add identity/contact data.
6. Prefer the offline operator form and press **Validate record** before **Download JSON**. It does not autosave and does not replace the external roster. Its `Qualified D0` control keeps recruited non-starters out of D1/D7 and refuses to close a return window before the target local day has fully elapsed. Run `npm run pilot:verify-operator-form` after changing the form.
7. Run `npm run pilot:summarize-observations -- <pilot-data/directory>`. Duplicate study codes, wrong build tuples, PII-like values, impossible flow transitions and premature D1/D7 results are rejected per file without discarding valid records.
8. The observation summary is authoritative for recruited/consented/session/export flow and D1/D7 roster denominators. The app export summary supplies local coarse event and board-feedback evidence; join them only in the access-controlled external workspace.
9. Report every percentage with numerator/denominator plus locale, app/content/policy/balance version, consent and organic/invited split.
10. Publish incomplete windows and excluded observations; do not treat missing exports as zero returns without the roster denominator.

## Go / No-Go after baseline sessions

- Pause immediately for privacy leakage, data loss, crash, wrong-board resolution or a confirmed competing answer.
- A first-starter win below 75%, first-group success below 80%, onboarding completion below 85%, voluntary-next below 35% or share completion below 70% is a diagnostic flag, not an automatic release verdict.
- Do not tune a board or UI inside the baseline cohort. Version the change and retest with participants who did not see the previous answer.
- W7 remains NO-GO until the seven-day windows close and all P0/P1 comprehension/fairness issues are resolved and retested.
