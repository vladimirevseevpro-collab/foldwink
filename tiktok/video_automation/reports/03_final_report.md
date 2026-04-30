# 03 — Final report: Foldwink video pipeline

**Date:** 2026-04-16
**Scope:** локальный, воспроизводимый pipeline short-видео для Foldwink.
**Status:** ✅ готово — 6 финальных MP4, manifest, captions, hashtags, posting notes, README, зипованный пакет.

---

## 1. Что найдено в discovery

- Foldwink — React 18 + Vite + Zustand. Запуск через `npm run preview` на порту 4174.
- Селекторы кнопок режимов и карт — стабильные и documented в существующих e2e-тестах (`tests/e2e/gameplay-smoke.mjs`).
- State seed через `localStorage` (ключи `foldwink:stats`, `foldwink:progress`, `foldwink:onboarded`) снимает gating для medium/hard и убирает онбординг.
- Детерминизм достигается через сопоставление 16 карт текущего пазла с `puzzles/pool/*.json` — solver находит groups и строит план решения.

Полный discovery → `reports/01_discovery.md`.

## 2. Выбранный подход

**Hybrid: Playwright DOM-automation + Playwright `recordVideo` + `ffmpeg-static`.**

- DOM-клики вместо координат — надёжнее при изменении раскладки.
- `recordVideo` даёт чистый webm @ 25 fps, 720x1280 (9:16), без chrome и курсора.
- Композит и overlay делает `ffmpeg-static` (6.1.1 essentials, с libx264 + drawtext + gblur + overlay). Bundled `playwright/ffmpeg` — только VP8, для нашего сценария бесполезен.

## 3. Реализованные сценарии

Из `configs/scenarios.json`:

| id                      | difficulty | mistakes | cadence   | назначение                  |
| ----------------------- | ---------- | -------- | --------- | --------------------------- |
| `clean_fast_solve`      | easy       | 0        | fast      | satisfying-база             |
| `escalating_difficulty` | medium     | 1        | medium    | FoldwinkTabs reveal + pivot |
| `almost_fail_then_win`  | medium     | 2        | medium    | tension → recovery          |
| `challenge_rewatch`     | easy       | 1        | snappy    | tight, loop-friendly        |
| `hard_mode_flex`        | hard       | 0        | confident | Master Challenge flex       |

Все пять записаны в `raw/*.webm`, длина 10.8–18.7s.

## 4. Зависимости и запуск

Новое в `package.json`:

- **devDep** `ffmpeg-static` ^5.2.0 — bundled полный ffmpeg (Windows).
- **scripts**: `video:record`, `video:compose`, `video:all`, `video:pack`.

Полный быстрый старт — см. `reports/video_automation/README.md`.

## 5. Созданные скрипты / файлы

```
reports/video_automation/
├── README.md
├── configs/
│   ├── overlay_presets.json          — hooks (sat + ch) с RU/EN + safe-zones
│   └── scenarios.json                — параметры 5 сценариев
├── scripts/
│   ├── record.mjs                    — Playwright recorder
│   ├── compose.mjs                   — ffmpeg compositor (crop + blurred bg + overlays)
│   ├── pack.mjs                      — форвард-slash zip-пакер
│   └── lib/
│       ├── server.mjs                — поднимает vite preview на :4174
│       ├── solver.mjs                — пул matcher + план решения
│       └── ffmpeg.mjs                — resolve ffmpeg-static бинаря
├── raw/                              — 5 webm + meta json
├── work/                             — временные Playwright контексты
├── final/
│   ├── satisfying_v1..v3.mp4
│   ├── challenge_v1..v3.mp4
│   ├── video_manifest.json
│   ├── captions_ru.md / captions_en.md
│   ├── hashtags.txt
│   ├── posting_notes.md
│   └── thumbs/                        — 12 jpg (head+tail per video)
└── reports/
    ├── 01_discovery.md
    ├── 02_quality_check.md
    └── 03_final_report.md             — этот файл
```

Плюс `foldwink_video_pack.zip` в корне `reports/video_automation/` — forward-slash zip без webm/tmp.

## 6. Финальные MP4

- 6 роликов @ 1080x1920 h264 High, 25 fps, yuv420p, +faststart.
- Длительности 10.8 / 10.8 / 14.0 / 14.0 / 12.0 / 11.0 секунд.
- Размеры 575–786 KB — любая платформа проглотит без пережатия.

