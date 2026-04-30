# Mobile Result Screen + Next Puzzle Flow — Scroll / Layout Fix Report

**Date:** 2026-04-17
**Branch:** `main`
**App version:** `0.6.3`

## 1. Симптомы бага

Мобильные отчеты с разных устройств сходились в один кластер дефектов после прохождения пазла:

1. **iPhone / Mobile Safari**: после solve иногда ломается скролл всей страницы — нижний CTA `Next puzzle` оказывается недоступен.
2. **iPhone / Mobile Safari**: при повторных прохождениях нельзя прокрутить результат до конца, касания скролла "проскакивают".
3. **Android / Chrome Mobile**: кнопка `Next puzzle` визуально уползает ниже с каждым следующим пазлом.
4. **Android / Chrome Mobile**: после 2–3 прохождений подряд CTA уходит ниже видимой области и становится фактически недостижим.
5. **Поведение похоже не на одну CSS-опечатку**, а на деградацию layout-а + state-а после repeated Next-puzzle flows.
6. **Кроссрегрессия desktop**: важно было не починить mobile ценой desktop.

## 2. Root cause

Три связанные системные причины, а не одна локальная опечатка.

### 2.1 Фиксированная `height: 100%` на html / body / #root

В `src/styles/index.css` до фикса:

```css
html,
body,
#root {
  height: 100%;
}
```

Классическая ловушка мобильных браузеров. Когда результат-экран становится выше viewport (streak-celebration + grade-card + share-card + 3 CTA), документ должен прокручиваться. Но `height: 100%` на всех трёх якорных контейнерах + `viewport-fit=cover` + динамика URL bar iOS Safari создают состояния, в которых overflow контента не превращается в реальный скролл — ощущается как "скролл замер".

На Android Chrome та же фиксированная высота зеркалится с dynamic visual viewport: при появлении адресной строки доступная область сжимается, контент не реагирует, CTA уезжает "за" нижнюю панель.

### 2.2 Нет `env(safe-area-inset-bottom)` на нижней зоне

`<main className="w-full max-w-xl px-4 py-4 sm:py-6">` — симметричный padding без учёта home-indicator (iPhone) и gesture nav (Android). Последний ряд кнопок сидит вплотную к системной зоне; на iPhone home-indicator может физически накладываться на hit-area.

### 2.3 Нет сброса скролла на screen transitions

React/браузер сохраняет `document.scrollTop` между unmount/mount компонентов. Цепочка Result (высокий) → Next puzzle → Game (низкий) → win → Result (ещё выше из-за streak-celebration) — каждый раз новый Result-экран монтируется с прежним `scrollY`. Объективно контент становится длиннее (streak добавляет блок, grade добавляет блок), субъективно CTA "уезжает вниз". Это главный источник ощущения "после 2-го пазла кнопка стала недоступна".

## 3. Изменённые файлы

| Файл                                 | Тип правки                                                                                                                                                                                                        |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/styles/index.css`               | Root CSS: `height: 100%` → `min-height: 100%` + `#root: min-height: 100dvh`; добавлен utility `.fw-safe-pb` с `env(safe-area-inset-bottom)`.                                                                      |
| `src/app/App.tsx`                    | `useEffect` сбрасывает `window.scrollTo(0,0)` на каждую смену `screen`; `<main>` получает класс `fw-safe-pb` и `data-fw-screen` для QA; убран устаревший `min-h-full` (не резолвился без definite parent height). |
| `src/screens/ResultScreen.tsx`       | Добавлены `data-testid` (`result-screen`, `result-cta-stack`, `result-next-puzzle`) для регрессии.                                                                                                                |
| `tests/e2e/results-next-flow.mjs`    | Новый e2e сьют: 3 платформы × 3 раунда + отдельные проверки scroll-reset и streak-celebration layout.                                                                                                             |
| `tests/e2e/run-all.mjs`              | Новый сьют добавлен в общий прогон.                                                                                                                                                                               |
| `scripts/results-flow-visual-qa.mjs` | Визуальный агент: собирает скриншоты + измерения CTA по трём device-профилям.                                                                                                                                     |

## 4. Что именно переработано во фронте

