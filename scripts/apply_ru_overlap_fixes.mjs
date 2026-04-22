import fs from 'node:fs';
import path from 'node:path';

// REPLACE: [puzzleId, oldItem, newItem, groupLabel]
// Skipped from validator list: ru-0071 (RESTRUCTURE), ru-0203 (RESTRUCTURE),
// ru-0458 REPLACE (superseded by RELABEL).
const REPLACE = [
  ['ru-0020', 'Шмель', 'Махаон', 'Бабочки и стрекозы'], // label after RELABEL (applied first)
  ['ru-0026', 'Кушетка', 'Двухъярусная кровать', 'Мебель для сна'],
  ['ru-0032', 'Рыбные котлеты', 'Филе на пару', 'Блюда из рыбы'],
  ['ru-0036', 'Аджика', 'Соевый соус', 'Соусы'],
  ['ru-0046', 'Водное поло', 'Сёрфинг', 'Водные виды'],
  ['ru-0137', 'Голубика', 'Княженика', 'Болотные'],
  ['ru-0147', 'Айс латте', 'Эспрессо-тоник', 'Холодные'],
  ['ru-0151', 'Мцвади', 'Шашлык из говядины', 'Виды шашлыка'],
  ['ru-0269', 'US Open', 'ATP Finals', 'Теннис'],
  ['ru-0330', 'Агорафобия', 'Эритрофобия', 'Социальные'],
  ['ru-0404', 'Извержение вулкана', 'Степной пожар', 'Огненные'],
  ['ru-0404', 'Лавовый поток', 'Молния', 'Огненные'],
  ['ru-0436', 'ВМФ России', 'ВМС Индии', 'Современные флоты'],
  ['ru-0484', 'Садовые ножницы', 'Тяпка', 'Садовые'],
  ['ru-0493', 'Базилик', 'Сельдерей', 'Кулинарные травы'],
  ['ru-0496', 'Пахта', 'Имбирное пиво', 'Напитки'],
];

// RELABEL: [puzzleId, oldLabel, newLabel]
// Applied BEFORE REPLACE so REPLACE can target the new label.
const RELABEL = [
  ['ru-0016', 'Домашний скот', 'Крупный рогатый и тягловый'],
  ['ru-0020', 'Летающие насекомые', 'Бабочки и стрекозы'],
  ['ru-0050', 'Летняя олимпиада', 'Лето: многоборья и стрельба'],
  ['ru-0065', 'Яркие звёзды неба', 'Звёзды главной последовательности'],
  ['ru-0070', 'Озёра Северо-Запада', 'Малые озёра Северо-Запада'],
  ['ru-0097', 'Советские поэты', 'Советские поэты 1920–50-х'],
  ['ru-0140', 'Терапевтические', 'Внутренние органы'],
  ['ru-0145', 'Традиционные восточные', 'Тюркско-кавказские напитки'],
  ['ru-0166', 'Советские поэты', 'Советские поэты 1920–50-х'],
  ['ru-0213', 'На улице', 'Догонялки и прятки'],
  ['ru-0229', 'Терапия', 'Взрослая терапия'],
  ['ru-0232', 'Олимпийцы', 'Верховные олимпийцы'],
  ['ru-0258', 'Фильмы Кубрика', 'Невоенные фильмы Кубрика'],
  ['ru-0258', 'Военные', 'Военные фильмы Кубрика'],
  ['ru-0281', 'Фортепианные', 'Фортепианные миниатюры'],
  ['ru-0295', 'Советская комедия', 'Комедии Гайдая'],
  ['ru-0308', 'Альтернативные', 'Экспериментальные и новые'],
  ['ru-0367', 'Зарубежные', 'Сказка и фэнтези'],
  ['ru-0395', 'Сплавы', 'Цветные сплавы'],
  ['ru-0415', 'Зелёная', 'Зелёная (не-гидро)'],
  ['ru-0421', 'Эмпирические', 'Общенаучные эмпирические'],
  ['ru-0439', 'Известные звёзды', 'Исторические имена звёзд'],
  ['ru-0457', 'Части самолёта', 'Корпусные агрегаты'],
  ['ru-0458', 'Лирические', 'Мирная лирика'],
  ['ru-0474', 'Исторические', 'Парусные флагманы'],
];

