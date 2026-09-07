/**
 * Apply approved cultural-review fixes to puzzles/ru/pool and puzzles/de/pool.
 * Each fix: { file, group, from, to, reason } — replaces `from` item inside
 * the given group with `to`. Skips fix if item not found (idempotent).
 *
 * Usage: node scripts/apply-cultural-fixes.mjs
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve("puzzles");

const fixes = [
  // === RU ===
  {
    file: "ru/pool/ru-0001.json",
    group: "Персонажи праздника",
    from: "Снежинка",
    to: "Зайчик",
    reason: "ёлочный детский костюм, антропоморф",
  },
  {
    file: "ru/pool/ru-0017.json",
    group: "Полярные животные",
    from: "Пингвин",
    to: "Песец",
    reason: "пингвин не арктический",
  },
  {
    file: "ru/pool/ru-0029.json",
    group: "Классическая обувь",
    from: "Лоферы",
    to: "Полуботинки",
    reason: "нишевый термин",
  },
  {
    file: "ru/pool/ru-0029.json",
    group: "Спортивная обувь",
    from: "Кроки",
    to: "Мокасины",
    reason: "торговая марка вместо типа",
  },
  {
    file: "ru/pool/ru-0066.json",
    group: "Америки",
    from: "Карибы",
    to: "Центральная Америка",
    reason: "архипелаг не материк",
  },
  {
    file: "ru/pool/ru-0066.json",
    group: "Америки",
    from: "Гренландия",
    to: "Латинская Америка",
    reason: "остров не материк",
  },
  {
    file: "ru/pool/ru-0072.json",
    group: "Страны Балтии",
    from: "Беларусь",
    to: "Польша",
    reason: "Беларусь не Балтия",
  },
  {
    file: "ru/pool/ru-0073.json",
    group: "Столицы Африки",
    from: "Лагос",
    to: "Абуджа",
    reason: "столица Нигерии — Абуджа",
  },
  {
    file: "ru/pool/ru-0094.json",
    group: "Сказочные богатыри",
    from: "Буян",
    to: "Алёша Попович",
    reason: "Буян — остров, не богатырь",
  },
  {
    file: "ru/pool/ru-0099.json",
    group: "Советские сатирики",
    from: "Аверченко",
    to: "Зощенко",
    reason: "Аверченко эмигрант, не советский",
  },
  {
    file: "ru/pool/ru-0340.json",
    group: "Зарубежные",
    from: "Бажов",
    to: "Шарль Перро",
    reason: "Бажов советский",
  },
  {
    file: "ru/pool/ru-0341.json",
    group: "Северное Возрождение",
    from: "Рубенс",
    to: "Босх",
    reason: "Рубенс — барокко, не Северное Возрождение",
  },
  {
    file: "ru/pool/ru-0367.json",
    group: "Про животных",
    from: "Мцыри",
    to: "Каштанка",
    reason: "Мцыри не про животных",
  },
  {
    file: "ru/pool/ru-0373.json",
    group: "Нацпарки",
    from: "Байкальский",
    to: "Прибайкальский",
    reason: "нет парка с таким названием",
  },
  {
    file: "ru/pool/ru-0373.json",
    group: "Мировые парки",
    from: "Кроконгер",
    to: "Крюгер",
    reason: "искажённое имя",
  },
  {
    file: "ru/pool/ru-0384.json",
    group: "Казачество",
    from: "Гопак",
    to: "Шашка",
    reason: "Гопак — украинский танец",
  },
  {
    file: "ru/pool/ru-0386.json",
    group: "Мексиканские",
    from: "Чимичурри",
    to: "Пико-де-гальо",
    reason: "Чимичурри — аргентинский",
  },
  {
    file: "ru/pool/ru-0398.json",
    group: "Социальные планеты",
    from: "Марс",
    to: "Юпитер",
    reason: "Марс — личная планета в астрологии",
  },
  {
    file: "ru/pool/ru-0319.json",
    group: null,
    from: "Коблодо",
    to: "Кобидо",
    reason: "искажённая транслитерация",
  },
  {
    file: "ru/pool/ru-0325.json",
    group: null,
    from: "Копполла",
    to: "Коппола",
    reason: "орфография",
  },
  {
    file: "ru/pool/ru-0325.json",
    group: null,
    from: "Германн",
    to: "Герман",
    reason: "орфография",
  },
  { file: "ru/pool/ru-0311.json", group: null, from: "Ноя", to: "Ной", reason: "падеж" },

  // === DE ===
  {
    file: "de/pool/de-0021.json",
    group: "Westdeutsche Länder",
    from: "Sachsen-Anhalt",
    to: "Hessen",
    reason: "Sachsen-Anhalt — новое (восточное) земля",
  },
  { file: "de/pool/de-0051.json", group: null, from: "Stolen", to: "Stollen", reason: "Typo" },
  {
    file: "de/pool/de-0095.json",
    group: null,
    from: "Papin",
    to: "Guericke",
    reason: "Papin — француз",
  },
  {
    file: "de/pool/de-0098.json",
    group: null,
    from: "Mead",
    to: "Met",
    reason: "англ. в немецком пазле",
  },
  {
    file: "de/pool/de-0100.json",
    group: "Stadtlegenden",
    from: "Golem",
    to: "Rübezahl",
    reason: "Golem — чешская сага",
  },
  {
    file: "de/pool/de-0101.json",
    group: "Große Fünf",
    from: "Nashornvogel",
    to: "Nashorn",
    reason: "каноничные Big Five",
  },
  {
    file: "de/pool/de-0181.json",
    group: "Tornados",
    from: "Alley",
    to: "Tornado Alley",
    reason: "обрезанный термин",
  },
  {
    file: "de/pool/de-0183.json",
    group: "Bedrohte Vögel",
    from: "Sifaka",
    to: "Waldrapp",
    reason: "Sifaka — лемур, не птица",
  },
  {
    file: "de/pool/de-0204.json",
    group: "Kaiser",
    from: "Karl I.",
    to: "Wilhelm I.",
    reason: "Karl I. — австро-венгерский",
  },
  {
    file: "de/pool/de-0228.json",
    group: "Schätze und Gegenstände",
    from: "Gungnir",
    to: "Tarnkappe",
    reason: "Gungnir — Odin, не Нибелунги",
  },
  {
    file: "de/pool/de-0233.json",
    group: "Werke 20. Jh.",
    from: "Der Prozess",
    to: "Im Westen nichts Neues",
    reason: "Kafka — не немец",
  },
  {
    file: "de/pool/de-0243.json",
    group: "Deutsche Pop-Künstler",
    from: "Udo Jürgens",
    to: "Udo Lindenberg",
    reason: "Jürgens — австриец",
  },
  {
    file: "de/pool/de-0246.json",
    group: "Berühmte Clubs",
    from: "Fabric",
    to: "Tresor",
    reason: "Fabric — лондонский",
  },
  {
    file: "de/pool/de-0252.json",
    group: "Bauhaus-Standorte",
    from: "Chicago",
    to: "Weimar",
    reason: "Chicago — не Bauhaus",
  },
  {
    file: "de/pool/de-0260.json",
    group: "Jugendstil-Kunsthandwerk",
    from: "Tiffany-Lampe",
    to: "WMF-Krug",
    reason: "Tiffany — американец",
  },
  {
    file: "de/pool/de-0262.json",
    group: "Streetwear-Marken",
    from: "G-Star Raw",
    to: "Trigema",
    reason: "G-Star — голландская",
  },
  {
    file: "de/pool/de-0361.json",
    group: "Öl auf Leinwand",
    from: "Die Schreier",
    to: "Die Nachtwache",
    reason: "Der Schrei — не масло на холсте",
  },
  {
    file: "de/pool/de-0388.json",
    group: "Eiszeiten",
    from: "Snowball Earth",
    to: "Günz",
    reason: "Snowball Earth — другая эра",
  },
  {
    file: "de/pool/de-0401.json",
    group: null,
    from: "Birkenbaum",
    to: "Kirschbaum",
    reason: "плеоназм",
  },
  {
    file: "de/pool/de-0413.json",
    group: "Aufklärung",
    from: "Frederick der Große",
    to: "Friedrich der Große",
    reason: "англ. имя",
  },
  {
    file: "de/pool/de-0440.json",
    group: "Apostel Jesu",
    from: "Paulus",
    to: "Andreas",
    reason: "Paulus не один из 12",
  },
  {
    file: "de/pool/de-0446.json",
    group: "Surrealisten",
    from: "Frida Kahlo",
    to: "Yves Tanguy",
    reason: "Kahlo — не сюрреалист",
  },
  {
    file: "de/pool/de-0480.json",
    group: "Mol. Küche Köche",
    from: "Thomas Keller",
    to: "Wylie Dufresne",
    reason: "Keller — классика, не мол. кухня",
  },
];

let appliedCount = 0;
let skippedCount = 0;
const missing = [];

for (const fix of fixes) {
  const filepath = path.join(ROOT, fix.file);
  if (!fs.existsSync(filepath)) {
    missing.push(`${fix.file} (file missing)`);
    continue;
  }
  const raw = JSON.parse(fs.readFileSync(filepath, "utf8"));
  let patched = false;
  for (const group of raw.groups) {
    if (fix.group !== null && group.label !== fix.group) continue;
    const idx = group.items.indexOf(fix.from);
    if (idx === -1) continue;
    // Avoid creating duplicates.
    if (group.items.includes(fix.to)) {
      missing.push(`${fix.file}: "${fix.to}" already exists in "${group.label}"`);
      continue;
    }
    group.items[idx] = fix.to;
    patched = true;
  }
  if (patched) {
    fs.writeFileSync(filepath, JSON.stringify(raw, null, 2) + "\n", "utf8");
    console.log(`✓ ${fix.file}: "${fix.from}" → "${fix.to}" (${fix.reason})`);
    appliedCount++;
  } else {
    missing.push(`${fix.file}: "${fix.from}" not found in group "${fix.group ?? "*"}"`);
    skippedCount++;
  }
}

console.log("");
console.log(`Applied: ${appliedCount}`);
console.log(`Skipped: ${skippedCount}`);
if (missing.length > 0) {
  console.log("");
  console.log("Not applied:");
  for (const m of missing) console.log("  " + m);
}
