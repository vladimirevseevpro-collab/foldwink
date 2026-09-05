export interface PalimpsestGroup {
  id: string;
  label: string;
  revealHint: string;
  items: [string, string, string, string];
}

export interface PalimpsestLayer {
  name: "obverse" | "reverse";
  title: string;
  description: string;
  groups: [PalimpsestGroup, PalimpsestGroup, PalimpsestGroup, PalimpsestGroup];
}

export interface PalimpsestPuzzle {
  id: string;
  title: string;
  allWords: readonly string[];
  obverse: PalimpsestLayer;
  reverse: PalimpsestLayer;
}

export const PALIMPSEST_EN: PalimpsestPuzzle = {
  id: "palimpsest_en_01",
  title: "The Dual Codex",
  allWords: [
    "BANJO", "SAX", "CELLO", "MANDOLIN",
    "BLADE", "SWORD", "CANNON", "MACE",
    "BUZZARD", "SWAN", "CRANE", "MAGPIE",
    "BOOT", "SANDAL", "CLOG", "MOCCASIN",
  ],
  obverse: {
    name: "obverse",
    title: "Obverse Layer: Semantic Domains",
    description: "Group the 16 words by their physical meaning.",
    groups: [
      {
        id: "en_obs_1",
        label: "Musical Instruments",
        revealHint: "INSTRUMENTS",
        items: ["BANJO", "SAX", "CELLO", "MANDOLIN"],
      },
      {
        id: "en_obs_2",
        label: "Historic Weapons",
        revealHint: "WEAPONS",
        items: ["BLADE", "SWORD", "CANNON", "MACE"],
      },
      {
        id: "en_obs_3",
        label: "Species of Birds",
        revealHint: "BIRDS",
        items: ["BUZZARD", "SWAN", "CRANE", "MAGPIE"],
      },
      {
        id: "en_obs_4",
        label: "Types of Footwear",
        revealHint: "FOOTWEAR",
        items: ["BOOT", "SANDAL", "CLOG", "MOCCASIN"],
      },
    ],
  },
  reverse: {
    name: "reverse",
    title: "Reverse Layer: Orthographic Code",
    description: "The ink has shifted. Group the exact same 16 words by their initial letter.",
    groups: [
      {
        id: "en_rev_1",
        label: "Starts with 'B'",
        revealHint: "LETTER B",
        items: ["BANJO", "BLADE", "BUZZARD", "BOOT"],
      },
      {
        id: "en_rev_2",
        label: "Starts with 'S'",
        revealHint: "LETTER S",
        items: ["SAX", "SWORD", "SWAN", "SANDAL"],
      },
      {
        id: "en_rev_3",
        label: "Starts with 'C'",
        revealHint: "LETTER C",
        items: ["CELLO", "CANNON", "CRANE", "CLOG"],
      },
      {
        id: "en_rev_4",
        label: "Starts with 'M'",
        revealHint: "LETTER M",
        items: ["MANDOLIN", "MACE", "MAGPIE", "MOCCASIN"],
      },
    ],
  },
};

export const PALIMPSEST_RU: PalimpsestPuzzle = {
  id: "palimpsest_ru_01",
  title: "Двусторонний Кодекс",
  allWords: [
    "БАРАБАН", "СКРИПКА", "КЛАРНЕТ", "ТРУБА",
    "БЕРКУТ", "СОКОЛ", "КОРШУН", "ТЕТЕРЕВ",
    "БОТИНКИ", "САПОГИ", "КЕДЫ", "ТУФЛИ",
    "БУЛАВА", "САБЛЯ", "КИНЖАЛ", "ТОПОР",
  ],
  obverse: {
    name: "obverse",
    title: "Лицевая сторона: Семантика",
    description: "Сгруппируйте 16 слов по их прямому смысловому значению.",
    groups: [
      {
        id: "ru_obs_1",
        label: "Музыкальные инструменты",
        revealHint: "ИНСТРУМЕНТЫ",
        items: ["БАРАБАН", "СКРИПКА", "КЛАРНЕТ", "ТРУБА"],
      },
      {
        id: "ru_obs_2",
        label: "Хищные птицы",
        revealHint: "ПТИЦЫ",
        items: ["БЕРКУТ", "СОКОЛ", "КОРШУН", "ТЕТЕРЕВ"],
      },
      {
        id: "ru_obs_3",
        label: "Виды обуви",
        revealHint: "ОБУВЬ",
        items: ["БОТИНКИ", "САПОГИ", "КЕДЫ", "ТУФЛИ"],
      },
      {
        id: "ru_obs_4",
        label: "Старинное оружие",
        revealHint: "ОРУЖИЕ",
        items: ["БУЛАВА", "САБЛЯ", "КИНЖАЛ", "ТОПОР"],
      },
    ],
  },
  reverse: {
    name: "reverse",
    title: "Оборотная сторона: Ортогональный шифр",
    description: "Слова те же, но правило изменилось. Сгруппируйте их по начальной букве.",
    groups: [
      {
        id: "ru_rev_1",
        label: "Начинается на «Б»",
        revealHint: "БУКВА Б",
        items: ["БАРАБАН", "БЕРКУТ", "БОТИНКИ", "БУЛАВА"],
      },
      {
        id: "ru_rev_2",
        label: "Начинается на «С»",
        revealHint: "БУКВА С",
        items: ["СКРИПКА", "СОКОЛ", "САПОГИ", "САБЛЯ"],
      },
      {
        id: "ru_rev_3",
        label: "Начинается на «К»",
        revealHint: "БУКВА К",
        items: ["КЛАРНЕТ", "КОРШУН", "КЕДЫ", "КИНЖАЛ"],
      },
      {
        id: "ru_rev_4",
        label: "Начинается на «Т»",
        revealHint: "БУКВА Т",
        items: ["ТРУБА", "ТЕТЕРЕВ", "ТУФЛИ", "ТОПОР"],
      },
    ],
  },
};