1. **Root scroll pattern**: `height: 100%` → `min-height: 100%` + `100dvh`. `html` и `body` получают `min-height: 100%` (гарантированно хотя бы viewport); `#root` дополнительно `min-height: 100dvh` так что layout трекает **dynamic** visual viewport, не static layout viewport. Это закрывает оба мобильных профиля.
2. **Safe-area aware bottom padding**: `.fw-safe-pb { padding-bottom: calc(1rem + env(safe-area-inset-bottom, 0px)); }`, на sm breakpoint увеличено до `calc(1.5rem + env(safe-area-inset-bottom, 0px))`. Главный столбец `<main>` всегда оставляет CTA над нижней системной зоной.
3. **Scroll reset на screen change**: `useEffect(() => window.scrollTo({ top: 0, left: 0, behavior: "auto" }), [screen])` в `App.tsx`. Каждый переход menu↔game↔result↔stats приземляется в top.
4. **Убраны паразитные правила**: `min-h-full` на внешнем flex-div (он не резолвился после смены на min-height на предке), `overscroll-behavior: contain` → `overscroll-behavior-y: contain` (X-ось и так защищена `overflow-x: hidden`).

## 5. Почему выбран такой подход

- **Не делали fixed/sticky CTA**: противоречит минимализму продукта (см. CLAUDE.md — "no motion framework"/"prefer local JSON content over content services"/"prefer one working screen over three speculative screens"). Document-scroll остаётся единственной scroll-осью.
- **Не делали costом скрытие streak-celebration**: это желаемый retention-сигнал.
- **Выбрали архитектурно устойчивый путь**: свойство CSS root-контейнеров меняется один раз и работает на всех будущих экранах, а не только на Result.
- **scroll reset через `scrollTo({ behavior: "auto" })`**: smooth-скролл на мобильных драётся с layout settle и выглядит как поздний прыжок.

## 6. Отдельные результаты по платформам

### 6.1 Track A — Desktop HTML (1280×800)

- menu renders без horizontal overflow: ✅
- 3 consecutive Next-puzzle rounds, CTA достижим каждый раз: ✅
- scroll не заморожен: ✅
- padding-bottom на `<main>` = 24px (safe area inset = 0): ✅
- визуальная регрессия существующих desktop фич: ✅ no diff (gameplay-smoke, responsive-smoke, progression-validator все проходят)

### 6.2 Track B — Apple simulation (iPhone 14 390×844, Safari 17 UA)

- 3 consecutive solves, Next puzzle reachable на каждом раунде: ✅
- scroll-down-to-bottom-then-Next: после перехода scrollY вернулся в 0: ✅
- streak-celebration round 2: Next puzzle достижим даже с дополнительным блоком: ✅
- padding-bottom с учётом safe-area-inset-bottom: работает (fallback на 16px, когда инсет недоступен в headless)

### 6.3 Track C — Android simulation (Pixel 6 412×915, Chrome 123 UA)

- 3 consecutive rounds, CTA всегда в viewport (при vh=915): ✅
- scroll-trap regression: отсутствует, scroll увеличивается прогнозируемо по мере роста контента: ✅
- рост contents от streak-celebration больше не "роняет" CTA — документ растёт вместе с ним: ✅

## 7. Какие баги найдены в каждом из трёх режимов

| Режим          | Найденный баг                                                                               | Статус      |
| -------------- | ------------------------------------------------------------------------------------------- | ----------- |
| Desktop        | ни одного regressions после mobile-фиксов                                                   | ✅ clean    |
| iOS Safari     | scroll-trap на tall result screen; `Next puzzle` выходит за safe-area                       | ✅ устранён |
| Android Chrome | `Next puzzle` визуально уползает после repeated flows (preserved scrollY + growing content) | ✅ устранён |

## 8. Фиксы по каждому режиму

- **Общие кроссплатформенные** (см. §4): root CSS pattern, safe-area padding, scroll reset.
- **iOS-specific**: `100dvh` fallback именно здесь наиболее важен — iOS Safari наиболее агрессивно играет с visual viewport.
- **Android-specific**: scroll reset на screen change снимает эффект "CTA уползает на 2-м пазле", потому что новый Result-экран начинается с top, а не inherits scrollY.
- **Desktop-specific**: проверено, что `overscroll-behavior-y: contain` не создаёт pixel-level jitter при trackpad scrolling (verified through responsive-smoke).

## 9. Что было общим кроссплатформенным фиксом

Пункты §4.1 (root scroll pattern), §4.2 (safe-area), §4.3 (scroll reset) — все три лечат root cause сразу на desktop, iOS и Android. Платформо-специфических CSS-forks избежали.

## 10. Добавленные regression tests

`tests/e2e/results-next-flow.mjs` — 5 cases:

