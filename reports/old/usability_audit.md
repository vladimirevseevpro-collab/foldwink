# Foldwink Usability & UX Audit — 2026-04-19

Review target: "золотой стандарт". Сканировал все экраны (Menu, Game, Result, Stats, Onboarding) и компоненты. Находки отсортированы по влиянию на пользователя.

---

## Резюме

**Главное**: i18n реализован лишь на 30% поверхности. На RU/DE языках пользователь видит:
- Полностью английский экран статистики
- Английскую надпись "Mistakes" в игре, "Foldwink Tabs", "wink ready"
- Английские подписи в заголовке пазла ("EASY · standard · replay")
- Английский share-card и share-текст
- Английские метки прогрессии под кнопками Medium/Master
- Английский About-футер, таймер "Next daily in …", архив ежедневок
- Английский результат-экран: "Solved", "Time", "Mistakes", "Streak", "Daily · 2026-04-19"

Это делает перевод UI формально "есть", по факту разбитым. Для "золотого стандарта" — это №1 блокер.

Остальные находки — доступность, обратимость действий, truncation на мобильных.

---

## P0 — Критично (видимая фрагментация интерфейса)

### 1. `StatsScreen.tsx` полностью не переведён
`src/screens/StatsScreen.tsx:33-94` — хардкод: "Your Foldwink record", "Solved", "Played", "Win %", "Wins", "Losses", "Streak", "Best", "Depth", "Flawless", "Avg miss", "Med W%", "Winks", "Daily history", "Empty record", "No puzzles played yet...", "Back to menu".
**Fix**: добавить `stats.*` блок в `strings.ts` для всех 3 языков; прогнать через `useT()`.

### 2. Game header: difficulty и mode не переведены
`src/screens/GameScreen.tsx:121` — `puzzle.difficulty.toUpperCase()` → "EASY"/"MEDIUM"; `active.mode` → "standard"/"daily"; " · replay" — английский литерал.
**Fix**: словарь `difficulty.easy/medium/hard` + `mode.daily/standard` + `mode.replay` в strings.

### 3. `MistakesDots.tsx:14` — "Mistakes" хардкод
**Fix**: `t.game.mistakesLabel`.

### 4. `FoldwinkTabs.tsx:31-44` — "Foldwink Tabs", "X/4 solved", "wink ready/used" хардкод
**Fix**: ключи `tabs.label`, `tabs.solvedCount(n)`, `tabs.winkReady/Used/Label`. (Сам бренд "Foldwink" можно оставить.)

### 5. Result subtitle и prose не переведены
`src/screens/ResultScreen.tsx:57-59` — `Daily · ${date}` / `Standard · #...` хардкод.
`src/components/ResultSummary.tsx:15,25,31-45` — "Solved", "Out of mistakes", "Foldwink · cleared/close call", "Time", "Mistakes", "Streak".
**Fix**: `t.result.*` + `t.resultSummary.*`.

### 6. `ShareButton.tsx:139-143` — весь UX share на EN
"Share result", "Preparing…", "Copied!", "Saved image", "Share unavailable".
**Fix**: `t.share.*`.

### 7. `DailyCountdown.tsx:16` — "Next daily in" хардкод
`DailyCompleteCard.tsx:24` — "Daily · solved/missed" хардкод.
`DailyArchive.tsx:23, 40` — "No daily history yet...", "Solved/Failed" хардкод.
**Fix**: отдельный блок `t.daily.*`.

### 8. `buildShareString` (share.ts:18-25) — шапка + `Solved in X · Y/4 mistakes` на EN
Означает: русский игрок делится текстом на английском. Для "золотого стандарта" недопустимо.
**Fix**: принимать `lang` или `strings.share` в `ShareContext` и строить локализованно.

### 9. `readiness.ts:227-267` — все labels/captions для Medium/Master на EN
"Master Challenge — locked", "X more Medium wins to unlock", "Hard puzzles coming soon" и т.д. видны в меню под кнопками.
**Fix**: вынести строки наружу, принимать `t` параметром или вернуть ключи вместо литералов.

