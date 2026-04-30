# Foldwink Playtest Audit — 2026-04-19

Цель: оценить играбельность, привлекательность игрового процесса, retention потенциал. Проведён как «прохождение глазами живого игрока» с анализом кода там, где нужно было уточнить механику.

---

## TL;DR

Foldwink — **крепкая 7/10 grouping-игра с уникальным крючком (Foldwink Tabs + Wink).** Минималистичный стиль работает. Основная механика выбора надёжна, обратная связь по действиям хорошая. Но несколько маленьких упущений мешают дотянуть до «золотого стандарта» NYT Connections-тира:

1. **Нет «one away» фидбэка** — когда игрок ошибается на 1 карту, игра молчит. Это центральный эмоциональный момент жанра.
2. **Нет Shuffle кнопки** — стандарт отрасли, помогает разгрузить взгляд.
3. **Wink — необратимый one-shot без подтверждения** — рискованное управление критическим ресурсом.
4. **Share-текст скупой** — без названия и оценки, плохо выстреливает в соцсетях.
5. **Нет keyboard-шорткатов** (Enter/Esc) — пропущена вся десктоп-аудитория.
6. **Timer всегда на виду** — давит на casual-игрока, у которого "2–5 min" должны быть расслабленными.
7. **Daily завершён → Easy** — бесшовного перехода нет, игрок может залипнуть на countdown'е.
8. **"Master Challenge — coming soon" на RU/DE — вечный** — тупиковая промиса.

---

## ДЕТАЛЬНЫЙ РАЗБОР

### 1. Первая сессия (новый игрок)

**Хорошо:**
- Onboarding модалка чистая, 4 правила ясны за 15 секунд
- LanguageToggle сверху — игрок может сразу выбрать язык (фикс этой сессии)
- Wordmark + подзаголовок "2–5 минут" задают ожидания
- Primary CTA = "Сегодняшний пазл" — правильный дефолт

**Можно лучше:**
- После первой победы — никакой особой реакции. Game screen → Result screen, всё стандартно. Нужен один запоминающийся момент ("Твой первый Foldwink!").
- Onboarding не показывает живой пример Wink — только текст. Можно было бы анимированный тизер.
- Difficulty-иконки в меню отсутствуют. Кнопки "Лёгкий", "Средний", "Мастер" все одного стиля.

### 2. Игровой loop (основа)

**Механика выбора:**
- 4 карточки → Submit. Кликнуть уже выбранную — снимается. **Хорошо**, но нигде это не сказано явно.
- Submit disabled пока <4 — хорошо, но после неправильной попытки кнопка моментально снова active, нет cooldown'а. OK для тру-геймеров, нормально.

**Обратная связь:**
- Correct → зелёная рамка + звук + haptic + tint карточек. ✓
- Wrong → красная рамка + shake + звук. Но **нет сигнала "one away"**.
  - В `submit.ts:8-28` возвращается только null для любой неправильной попытки. Частичное совпадение (3/4) не детектится.
  - Это главная UX-дыра. NYT Connections без этого сигнала не существовал бы как франшиза.
  - **Fix**: добавить в `submit.ts` обнаружение "лучшего частичного совпадения" и в store флаг `flash: "one-away"` или `"incorrect"`. UI показывает тонкий текст-подсказку или жёлтый оттенок.

**Выбор/отмена:**
- Нет **Shuffle** — стандартно в жанре. При заторе игрок просто смотрит в стену. Perception reset от перемешивания — реальный фикс ступора.
  - **Fix**: новая кнопка "Перемешать" рядом с Clear, перерисовывает order без изменений состояния.
- Нет keyboard shortcuts. `Enter`=Submit, `Esc`=Clear, `1-4 / QWER` для tabs / carts — не реализованы.

### 3. Foldwink Tabs + Wink

**Хорошо:**
- Уникальный в жанре. Стадийное раскрытие по буквам создаёт нарастающее напряжение.
- Wink даёт 1 бесплатный спасжилет — снимает фрустрацию при тупике.

**Можно лучше:**
- **Wink без подтверждения** — один тап, и дело сделано. Легко мисклик'нуть не по той категории. Проверить: может ли игрок "вернуть" Wink? (Нет, `canWinkGroup` проверяет `winkedGroupId === null`).
  - **Fix**: два-тап паттерн как у Quit ("Tap again to Wink") или явный overlay-вопрос.