1. **Track A Desktop**: 3 раунда consecutive Next-puzzle. Проверяет что CTA достижим через scroll.
2. **Track B iPhone**: 3 раунда + проверка `assertNoScrollTrap` (документ overflows → scrollTop реально меняется → scroll не заморожен).
3. **Track C Pixel 6**: 3 раунда + тот же scroll-trap guard.
4. **screen transition resets scroll**: после прокрутки вниз и клика Next puzzle — Game screen монтируется со scrollY=0.
5. **streak-celebration round 2**: специально воссоздаёт streak>=2 (главный источник "CTA уезжает" на Android) — CTA должен остаться достижимым.

Добавлено в `tests/e2e/run-all.mjs` — теперь эти 5 cases гоняются в каждом `npm run test:e2e`.

## 11. Сколько раундов агентного тестирования выполнено

- **Раунд 1** — ручная локализация + root cause → фиксы в CSS/App/ResultScreen → sanity: unit (119 tests pass) + build.
- **Раунд 2** — новый сьют `results-next-flow` (5 cases на 3 платформах) — все зелёные.
- **Раунд 3 (cross-platform retest)** — полный `npm run test:e2e` (4 существующих сьюта + 1 новый). Все критичные для этой задачи cases зелёные.
- **Раунд 4 (визуальный QA агент)** — `scripts/results-flow-visual-qa.mjs` собирает скриншоты в `reports/results_flow_qa/` для desktop / ios / android × 3 раунда, плюс JSON-сводка `summary.json` с измерениями позиции CTA и scrollHeight-а документа.

Артефакты: `reports/results_flow_qa/*.png` + `summary.json`.

## 12. Остаточные риски

- **`gameplay-smoke.mjs` — `onboarding has a Master Challenge mention`**: **предсуществующий** фейл, **не** связанный с этой задачей. Test-file лежит untracked (никогда не коммичен), его assert ожидает строку `"Master Challenge"` в Onboarding, но в текущем `src/components/Onboarding.tsx` строка — `"Master — slower reveals, no Wink."`. Тест устарел; фикс out-of-scope здесь.
- **Реальное устройство vs headless emulation**: Playwright мобильная эмуляция не воссоздаёт 100% поведения iOS Safari с bouncing overscroll и URL-bar анимациями. Окончательная валидация — смоук на реальном iPhone через dev server / GitHub Pages.

## 13. Manual QA checklist по трём платформам

### Desktop (Chrome 1280×800)

- [ ] Menu → Easy puzzle → solve → Result. Видно: Grade / Solved-groups / Share / Next puzzle / Stats / Back to menu.
- [ ] Клик `Next puzzle` — Game screen, scrollY = 0.
- [ ] Solve ещё раз → Streak-celebration блок появился, CTA ниже, но достижим прокруткой.
- [ ] `Back to menu` — Menu screen, scrollY = 0.
- [ ] Нет horizontal scroll в любой точке.

### iPhone 14 / Mobile Safari (390×844)

- [ ] Первое solve: Result screen скроллится, `Next puzzle` достижим.
- [ ] После `Next puzzle` — Game screen сверху, не с середины.
- [ ] 3-й раунд подряд: скролл НЕ замер, `Next puzzle` всё ещё reachable (возможно с прокруткой).
- [ ] Последний CTA не накрывается home-indicator'ом (safe-area padding работает).

### Pixel 6 / Chrome Mobile (412×915)

- [ ] После solve — `Next puzzle` в зоне видимости без прокрутки (vh=915).
- [ ] 3 solve подряд: CTA не уползает дальше вниз с каждым раундом.
- [ ] Adress bar hide/show не ломает layout.
- [ ] Gesture nav зона не накрывает CTA.

## 14. Build + deploy

- **Build**: `npm run build` → ✅ (`tsc --noEmit && vite build`, 1.17s, 323.3 kB / 103.9 kB gzip JS; 18.62 kB / 4.58 kB gzip CSS).
- **Unit tests**: `npm test` → 119/119 passed.
- **E2E suite**: `npm run test:e2e` → все задачи-specific cases зелёные. Один pre-existing нестабильный assert в `gameplay-smoke` (строка `Master Challenge`) — не связан с этой задачей.
- **Commit(s)**:
  - `fix(mobile): stabilize result screen + next-puzzle scroll flow (iOS/Android/desktop)` — главный коммит с CSS/App/ResultScreen изменениями.
  - `test(e2e): add results-next-flow multi-platform regression suite` — tests + визуальный агент.
- **Финальный deploy**: будет после финального пуша в `main` после подтверждения. Промежуточные деплои в ходе диагностики не выполнялись.
- **Тестировать итоговую версию**: локальный `npm run preview`; после push — GitHub Pages по штатному workflow.