export const PALIMPSEST_DE: PalimpsestPuzzle = {
  id: "palimpsest_de_01",
  title: "Das Doppel-Manuskript",
  allWords: [
    "BANJO", "SITAR", "POSAUNE", "HARFE",
    "BUSSARD", "SCHWAN", "PAPAGEI", "HABICHT",
    "BOOT", "SANDALE", "PANTOFFEL", "HALBSCHUH",
    "BOGEN", "SCHWERT", "PFEIL", "HELLEBARDE",
  ],
  obverse: {
    name: "obverse",
    title: "Vorderseite: Semantik",
    description: "Gruppiere die 16 Wörter nach ihrer inhaltlichen Bedeutung.",
    groups: [
      {
        id: "de_obs_1",
        label: "Musikinstrumente",
        revealHint: "INSTRUMENTE",
        items: ["BANJO", "SITAR", "POSAUNE", "HARFE"],
      },
      {
        id: "de_obs_2",
        label: "Vogelarten",
        revealHint: "VOEGEL",
        items: ["BUSSARD", "SCHWAN", "PAPAGEI", "HABICHT"],
      },
      {
        id: "de_obs_3",
        label: "Schuhwerk",
        revealHint: "SCHUHE",
        items: ["BOOT", "SANDALE", "PANTOFFEL", "HALBSCHUH"],
      },
      {
        id: "de_obs_4",
        label: "Historische Waffen",
        revealHint: "WAFFEN",
        items: ["BOGEN", "SCHWERT", "PFEIL", "HELLEBARDE"],
      },
    ],
  },
  reverse: {
    name: "reverse",
    title: "Rückseite: Orthographischer Code",
    description: "Dieselbe 16 Wörter nach ihrem Anfangsbuchstaben gruppieren.",
    groups: [
      {
        id: "de_rev_1",
        label: "Beginnt mit 'B'",
        revealHint: "BUCHSTABE B",
        items: ["BANJO", "BUSSARD", "BOOT", "BOGEN"],
      },
      {
        id: "de_rev_2",
        label: "Beginnt mit 'S'",
        revealHint: "BUCHSTABE S",
        items: ["SITAR", "SCHWAN", "SANDALE", "SCHWERT"],
      },
      {
        id: "de_rev_3",
        label: "Beginnt mit 'P'",
        revealHint: "BUCHSTABE P",
        items: ["POSAUNE", "PAPAGEI", "PANTOFFEL", "PFEIL"],
      },
      {
        id: "de_rev_4",
        label: "Beginnt mit 'H'",
        revealHint: "BUCHSTABE H",
        items: ["HARFE", "HABICHT", "HALBSCHUH", "HELLEBARDE"],
      },
    ],
  },
};

export function getPalimpsestPuzzle(lang: string): PalimpsestPuzzle {
  if (lang === "ru") return PALIMPSEST_RU;
  if (lang === "de") return PALIMPSEST_DE;
  return PALIMPSEST_EN;
}

export function findMatchingPalimpsestGroup(
  selection: readonly string[],
  layer: PalimpsestLayer,
): PalimpsestGroup | null {
  if (selection.length !== 4) return null;
  const sorted = [...selection].sort();
  for (const group of layer.groups) {
    const gSorted = [...group.items].sort();
    if (sorted.every((val, idx) => val === gSorted[idx])) {
      return group;
    }
  }
  return null;
}

export function isPalimpsestOneAway(
  selection: readonly string[],
  layer: PalimpsestLayer,
): boolean {
  if (selection.length !== 4) return false;
  const selSet = new Set(selection);
  for (const group of layer.groups) {
    let matchCount = 0;
    for (const item of group.items) {
      if (selSet.has(item)) matchCount++;
    }
    if (matchCount === 3) return true;
  }
  return false;
}