- Счётчик `✦ wink ready/used` небольшой, справа сверху. Игрок может не заметить что Wink потрачен. **Сейчас OK**, но стоит проверить в dev.
- После Wink'а раскрытая категория показана крупно, но **нет инструкции** что делать дальше ("теперь найди эти 4 карты").

### 4. Результат и retention

**Grade-система — сильная:**
- flawless / one-mistake / two-mistakes / clutch + no-wink-bonus. Хорошее послевкусие.
- "Grade" отдельной плашкой — достоинство.

**Но:**
- **Share-текст скуп** (`share.ts:18-35`):
  - Формат: `Foldwink · Daily/#NNN\n{status}\n\n{emoji grid}\nneural-void.com/foldwink`
  - Нет заголовка пазла, нет Grade, нет difficulty.
  - Для Wordle-clone-культуры это OK, но Foldwink UPQ (unique product quality) — это категории и Wink. Share должен это показывать.
  - **Fix**: добавить опционально Grade и difficulty, сохраняя минимализм.
- После Win'а 3 CTA (`Next puzzle`, `Stats`, `Back to menu`). **Проблема** только для daily: `Next puzzle` скрыт, остаётся только `Stats` и `Back to menu`. Игрок ищет что делать → идёт в меню → видит daily done карточку → не очевидно куда нажать.
  - **Fix**: на result-экране daily-мода добавить CTA "Try a Standard puzzle" или автоматическое "Next puzzle" после паузы.

**Streak mechanic:**
- Стрики показываются, есть "new best streak" celebration.
- **Нет** milestone-событий (3 дня / 7 / 30 / 100). Нет бэджей.
- **Нет** календарного heatmap'а — только список Daily Archive.

### 5. Menu ergonomics

