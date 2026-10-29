# Foldwink v0.8.2 — аудит реализации, usability и коммерческого потенциала

Дата: 12.06.2026 · Метод: 3 параллельных read-only аудит-агента (реализация / usability / коммерция) + прогон гейтов + adversarial cross-review GPT (gpt-5.5 via Codex CLI, 12.06.2026) · Исправления применены в этой же сессии.

---

## 1. Резюме

| Ось | Оценка | Одной строкой |
|---|---|---|
| Реализация | **A−** | Чистый pure-engine + Zustand, 143 теста, 3 runtime-зависимости; долг был только в новом монетизационном коде — закрыт |
| Usability | **B+ → A−** | Многоканальный фидбек, полные EN/DE/RU, доступность на месте; единственный HIGH-баг (onboarding на 320px) исправлен |
| Коммерческий потенциал | **3/10 → 5/10** | Монетизация была мёртвым кодом — теперь интегрируема; но коммерчески оживёт только после заполнения конфига и проверенного purchase loop на itch |

Главный вывод: **продукт готов технически, но не операционно.** Код больше не блокер. Блокеры — человеческие шаги: завести Ko-fi + Stripe Payment Link, заполнить `src/monetization/config.ts`, прогнать покупку end-to-end на реальном itch-эмбеде.

---

## 2. Реализация

**Сильное:** слои чистые (engine → store → UI без протечек игровой логики), persistence через узкие observers, i18n с code-split DE/RU и top-level await, ноль TODO/FIXME, ноль прямых `new Audio()`, соответствие CLAUDE.md-стандартам.

**Найдено и исправлено в этой сессии:**

| Проблема | Severity | Фикс |
|---|---|---|
| `consumeSupporterReturnUrl()` нигде не вызывался — supporter unlock не работал в принципе | CRITICAL | вызов при буте в `src/main.tsx` |
| `SupporterBadge` не подключён ни к одному экрану | CRITICAL | отрендерен на `StatsScreen` |
| CTA-строки монетизации захардкожены по-английски | HIGH | секция `monetization` в `i18n/strings.ts`, EN/DE/RU |
| 0 тестов на монетизационный код | HIGH | +10 тестов: supporter-флоу (5) и атрибуция (5) |
| Главный JS-чанк 856 kB (EN-пул в app-чанке) | MEDIUM | `puzzles-en` manualChunk → app-чанк **401 kB (gzip 244→91 kB)** |
| 3 lint-ошибки (iframeFullscreen, 2 debug-скрипта) | LOW | исправлены |
| `docs/MONETIZATION.md` упомянут в config.ts, но не существовал | MEDIUM | создан (operator guide: Ko-fi, Stripe, ad SDK bridge, kill switch) |

**Оставлено сознательно:** `clearSupporter()` без call-site (API для будущего reset-флоу), ternary в `SupporterUnlockCta` (union-тип уже типобезопасен), тесты UI-компонентов (вне Vitest-node-стека проекта).

**Гейты после фиксов:** typecheck ✓ · **143/143 теста** ✓ · validate 500 пазлов ✓ · lint ✓ · build ✓ (предупреждение о чанке >500 kB ушло).

## 3. Usability

**Сильное:** фидбек по четырём каналам (визуал + звук + haptics + aria, «one away» с amber-ring и удлинённым показом), arrow-key навигация по гриду, shape-маркеры для дальтоников, safe-area + `100dvh`, тач-таргеты ≥45px, полные переводы EN/DE/RU, share-флоу с тройным fallback (share API → clipboard → download), countdown + streak как daily-ритуал.

**Исправлено:** onboarding-модалка обрезала кнопку «Got it» на 320px (iPhone SE) — добавлен `max-h-full overflow-y-auto`; `docs/KNOWN_LIMITATIONS.md` ложно утверждал, что arrow-key навигации нет — запись исправлена (код проверен лично).

**Принятые минусы (low):** Wink в onboarding объяснён текстом без демо; quit через double-tap; архив дневных ограничен 30 записями; truncate лейблов Tabs на узких экранах. Всё задокументировано, к 1.0 не блокирует.