### 10. `AboutFooter.tsx` — весь текст на EN
Privacy-параграф, support-адрес (OK), "Clear local event log", "Reset all local data", двойной tap текст — всё EN.
**Fix**: `t.about.*`.

### 11. `SoundToggle.tsx:9`, `HapticsToggle.tsx` — "Sound on/off" хардкод
Проверить `HapticsToggle.tsx` тоже. **Fix**: `t.settings.sound*` / `haptics*`.

---

## P1 — Высокий приоритет (UX/доступность)

### 12. Truncation карточек на узких экранах
На скриншоте "Шампанское" обрезается (хвост скрыт за фиксированной шириной карточки). Сейчас max-item=22 символа, но карточка шире только в десктопе. На мобильных длинные слова ломают читаемость.
**Fix**: уменьшить `text-xs` до `text-[11px]` на ≤360px или сократить `MAX_ITEM` до 18. Вариант попроще — `text-balance` и `leading-tight` уже есть, нужно `break-words` + возможно auto-fit шрифт.

### 13. "Quit to menu" без подтверждения
`GameScreen.tsx:200` — маленькая ссылка подчёркиванием, один клик — игра прерывается. Сейчас есть resume-session (из памяти), но если мисс-тап на мобильном — игрок недоумевает.
**Fix**: первый клик → состояние "armed" с текстом "tap again to quit" (паттерн как в `AboutFooter` reset), 3 сек таймаут.

### 14. Mid-game обратимость выбора
Нельзя "отменить" submit после подтверждения (логично, это правила). Но: нет UNDO на tap карточки по ошибке. Сейчас кнопка "Снять выбор" сбрасывает все 4. Хорошо бы: второй tap на уже выбранной карточке снимает её. **Проверить** — возможно уже работает, надо тестом подтвердить.

### 15. Onboarding показывается только при `!onboarded`
Было: после закрытия — потеряны навсегда. **Исправлено в этой сессии** (добавлена ссылка "Правила" в футер меню + модалку можно переоткрыть). Осталось проверить визуально в dev.

### 16. Первый paint до открытия onboarding
`Wordmark` подзаголовок `t.menu.subtitle` отрисовывается за модалкой на исходном системном языке до того, как игрок сможет переключить. Не страшно (onboarding закроет), но есть edge: если `navigator.language` вернул 'en-US' а игрок хочет RU — подложка меню на EN. Минор.

### 17. Нет явного индикатора "язык определён автоматически"
Первый-time игрок не знает, что пилюля [EN|DE|RU] — переключатель. Всё нормально, но может быть текст-подсказка первый раз: "We matched your system language. Tap to change." **Nice-to-have**, не критично.

### 18. `aria-label` интерактивных элементов на EN
`LanguageToggle.tsx:13` → `aria-label="Language"`; `MistakesDots.tsx:12` → `"Mistakes used X of 4"`; `Onboarding.tsx:14` → `"How to play Foldwink"`. Скринридер пользователя на RU прочитает по-английски.
**Fix**: локализовать aria-labels.

### 19. Таббирование и клавиатура
Карточки — `button`-ы (хорошо, фокусируются). `Onboarding.tsx` — нет focus trap, Tab может улететь на фон. ModalEssentials: нужен focus-trap + Escape для закрытия.

### 20. Touch-target размер
`ShareButton`/`Button` — OK. Но футер меню `[EN|DE|RU]` + кнопки "Правила"/"About" — высота ~20px, это меньше рекомендованных 44×44 Apple. На мобильном легко промахнуться.

---

## P2 — Средний (полировка)

### 21. Difficulty в игре часто бесполезно на табах
`GameScreen.tsx:121` — "EASY · standard". Игрок уже выбрал сложность. Ценность показа в игре — низкая. Можно убрать строку или показать только `active.mode` при `daily` (важный контекст), убрать при `standard`.

