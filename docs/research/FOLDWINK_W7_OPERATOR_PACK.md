# Foldwink W7 Pilot Operator Pack

Use with `FOLDWINK_W7_PILOT_PROTOCOL.md`. This document is an operational template, not participant evidence. Open `docs/research/FOLDWINK_W7_OPERATOR_FORM.html` locally for the safest data-entry path; it sends and stores nothing, fixes the pilot build identity, computes return dates and downloads only locally validated JSON. The CLI validator remains authoritative. The raw example is `docs/research/templates/foldwink-w7-observation.example.json`. Store completed copies only in the researcher's access-controlled `pilot-data/` workspace, which is git-ignored. Never enter the external study code into Foldwink, its URL, localStorage or app export.

## Current pilot constants — build 0.8.5

- Pilot URL: `https://vladimirevseevpro-collab.github.io/foldwink/pilot/0.8.5/`
- Invited first-entry URL: `https://vladimirevseevpro-collab.github.io/foldwink/pilot/0.8.5/?utm_medium=research_invite`
- Channel token for records: `pages:pilot-0.8.5` (GitHub Pages; frozen tree `pilot/0.8.5/` in the repository)
- Source commit: `c874de79d9e75c4011295a325216594ac2cdda14` (clean); manifest `pilot/0.8.5.manifest.json`
- Tree SHA-256: `d91e97fe42d65532cb9a067bc6f851f2e9f1ef19db0b8810ade61f5850a47567` (146 files, 5,477,890 bytes)
- Version tuple: app `0.8.5`; content `catalog-2026-09-v1`; Daily `daily-2026-10-14-2026-12-12-v1` + `daily-2026-12-13-2027-02-10-v1`; events `ops-06-v1`; privacy `privacy-v1`; balance `balance-2026-09-v1`
- Daily horizon of this build: **2027-02-10**. Recruit so that every D7 window closes by then.
- Evidence: `docs/release-evidence/0.8.5-w7-pilot/README.md`
- Physical smoke: iOS Safari/PWA and Android Chrome/PWA are still open on this URL.

Send participants only the invited first-entry URL. The main app at `…/foldwink/` shares this origin and therefore local storage; do not point participants at it during their window, and do not ship storage-schema changes to main while a cohort is open. Do not modify the build, rules, copy, manifests or balance configuration after participant 001 without closing the baseline cohort and versioning the change.

Builds `0.8.3` and `0.8.4` (itch.io channel `pilot-2026-09`) are superseded and recruited nobody. Do not use their URLs or mix any of their exports into the `0.8.5` cohort.

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
- Tree SHA-256:
- Pilot URL:
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
