# Foldwink Video Pipeline

Автоматический локальный pipeline, который:

1. поднимает `npm run preview` на `http://localhost:4174`,
2. детерминированно играет 5 подготовленных сценариев геймплея,
3. сохраняет raw webm-клипы через Playwright `recordVideo`,
4. собирает из них вертикальные 1080x1920 MP4 с hook-оверлеями и CTA,
5. генерирует manifest, captions, hashtags, posting notes и финальный ZIP.

Цель — быстро выпустить 6+ готовых роликов для TikTok / Shorts / Reels, которые можно пересобрать повторно после любого изменения в игре.

---

## 1. Что должно быть в системе

- **Node.js ≥ 20** (уже стоит у проекта).
- Playwright 1.59.1 + bundled Chromium Headless Shell и bundled `ffmpeg-win64.exe`
  (оба установлены в `%LOCALAPPDATA%\ms-playwright\` — ставятся при `npx playwright install`).
- Windows 10/11. Шрифт `C:\Windows\Fonts\arialbd.ttf` используется для drawtext.

Внешний ffmpeg не нужен. Если всё же хочешь использовать свой — задай env:

```bash
FFMPEG_PATH="C:/tools/ffmpeg/bin/ffmpeg.exe" npm run video:compose
```

---

## 2. Быстрый старт

```bash
# 1. сбилдить игру
npm run build

# 2. записать все сценарии (5 webm в reports/video_automation/raw/)
npm run video:record

# 3. собрать 6 финальных MP4 на английском + ASMR-звук (в reports/video_automation/final/)
npm run video:compose

# 4. (опционально) упаковать всё в foldwink_video_pack.zip
npm run video:pack
```

Или одной командой: `npm run video:all` — сделает build + record + compose.

По умолчанию:

- **`--lang=en`** — overlay надписи на английском (игра англоязычная).
- **аудио включён**: ASMR-пад + ре-синтезированные звуки игры (select / submit / correct / wrong / win) на условных таймингах по cadence сценария.

Флаги:

- `--lang=ru` — переключить overlay на русский.
- `--no-audio` — немой выход (старое поведение).

---

## 3. Селективный запуск

```bash
# только один сценарий (по id из configs/scenarios.json)
node reports/video_automation/scripts/record.mjs clean_fast_solve

# только один output (подстрока имени файла)
node reports/video_automation/scripts/compose.mjs satisfying_v1

# переключить overlay на русский
node reports/video_automation/scripts/compose.mjs --lang=ru

# собрать без звука
node reports/video_automation/scripts/compose.mjs --no-audio
```

---

## 4. Структура каталога

```
reports/video_automation/
├── README.md                     # этот файл
├── configs/
│   ├── scenarios.json            # параметры сценариев геймплея
│   └── overlay_presets.json      # тексты hooks + CTA, safe-zones
├── scripts/
│   ├── record.mjs                # Playwright recorder
│   ├── compose.mjs               # ffmpeg compositor + audio bed mix
│   ├── pack.mjs                  # zip-упаковщик (forward-slash paths)
│   └── lib/
│       ├── server.mjs            # авто-запуск `npm run preview`
│       ├── solver.mjs            # puzzle pool matcher + plan builder
│       ├── ffmpeg.mjs            # поиск bundled ffmpeg + drawtext font
│       └── audio.mjs             # ASMR-pad + re-synthesised game SFX
├── raw/                          # сырой Playwright recordVideo (webm)
├── work/                         # временные контексты
├── final/                        # готовые mp4 + manifest + captions
└── reports/                      # discovery, quality check, final report
```

---

## 5. Сценарии и их цель

| id                      | difficulty | mistakes | цель                                |
| ----------------------- | ---------- | -------- | ----------------------------------- |
| `clean_fast_solve`      | easy       | 0        | satisfying-база                     |
| `escalating_difficulty` | medium     | 1        | FoldwinkTabs reveal + пересаживание |
| `almost_fail_then_win`  | medium     | 2        | tension → recovery                  |
| `challenge_rewatch`     | easy       | 1        | короткий rewatch-friendly           |
| `hard_mode_flex`        | hard       | 0        | Master Challenge confidence play    |

Все сценарии детерминированы через `solver.matchPuzzleByCards` — он сопоставляет 16 карт на экране с puzzle в `puzzles/pool/` и выдаёт план решения.

---

## 6. Рендер-шаблоны

**`blurred_bg`** (по умолчанию): геймплей по центру 1080 wide, фон — сильно размытая и закроплённая до 1080x1920 копия того же источника. Плюс: работает с любым соотношением, не портит UI.

**`tight_crop`** (альтернатива, пока не включена в variants — в manifest пометка): масштаб до 1080 по ширине без blurred bg, верх/низ добиваются цветом.

Шаблон меняется параметром `template` в `scripts/compose.mjs::variants()` — можно добавлять варианты без правки ffmpeg.

---

## 7. Overlay presets

`configs/overlay_presets.json` хранит hooks (satisfying + challenge) и CTA, каждый с `text_ru` и `text_en`. Safe-zone — в процентах от высоты (топ 14 %, низ 18 %), боковые отступы 6 %. drawtext использует `arialbd.ttf` и полупрозрачный бокс для читаемости на любом кадре.

---

## 8. Типичные ошибки

- **`spawn EINVAL`**: на Windows `spawn("npm", ...)` требует `shell: true` — уже выставлено в `lib/server.mjs`.
- **`ffmpeg exited 1`**: проверь, что `arialbd.ttf` существует. Альтернативно задай свой:
  ```bash
  FFMPEG_PATH="C:/ffmpeg/bin/ffmpeg.exe" npm run video:compose
  ```
  и отредактируй `scripts/lib/ffmpeg.mjs::winFont()`.
- **`could not match puzzle`**: обычно значит, что сценарий попал в puzzle, которого нет в `puzzles/pool/`. Пересидь localStorage-курсор, сбросив `SEEDED_PROGRESS` в `record.mjs`.
- **`medium button disabled`**: seed-статы не соответствуют unlock-порогу. Текущий seed даёт 18 wins / 6 medium wins / 2 hard wins — это распахивает все режимы.

---

## 9. Как пересобрать только overlay

Если устраивают клипы, но хочется другой текст/CTA:

```bash
# поправь reports/video_automation/configs/overlay_presets.json
node reports/video_automation/scripts/compose.mjs
```

Recorder повторно не нужен — webm уже лежат в `raw/`.