const DIRS = ['puzzles/ru/pool', 'puzzles/ru-drafts'];
const log = [];
let relabelOk = 0, relabelSkip = 0, replaceOk = 0, replaceSkip = 0;

function isDraft(dir) { return dir.includes('ru-drafts'); }

function serializeDraft(puzzle) {
  const lines = ['{'];
  lines.push(`  "id": ${JSON.stringify(puzzle.id)},`);
  lines.push(`  "title": ${JSON.stringify(puzzle.title)},`);
  lines.push(`  "difficulty": ${JSON.stringify(puzzle.difficulty)},`);
  lines.push(`  "meta": ${JSON.stringify(puzzle.meta)},`);
  lines.push(`  "groups": [`);
  const gl = puzzle.groups.map(g => {
    const kv = [`"id": ${JSON.stringify(g.id)}`, `"label": ${JSON.stringify(g.label)}`];
    if (g.revealHint !== undefined) kv.push(`"revealHint": ${JSON.stringify(g.revealHint)}`);
    kv.push(`"items": ${JSON.stringify(g.items)}`);
    return `    { ${kv.join(', ')} }`;
  });
  lines.push(gl.join(',\n'));
  lines.push(`  ]`);
  lines.push(`}`);
  return lines.join('\n') + '\n';
}

function loadSave(file, draft) {
  const puzzle = JSON.parse(fs.readFileSync(file, 'utf8'));
  return {
    puzzle,
    save: () => fs.writeFileSync(file, draft ? serializeDraft(puzzle) : JSON.stringify(puzzle, null, 2) + '\n', 'utf8'),
  };
}

// Pass 1: RELABEL (so REPLACE can target new labels)
for (const dir of DIRS) {
  for (const [id, oldLabel, newLabel] of RELABEL) {
    const file = path.join(dir, `${id}.json`);
    if (!fs.existsSync(file)) { log.push(`RELABEL MISS: ${file}`); relabelSkip++; continue; }
    const { puzzle, save } = loadSave(file, isDraft(dir));
    const g = puzzle.groups.find(x => x.label === oldLabel);
    if (!g) { log.push(`RELABEL NO-GROUP: ${file} "${oldLabel}"`); relabelSkip++; continue; }
    g.label = newLabel;
    save();
    log.push(`RELABEL OK: ${file} "${oldLabel}" → "${newLabel}"`);
    relabelOk++;
  }
}

// Pass 2: REPLACE
for (const dir of DIRS) {
  for (const [id, oldItem, newItem, groupLabel] of REPLACE) {
    const file = path.join(dir, `${id}.json`);
    if (!fs.existsSync(file)) { log.push(`REPLACE MISS: ${file}`); replaceSkip++; continue; }
    const { puzzle, save } = loadSave(file, isDraft(dir));
    const g = puzzle.groups.find(x => x.label === groupLabel);
    if (!g) { log.push(`REPLACE NO-GROUP: ${file} "${groupLabel}"`); replaceSkip++; continue; }
    const idx = g.items.indexOf(oldItem);
    if (idx === -1) { log.push(`REPLACE NO-ITEM: ${file} "${oldItem}" in "${groupLabel}"`); replaceSkip++; continue; }
    g.items[idx] = newItem;
    save();
    log.push(`REPLACE OK: ${file} "${oldItem}" → "${newItem}"`);
    replaceOk++;
  }
}

console.log(log.join('\n'));
console.log(`\nRELABEL: ${relabelOk} ok, ${relabelSkip} skipped (expected ${RELABEL.length * DIRS.length}).`);
console.log(`REPLACE: ${replaceOk} ok, ${replaceSkip} skipped (expected ${REPLACE.length * DIRS.length}).`);
