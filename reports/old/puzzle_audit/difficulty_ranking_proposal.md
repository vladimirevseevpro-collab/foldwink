# Foldwink — ранжирование пазлов по сложности внутри тира

**Дата:** 2026-04-20
**Статус:** proposal, ждёт apple/orange от владельца

## Что просит продакт

> Все пазлы, которые есть для Easy, должны начинаться с самого лёгкого и
> заканчиваться самым сложным. То же в Medium и Hard.

Цель — в standard-mode ощущаемый ramp сложности внутри выбранного тира.

## Hard-constraint: daily mode трогать нельзя

`src/puzzles/loader.ts` сейчас сортирует пул по `id`. Это используется:

- **daily-mode**: выбирает пазл по `hash(date) mod pool.length` → индекс в
  отсортированном по id пуле. Любая перестановка меняет, какой пазл выпадет
  на конкретный день → у игрока «перепрыгивает» daily-история. Red line.
- **standard-mode**: курсор игрока — индекс в отсортированном по id пуле.
  Перестановка заставит курсор указывать на другой пазл (игрок может
  перескочить вперёд или назад).

Следовательно daily-выборка ДОЛЖНА остаться завязанной на id-sorted пул,
а ranking должен жить в отдельной структуре, которой пользуется только
standard-mode.

## Архитектура

В `loader.ts` сохраняем существующее:

```ts
EASY_POOL   // by id, used by daily + by-id lookups
MEDIUM_POOL
HARD_POOL
```

Добавляем:

```ts
EASY_POOL_RAMPED   // same puzzles, sorted by difficultyScore ascending
MEDIUM_POOL_RAMPED
HARD_POOL_RAMPED

getEasyRampedByIndex(i)
getMediumRampedByIndex(i)
getHardRampedByIndex(i)
```

`store.ts` в standard-mode переключается на `*Ramped*` helper'ы. Daily-mode
и by-id нигде не трогаются.

Курсор — тот же `easyCursor` / `mediumCursor` / `hardCursor`, но указывает
уже на ramped-пул. Миграция: при первой загрузке новой версии, для каждого
тира, мы знаем какие id игрок уже прошёл (пока нигде не хранится — только
курсор). Поэтому курсор просто начинает указывать на новую позицию в
ramped-пуле. Игрок НЕ теряет прогресс (stats/wins сохраняются), но может
увидеть ранее сыгранный пазл или пропустить несколько. Это допустимая
цена за улучшенный ramp. Отметить в release notes.

Альтернатива без перекрытия прогресса — хранить `lastSolvedId` + множество
`solvedIds` и искать следующий нерешённый в ramped-пуле. Дороже по
localStorage, но идеально. Решение: ОТЛОЖИТЬ до v1.0, сейчас принять
курсор-сдвиг.

## Что считаем difficultyScore

### Вариант S1 — pure heuristic, 0 внешних вызовов (MVP-friendly)

Составной score 0–100, считаем офлайн скриптом `scripts/score-puzzles.mjs`,
записываем в JSON как `meta.difficultyScore`. Факторы:

1. **Category abstraction** (0–30)
   - single-word, конкретный label («Fruits», «Colors») → низкий балл
   - multi-word label («Things that come before 'ball'») → высокий
   - wordplay-flagged (у validator'а есть сигнал) → +max
2. **Cross-group lexical overlap** (0–25)
   - считаем, сколько items одного group могут по семантике/синониму
     попасть в другой. Прокси: normalized trigram overlap items между
     группами. Больше пересечений → выше сложность.
3. **Item rarity proxy** (0–25)
   - доля items, чья длина > 8 символов или содержит редкие буквы
     (Ъ/Ь/Ё в ru; Q/X/Z в en; β/ß/ö/ä/ü в de). Грубый прокси, но
     работает как тай-брейкер.
4. **Tier anchor** (0–20)
   - easy имеет сдвиг score в 0–50, medium 30–80, hard 60–100. Гарантия,
     что внутри тира ramp реален, а не случайный.

Score пересчитывается при каждом `npm run validate`. Разработчик может
руками переопределить `meta.difficultyOverride` если heuristic ошибся.

### Вариант S2 — GPT-scored через codex (качественнее, дороже)

1 × codex exec на тир × язык (9 вызовов). GPT получает все пазлы тира и
возвращает упорядоченный список id от easiest→hardest. Мы записываем
позицию в `meta.difficultyRank`.

Плюсы — лучше отражает восприятие игроком. Минусы — непереcчитывается
при добавлении новых пазлов без нового GPT-прогона.

### Вариант S3 — гибрид (рекомендую)

- S1 как дефолт: автоматически, быстро, пересчитывается.
- S2 запускаем один раз перед 1.0 для валидации, результат записываем в
  `meta.editorialRank` как override. S1 используется для новых пазлов
  пока их не пересчитает S2.

## Что меняем в коде (S1 сейчас)

Файлы:
- `scripts/score-puzzles.mjs` — новый, считает и записывает `difficultyScore`
- `src/puzzles/loader.ts` — добавить `*_RAMPED` пулы + helper'ы
- `src/game/state/store.ts` — переключить standard-mode хелперы
- `src/game/state/__tests__/store.test.ts` — обновить mock deps
- `docs/TODO.md` — отметить миграцию в S7

Ничего не ломаем:
- daily-mode
- share card id-based lookup
- stats
- валидатор (он score игнорирует)

Ориентировочно ~150 строк + тесты.

## Оценка трудозатрат

- S1 heuristic + loader + тесты: ~1.5–2 часа
- S2 GPT прогон + injector: ещё ~1 час (если захотим сейчас)
- Release notes + docs/TODO.md: 15 минут

## Что мне нужно решить

1. S1, S2 или S3? Рекомендую S3 (S1 сейчас, S2 перед 1.0).
2. Принять cursor-shift или отложить ranking до реализации `solvedIds`?
   Рекомендую принять cursor-shift.
3. Применяем в рамках текущего sprint или создаём отдельный mini-sprint
   перед deploy? Рекомендую mini-sprint, т.к. задевает store.