### 22. Стат "Avg miss 2.3" — неинтуитивно
Без легенды "2.3" — это что? Максимум 4. Ожидание: "X/4" или тултип. **Fix**: `"Avg miss — 2.3/4"` или `"Avg miss per game"`.

### 23. Share-card текст под картинкой
Когда native share не поддерживает файлы, падает на текст. Текст из share.ts — только сетка эмодзи. Можно добавить emoji-градацию результата (🏆 для flawless, ✨ для wink-less medium).

### 24. "Next puzzle" на Result — нет индикации «из пула закончились»
Если игрок прошёл все 500, что будет? Loader перезапускается по модулю (`loaderRu.ts:58`). То есть пазлы повторятся. Нужна либо индикация "вы прошли все 500!" либо сброс прогрессии.

### 25. `Wordmark` + BrandMark
`Wordmark.tsx:34` — "Foldwink" жёстко жирный. Хорошо. Но `subtitle` переводится, а "by Neural Void" — нет. OK (это бренд).

### 26. Iphone-tip в меню — форма
`MenuScreen.tsx:162-164` — склеивание JSX и literal'ов `"tap Safari's ... button, then ..."`. Для RU/DE это читается как "нажми Safari's Поделиться button, then На экран «Домой»". Сломанная грамматика.
**Fix**: сделать подсказку одной строкой в strings, без вставок.

### 27. Обратный отсчёт до следующего daily
Слоган "Next daily in HH:MM:SS" — полезно. Но на DailyCompleteCard он дублируется (и в самой карточке, и ниже). **Fix**: показать один раз.

### 28. "Replay" помечен в subtitle крошечным `· replay`
Игрок может не заметить, что очередная daily-попытка не влияет на стату. Нужен явнее акцент — `badge` или контрастная плашка.

### 29. Hard puzzles отсутствуют (pool=0 для hard в RU/DE)
`readiness.ts:227` — "Hard puzzles coming soon" показывается. Но кнопка Master при пустом hard-пуле просто disabled. На RU/DE hard пазлов нет вовсе — это означает, что master forever disabled. Нужно либо скрыть master на языках без контента, либо сгенерировать hard-пазлы (на будущее).

### 30. Empty-pool сценарий
`MenuScreen.tsx:76` — `empty` показывает "Пул пуст, добавь JSON...". Это devmsg, у пользователя не должно быть такого состояния в prod.
**Fix**: если в prod — дружественнее ("Foldwink временно недоступен"). Но вероятность = 0 если build включает пазлы. Оставить можно.

---

## P3 — Низкий приоритет / nice-to-have

### 31. Motion / transitions
Нет перехода между screens (menu→game). Резкая смена. Можно `fw-fade` (есть motion.ts) на 150ms.

### 32. Haptics / sound
Проверить, что mute сохраняется между языками (должен — persist общий).

### 33. Keyboard shortcuts
`Enter` = Submit (есть?), `Esc` = Clear (нет?). Desktop UX не использует клавиатуру.

### 34. Cleared stats — бэдж
`ResultSummary` "✓ flawless" или "✓ no wink" — маленький бонусный бэдж при особых win'ах.

### 35. Стат-бейдж "500/500"
На StatsScreen "Solved" показывает число, но не из скольких возможных. "347/500" было бы мотивацией.

---

## Сколько работы

Если принять все P0 (i18n-починка) — это одна пачка строк + замена ~15 хардкодов на `useT()`. Приблизительно 2–3 часа аккуратной работы + тесты. Без API-агентов, руками.

P1 — ещё 1–2 часа (modal focus trap, confirm quit, aria-labels).

P2/P3 — по желанию, отдельные подходы.

---

## Рекомендуемый следующий шаг

Начать с **P0 пакетом** (вся i18n-доделка одним коммитом). Закоммитить → проверить в dev-сборке на RU. Потом перейти к P1. Потом — дождаться сброса квоты (5 утра по Берлину) и добить культурный ревью оставшихся 7 батчей.
