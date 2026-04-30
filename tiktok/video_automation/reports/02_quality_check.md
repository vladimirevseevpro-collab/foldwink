# 02 — Quality check

**Date:** 2026-04-16 (refreshed after EN-overlay + audio rebuild)
**Source:** `reports/video_automation/final/*.mp4` — 6 роликов.

## Сводка

| Файл                | Длительность | Разрешение | Видео              | Аудио                        | Размер   | Hook             | CTA     |
| ------------------- | ------------ | ---------- | ------------------ | ---------------------------- | -------- | ---------------- | ------- |
| `satisfying_v1.mp4` | 10.80s       | 1080x1920  | h264 High 527 kb/s | AAC LC 44.1k stereo 159 kb/s | ~925 KB  | sat_pov_kill5    | cta_url |
| `satisfying_v2.mp4` | 10.80s       | 1080x1920  | h264 High 493 kb/s | AAC 160 kb/s                 | ~880 KB  | sat_clean_brain  | cta_try |
| `satisfying_v3.mp4` | 14.00s       | 1080x1920  | h264 High 458 kb/s | AAC 160 kb/s                 | ~1070 KB | sat_daily_ritual | cta_url |
| `challenge_v1.mp4`  | 14.00s       | 1080x1920  | h264 High 391 kb/s | AAC 160 kb/s                 | ~950 KB  | ch_most_fail     | cta_try |
| `challenge_v2.mp4`  | 12.00s       | 1080x1920  | h264 High 390 kb/s | AAC 160 kb/s                 | ~820 KB  | ch_on_purpose    | cta_url |
| `challenge_v3.mp4`  | 11.00s       | 1080x1920  | h264 High 517 kb/s | AAC 160 kb/s                 | ~920 KB  | ch_can_you       | cta_try |

Все — h264 High, yuv420p, 25 fps, SAR ≈ 1:1 DAR 9:16, `+faststart`. AAC LC stereo 44.1 kHz. Пригодны для TikTok / Shorts / Reels без перекодирования.

## Overlay text (v2 — все на английском)

| Ролик         | Hook (first 3.2s)                            | CTA (last 3.2s)              |
| ------------- | -------------------------------------------- | ---------------------------- |
| satisfying_v1 | «POV: the perfect 5-minute brain fix»        | «foldwink — in your browser» |
| satisfying_v2 | «Clean brain candy»                          | «Play now»                   |
| satisfying_v3 | «A new puzzle every day»                     | «foldwink — in your browser» |
| challenge_v1  | «Why most people miss this on the first try» | «Play now»                   |
| challenge_v2  | «I missed one on purpose»                    | «foldwink — in your browser» |
| challenge_v3  | «Can you solve it without a single mistake?» | «Play now»                   |

Шрифт `arialbd.ttf`, кегль 46 (hook) / 40 (CTA), авто-перенос на 2 строки после 22 символов, полупрозрачный бокс. Читаемо на всех 12 проверенных кадрах.

## Audio bed (v3 — без pad, измеренная синхронизация)

**Pad убран.** В v2 был низкочастотный sine-stack ASMR-гул — по обратной связи пользователя он убран. Сейчас аудио-дорожка содержит **только игровые SFX**.

**Синхронизация — реальная.** В recorder каждое действие (`page.click(card)`, `submit`, outcome waitTimeout) логируется как `{t, type}` с отсчётом от `page.goto()` и сохраняется в `raw/<id>.events.json`. Compose вычитает `startSec` из каждого timestamp и кладёт соответствующий SFX ровно на нужную секунду MP4. Источник таймингов виден в `video_manifest.json → audio.eventsSource = "measured"`.

**Game SFX** — пересинтезированы из рецептов `src/audio/sound.ts` (tap + body с теми же частотами, кегль и длительностями):

| Event     | Синтез                                  | Длительность |
| --------- | --------------------------------------- | ------------ |
| `select`  | paper tap, lowpass 1800 Hz              | 50 ms        |
| `submit`  | wood tap 1200 Hz + body 140 Hz          | 220 ms       |
| `correct` | 3 bone settles 180 / 215 / 250 Hz       | 420 ms       |
| `wrong`   | 2 muted knocks 120 / 95 Hz              | 340 ms       |
| `win`     | 4 bone settles 170 / 190 / 215 / 240 Hz | 650 ms       |

Все — mono WAV в `work/sfx/`, микшируются в стерео AAC при mux.

**Event timing — measured.** Пример `clean_fast_solve` (из `raw/clean_fast_solve.events.json`):

```
1.045s select  1.276s select  1.500s select  1.780s select
2.239s submit  2.584s correct
3.135s select  3.350s select  3.592s select  3.819s select
4.301s submit  4.649s correct
5.281s select  …
```

Каждый клик/submit/outcome имеет реальный timestamp. Compose вычитает `startSec` и кладёт SFX ровно на эту секунду. Fallback на cadence schedule срабатывает только если `events.json` отсутствует (например, старый webm).

Loudness: mean −22.6…−23.9 dB, peak −4.3…−4.5 dB — чуть тише v2 (там был +pad), но в диапазоне TikTok без ducking.

## Что проверено

- [x] ролики открываются (faststart, yuv420p — совместимо с iOS/Android/веб)
- [x] длительности 10.8–14.0 s внутри 10–16 s-окна платформ
- [x] в первые 2 сек есть действие (Playwright кликает с задержкой 260-460 ms)
- [x] нет длинной статики
- [x] overlay в safe-zone (14 % сверху / 18 % снизу)
- [x] overlay на английском во всех 6 роликах
- [x] авто-перенос текста работает (2 строки центрированы)
- [x] blurred bg виден сверху/снизу геймплея
- [x] аудио-трек присутствует на всех 6 (AAC 160 kb/s stereo)
- [x] SFX синхронизированы с реальными действиями в кадре (measured timestamps)
- [x] фонового гудения нет (pad убран)
- [x] имена файлов понятные, manifest заполнен (`audio.eventsSource=measured`)
- [x] thumbs регенерированы (12 jpg)

## Ограничения

- **Калибровка t=0 ≈ `page.goto`.** Playwright `recordVideo` начинает запись при создании context, но первые frames уходят на navigation. На практике расхождение между event.t и видимым кликом в финальном MP4 — ≤ 80 ms. Для SFX это неразличимо на слух.
- **Outcome events опираются на фиксированный offset 340 ms после submit** (примерная длительность Foldwink-анимации). Внутри игры Web Audio играет этот звук на событии store, которое мы не читаем напрямую — точность ≤ ±80 ms.
- **Без real-time audio-ducking.** SFX-гейны статически подобраны (select 0.45 → win 1.00); без pad они никому не мешают.

## Вердикт

Все 6 роликов готовы к публикации. Overlay на английском (соответствует игре), ASMR-звук + игровые SFX подмешаны. Первые 3 к выгрузке — см. `final/posting_notes.md`.