## 4. Коммерческий потенциал

**Воронка end-to-end:** TikTok batch_01 (13 видео, UTM, расписание) → itch.io — готово. Дальше обрывалось: монетизационный слой был мёртвым кодом, UTM-параметры фронт не сохранял, конверсию измерить нечем.

**Сделано в этой сессии (помимо оживления supporter-флоу):**
- `src/monetization/attribution.ts` — first-touch `utm_*` в localStorage (локально, без сети); при клике на монетизационную ссылку добавляется компактный тег: `?ref=` для Ko-fi, `?client_reference_id=` для Stripe → дашборд провайдера отвечает «с какого TikTok-видео покупка» без какой-либо аналитики в игре.
- Ограничение задокументировано: itch-iframe не наследует query верхней страницы → атрибуция работает на standalone-деплое и прямых ссылках; itch-трафик — один агрегатный bucket.

**GPT cross-review (gpt-5.5, 12.06.2026) — интегрированные возражения:**
1. **Принято, риск #1:** «монетизация не ожила, а стала интегрируемой». Purchase loop не проверен end-to-end; success-redirect Stripe откроется на top-странице, не в iframe → на itch флаг может лечь на чужой origin и игрок не увидит бейдж. До проверки канал на itch «коммерчески не существует». → TODO **M2/M3** + секция Known risk в MONETIZATION.md.
2. **Принято:** «bonus Wink за рекламу» помогает в активном пазле и граничит с pay-to-win; до подключения ad SDK заменить награду на косметику. → TODO **M4**.
3. **Принято:** лучший первый supporter-перк — рамка/тема share-карты + бейдж на ней: косметика, усиливающая ту же TikTok-петлю. → TODO retention 1.1.
4. **Принято частично:** UTM-капчур «для ручной атрибуции, не для аналитики» — реализован именно как прокидывание ref в outbound-ссылки.
5. Оценка конверсии в supporter при чисто косметическом перке <0.5% — GPT счёл правдоподобной, но не фатальной при добавлении перков из п.3.

**Неподтверждённые утверждения агентов (проверено, отброшено):** «в пуле 669 пазлов, itch-копия врёт» — в `puzzles/pool/` ровно 500 файлов, валидатор подтверждает 500, itch-копия точна.

## 5. Изменённые файлы

`src/main.tsx` · `src/screens/StatsScreen.tsx` · `src/components/{TipJarLink,SupporterUnlockCta,SupporterBadge,Onboarding}.tsx` · `src/i18n/strings.ts` · `src/monetization/attribution.ts` (new) · `src/monetization/__tests__/{supporter,attribution}.test.ts` (new) · `src/utils/iframeFullscreen.ts` · `vite.config.ts` · `scripts/debug-{standalone,ghpages}.mjs` · `docs/MONETIZATION.md` (new) · `docs/KNOWN_LIMITATIONS.md` · `docs/TODO.md`

## 6. Next steps (приоритет — синтез аудита и GPT)

1. **M1 (human):** Ko-fi + Stripe Payment Link → заполнить `src/monetization/config.ts` (15 мин по `docs/MONETIZATION.md`).
2. **M2 (human):** end-to-end purchase loop на реальном itch-эмбеде — до этого не обещать бейдж itch-игрокам.
3. **H11/S1/S2:** human QA на устройствах (без изменений из старого TODO).
4. 1.1: supporter-перк «share-card frame + badge».
5. Rewarded ads — только после устойчивого DAU и с косметической наградой вместо бонус-Wink.

## 7. Открытые риски

- Supporter unlock на itch не подтверждён (M2) — главный коммерческий риск.
- Конверсия при чисто косметическом перке будет низкой до появления share-card-перка.
- Атрибуция слепа внутри itch-iframe — качество TikTok-трафика будет видно только по standalone-ссылкам и агрегатам itch-аналитики.
- Изменения не закоммичены (в репозитории много несвязанных незакоммиченных файлов batch-подготовки TikTok — коммит аудита стоит делать отдельно от них).