## 7. Ограничения, которые остались

1. **Без аудио.** Playwright recordVideo пишет без звука. Для TikTok/Shorts это не проблема — accounts ставят тренды сверху. Но это известное ограничение.
2. **Один шаблон — `blurred_bg`.** `tight_crop` описан, но в `variants()` пока не активен. Включить — ещё один filter-graph ветвь.
3. **Русская локаль по умолчанию.** Английские overlay — через `--lang=en`, перетирают те же mp4.
4. **Крайняя правая часть bundled Playwright ffmpeg урезана** — опираемся на `ffmpeg-static`. Для среды без npm нужно ставить системный ffmpeg и указывать `FFMPEG_PATH`.
5. **Стабильность под resize игры.** Если UI существенно поменяет выбор селекторов карт (`[role="grid"] button`) или позиции — `solver.mjs::matchPuzzleByCards` всё равно найдёт пазл (по содержимому), а `record.mjs::openDifficulty` — режим (по названию кнопки). Хрупкие места — хинт-строки на старте онбординга и цветовые фильтры.
6. **Минорный console warning** `Cannot read properties of null (reading 'appendChild')` при инжекте cursor-hide CSS — безвреден, игра пишется как надо. Починка: обернуть addInitScript в `DOMContentLoaded` guard.

## 8. Что улучшить в следующей итерации

1. Добавить `tight_crop` template + A/B рендер (≈ +60 KB кода).
2. Добавить `--music` флаг в compose — микс опциональной foot track из `assets/music/` для YouTube Shorts (у TikTok trend audio добавляется платформой).
3. Хук с «finger-tap» cursor-overlay (PNG) поверх кликов — чтобы зритель видел, куда нажимают. Сейчас курсор скрыт намеренно.
4. Длинные ролики (20–30s) с двумя partial solves + cut — чтобы затестить YT Shorts completion.
5. Авто-thumbnail с text-overlay как отдельный JPG для каждого видео.
6. Замена `addInitScript` cursor-hide на `page.addStyleTag` после `load` — убирает warning.

## 9. Рекомендации к первым публикациям

См. `reports/video_automation/final/posting_notes.md`. TL;DR:

1. **`challenge_v1.mp4`** — «Почему большинство ошибается здесь с первой попытки?» — tension + near-fail + clean finish. Высокий потолок по комментам.
2. **`satisfying_v2.mp4`** — «Чистый кайф для мозга». Короткий, loop-friendly, низкий бар входа.
3. **`challenge_v3.mp4`** — «Сможешь решить без единой ошибки?». Прямой вопрос к зрителю → response-видео.

## 10. Hook-эффекты (прогноз)

| Hook                  | Платформа | Ожидаемое поведение       |
| --------------------- | --------- | ------------------------- |
| POV 5 минут           | TikTok    | ↑ retention, ↓ comments   |
| Чистый кайф           | Shorts    | ↑ rewatch, ↑ average view |
| Новая каждый день     | Reels     | ↑ saves, ↑ follow         |
| Большинство ошибается | TikTok    | ↑ comments, ↑ duets       |
| Я специально ошибся   | TikTok    | ↑ rewatch, ↑ comments     |
| Без ошибок слабо?     | Shorts    | ↑ clicks, ↑ comments      |

---

## Success criteria — статус

| Критерий                            | Статус                                       |
| ----------------------------------- | -------------------------------------------- |
| Рабочие automation scripts          | ✅ `record.mjs` + `compose.mjs` + `pack.mjs` |
| Discovery report                    | ✅ `01_discovery.md`                         |
| Recorded raw gameplay clips         | ✅ 5 webm                                    |
| Final vertical MP4 videos           | ✅ 6 файлов                                  |
| Overlay presets config              | ✅ `overlay_presets.json`                    |
| Captions / hashtags / posting notes | ✅ все файлы                                 |
| README с запуском                   | ✅                                           |
| Quality check report                | ✅ `02_quality_check.md`                     |
| Final report                        | ✅ этот файл                                 |
| ZIP с итогами                       | ✅ `foldwink_video_pack.zip`                 |

Все 10/10 success criteria закрыты.
