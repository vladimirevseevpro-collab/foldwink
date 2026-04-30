# 01 — Foldwink video pipeline: Discovery

**Date:** 2026-04-16
**Scope:** автоматический pipeline записи и сборки вертикальных short-видео (TikTok / Shorts / Reels) для Foldwink.

---

## 1. Как запускается игра

- Стек: **React 18 + TypeScript + Vite**.
- Запуск локально через `npm run dev` (port 5173) или `npm run preview` (port 4174 — из существующего e2e скрипта).
- Сборка статическая (`dist/`) — можно обслуживать любым static-сервером.
- Точка входа: `index.html` → `src/main.tsx` → `<App />`.

Для pipeline выбран **preview-режим на `http://localhost:4174`**, т.к.:

- сборка уже прошла typecheck и валидацию,
- нет Vite HMR-оверлеев, которые портят кадры,
- совпадает с конфигом существующих e2e (`tests/e2e/lib/harness.mjs`).

## 2. Карта UI (что видит игрок)

Сцены (Zustand, `src/game/state/store.ts`):

- `menu` — главный экран, кнопки: **Easy puzzle**, **Medium puzzle**, **Master Challenge**, Daily, Stats.
- `game` — 4×4 grid, заголовок, MistakesDots, GameTimer, (для medium) **FoldwinkTabs + Wink-чип**, Submit.
- `result` — share card, Play again / Menu.

Ключевые селекторы (подтверждены в `tests/e2e/gameplay-smoke.mjs` и `scripts/human-like-qa.mjs`):

- `button:has-text("Easy puzzle")`, `button:has-text("Medium puzzle")`, `button:has-text("Master Challenge")`
- `[role="grid"] button:not([disabled])` — карты
- `button:has-text("Submit")`
- `button:has-text("Quit to menu") | button:has-text("Menu")`
- `[aria-label^="Elapsed time"]`, `[aria-label^="Mistakes used"]`
- `[role="dialog"]` → `button:has-text("Got it")` (онбординг)

## 3. Как стартует уровень

- Easy: клик «Easy puzzle» — курсор `progress.easyCursor` → `puzzles/pool/puzzle-XXXX.json`.
- Medium: требует 5 easy-wins (unlock); курсор `mediumCursor`. Включает FoldwinkTabs + Wink.
- Master Challenge: требует 3 medium-wins; курсор `hardCursor`. Без Wink.

Детерминизм: `shuffleDeterministic(puzzle, seed)` в `src/game/engine/shuffle.ts`. Для record-пайплайна мы **seed'им localStorage** (`foldwink:stats`, `foldwink:progress`, `foldwink:onboarded`) — тот же трюк, что используется в `human-like-qa.mjs`.

## 4. Визуально сильные моменты

- момент выделения 4-й карты (pre-submit tension),
- «щелчок» решения: группа закрашивается solved-цветом (satisfying),
- появление буквы в FoldwinkTab после каждой удачной группы,
- финал: все 4 группы лочатся, появляется share-card.

Эти моменты становятся первыми 2 секундами (hook) в итоговом монтаже.

## 5. Мешающие элементы

- Первый запуск: онбординг `[role="dialog"]` — гасим `localStorage.setItem("foldwink:onboarded", "1")`.
- Vite-badge / HMR overlay: отсутствует в preview-режиме.
- Курсор: Playwright рисует курсор — скрываем через CSS `cursor: none !important` на `body`.

## 6. Детерминируемая демонстрация

Подход solver-based:

1. Загружаем **все puzzles из `puzzles/pool/*.json`** в память.
2. Читаем 16 текстов карт из `[role="grid"] button`.
3. Находим puzzle, у которого `flatten(groups.items) === set(cardTexts)`.
4. Играем группу за группой, выбирая детерминированный порядок.
5. Для «намеренных ошибок» используем смешанный выбор (2 из одной группы + 2 из другой) — это гарантирует mismatch без риска случайного win.

## 7. Risks

- **FFmpeg**: системный отсутствует. Используем bundled Playwright ffmpeg — `C:/Users/Vladimir/AppData/Local/ms-playwright/ffmpeg-1011/ffmpeg-win64.exe` (n7.0.1).
- **Запуск сервера**: pipeline сам поднимает `vite preview` и гарантированно гасит его в finally.
- **Шрифты для drawtext**: на Windows — `C\:/Windows/Fonts/arialbd.ttf`. Если отсутствует — drawtext падает; пайплайн в таком случае рисует overlay через canvas-encoded PNG (fallback, не реализован в MVP — задокументирован).
- **Длительность раундов**: medium/hard из-за Foldwink Tabs медленнее — тайминг сценария адаптивный, не фиксированный.

## 8. Выбранный подход

**Hybrid Playwright + scripted input + bundled ffmpeg.**

- Playwright управляет страницей, кликает по DOM-кнопкам (надёжнее координат).
- `recordVideo` Playwright даёт webm-клипы → конвертируем через ffmpeg.
- Compositor на ffmpeg с двумя шаблонами: `blurred_bg` (основной) и `tight_crop` (альтернативный).
- Overlay-текст — `drawtext` filter, с safe-zone расчётом в процентах.

Этого достаточно для 6+ готовых MP4 без ML и без ручного монтажа.