**Текущее состояние (после моих правок):**
- [Play today's] > [Easy] > [Medium | locked] > [Master | coming soon / locked] > [Stats]
- Footer: Sound | Haptics · Language · How to play · About · "500 puzzles"

**Проблемы:**
- **"Master Challenge — coming soon" навсегда** на RU/DE (hard-пула нет). Тупиковое обещание.
  - **Fix**: когда pool=0 + язык не EN → скрыть кнопку вообще, не показывать "coming soon".
- **Standard** название невыразительное. Это основной "песочница" режим — 500 пазлов, играй сколько хочешь. Могло бы быть "Exploration" / "Practice" / "Library" / "Free play".
- **Pool size счётчик** показывает число, но не сколько из них уже пройдено ("347 / 500"). Motivation-потенциал не реализован.
- Кнопка "Правила игры" (моя новая) в футере, мелкая. OK для повторного доступа.

### 6. Mobile UX

**Проверено в коде, не в браузере:**
- Тач-таргеты карточек large — good (aspect-[3/2] + min-size).
- Toggle/language кнопки в футере — ~20px высоты, ниже рекомендованных 44×44.
- Safe area paddings применяются (`fw-safe-pb`).
- Clear/Submit/Back кнопки достаточно крупные (px-5 py-3).

**Potentially problematic:**
- Длинные RU/DE слова на узком мобильном. Я добавил `hyphens-auto break-words` + уменьшил текст. Нужно проверить в dev.
- Landscape режим — нет явной адаптации. Карточки станут очень тонкими по вертикали.
- Swipe gestures? Нет (и возможно не надо — скучно но работает).

### 7. Accessibility

**Good:**
- aria-labels на toggle-ах (после моих правок)
- aria-live на выбор-индикатор
- Solved groups имеют глиф-маркеры ◆■ для colorblind
- Focus-trap в Onboarding (после моих правок)
- `prefers-reduced-motion` обслуживается в motion.ts

**Gaps:**
- **Нет keyboard shortcuts** — не только desktop-UX, но и a11y issue.
- Card aria-label при state=selected не объявляется переходом. Скринридер не скажет "selected".
- Submit button не даёт aria-live ответа.

### 8. Эмоциональная арка (через 7 сессий)

Представил 7-дневную сессию:

**День 1**: Onboarding → первая победа → Share. Эмоция: "A, забавно". **Надо добавить момент "Твой первый Foldwink!".**

**День 2-3**: Возвращение, daily, ещё одна победа. Стрик = 2, 3. Эмоция: "ok".

**День 4**: Проиграл daily. Streak обнулён. Эмоция: "blergh". **Здесь важно тёплое сообщение**, оно есть ("Every good solver..."). Хорошо.

**День 7**: Стрик 7, unlock Medium. Это единственный **настоящий milestone** в игре. Хорошо оркестрован.

**День 30**: Пройдено 30 пазлов. Ничего не случилось. Нет визуального маркера. **Gap**.

**День 100**: Если жив — badge? Ничего нет.

### 9. Звук

Не проверял реально, но код:
- useSound hook с набором: select/deselect/correct/wrong/win/loss/submit/tabReveal/wink
- Mute-persist в localStorage
- Single hook enforcement — есть

**Нельзя оценить без прослушивания**, но архитектурно солидно.

---

## ПРИОРИТЕТЫ И КРУТИЗНА

### 🔥 P0 — high value, low effort (~1-2 часа каждое)
1. **"One away" feedback** — добавить в `submit.ts` детектор частичного совпадения (3 из 4). Показать в UI слабым жёлтым tint / текстом "one away" / "eins daneben" / "одна мимо".
2. **Wink confirm (2-tap)** — защита от мисклика.
3. **Hide Master на языках без контента** — убрать "coming soon" промис, когда pool=0.
4. **Enter=Submit, Esc=Clear** — keyboard shortcuts.
5. **Shuffle button** — новая кнопка рядом с Clear.

### 🎯 P1 — high value, medium effort (~2-4 часа каждое)
6. **Better share-text** — опционально difficulty + grade + hash.
7. **First-win celebration beat** — баннер/анимация при первой в жизни победе.
8. **Streak milestones** — бэджи на 3/7/30 дней.
9. **Daily-done → Standard CTA** — явно увести игрока из countdown-тупика.
10. **Переименовать Standard → Explore / Library** — и добавить прогресс "347 / 500".

### 💎 P2 — polish
11. **Difficulty icons в меню** — визуальный ритм.
12. **Tap on selected card explanation** — микро-туториал показать, что тап снимает выбор.
13. **Timer toggle (zen mode)** — опция скрыть таймер.
14. **Achievement-плашки на StatsScreen** — flawless × 10, no-wink-medium × 5.
15. **Puzzle-completion heatmap** для Standard mode (какие пройдены).

---

## ЧТО ПОТРЕБУЕТ БРАУЗЕРНОГО ТЕСТА (не могу сам)

- Реальная адекватность mobile (iOS Safari, Android Chrome) — viewport, safe area, touch target feel
- Звук — палитра, громкость, интрузивность
- Haptic pattern — ощущение на реальном устройстве
- Performance на низких устройствах (1500 JSON файлов в бандле)
- Реальная скорость solve у живого человека (насколько "2–5 минут" правдиво)

Рекомендую собрать 2-3 живых тестеров и посмотреть session recording (например, Fullstory/Hotjar — но это backend, противоречит CLAUDE.md — значит, живьём).

---

## ОЦЕНКА ПО ДОМЕНАМ

| Домен | Score | Комментарий |
|---|---|---|
| Core mechanics | 8/10 | Надёжно, нет bug'ов. Gap: no "one away", no shuffle. |
| Feedback quality | 7/10 | Хорошо, но win/lose реакции плоские в долгой перспективе. |
| Progression | 6/10 | Easy → Medium unlock норм. Дальше — ничего. |
| Retention | 5/10 | Нет milestone'ов, нет календаря прогресса. Daily = hard-coded ritual, больше ничего. |
| Onboarding | 8/10 | Чисто, понятно, re-accessible. |
| Accessibility | 6/10 | Markers хорошо, keyboard и aria-states надо дотянуть. |
| Mobile ergonomics | 7/10 | Базово OK, footer-кнопки мелковаты. |
| Share / virality | 5/10 | Emoji-grid работает, но нет отличительных черт Foldwink в share. |
| Unique selling point | 9/10 | Foldwink Tabs + Wink — настоящая инновация. Удерживает. |
| **Weighted total** | **6.8/10** | Крепко. До 8.5+ можно дотянуть за 1 sprint из 5-8 фиксов. |

---

## Рекомендуемый следующий sprint (после культурного ревью)

1. One-away feedback (submit + UI + i18n)
2. Shuffle button
3. Wink confirm
4. Keyboard shortcuts
5. Hide Master на RU/DE без контента
6. First-win celebration
7. Rich share-text

Это — **5-6 часов работы**, подъём с 6.8 до ~8.5 по субъективной оценке.
