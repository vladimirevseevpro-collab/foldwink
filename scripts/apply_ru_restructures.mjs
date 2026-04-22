import fs from 'node:fs';
import path from 'node:path';

// Each restructure: [puzzleId, mutate(puzzle) => void]
const RESTRUCTURES = [
  ['ru-0071', (p) => {
    const g = p.groups.find(x => x.label === 'Города-миллионники');
    if (!g) throw new Error('ru-0071: missing "Города-миллионники"');
    g.label = 'Города Золотого кольца';
    g.items = ['Суздаль', 'Владимир', 'Ярославль', 'Ростов Великий'];
  }],
  ['ru-0203', (p) => {
    const by = Object.fromEntries(p.groups.map(g => [g.label, g]));
    // Rebuild puzzle fully along a genre axis
    p.groups = [
      { id: 'classic_60_70', label: 'Классика 60-70-х', revealHint: by['Британские']?.revealHint, items: ['The Beatles', 'Pink Floyd', 'Led Zeppelin', 'Queen'] },
      { id: 'hard_rock', label: 'Хард-рок', revealHint: by['Хард-рок классика']?.revealHint, items: ['AC/DC', 'Aerosmith', 'Black Sabbath', 'Van Halen'] },
      { id: 'grunge_90s', label: 'Гранж 90-х', revealHint: by['Альтернатива 90-х']?.revealHint, items: ['Nirvana', 'Pearl Jam', 'Soundgarden', 'Alice in Chains'] },
      { id: 'alt_rock', label: 'Альт-рок', revealHint: by['Американские']?.revealHint, items: ['Radiohead', 'Red Hot Chili Peppers', 'Foo Fighters', 'Metallica'] },
    ];
    // Strip undefined revealHint keys
    for (const g of p.groups) if (g.revealHint === undefined) delete g.revealHint;
  }],
  ['ru-0252', (p) => {
    const g = p.groups.find(x => x.label === 'Российские');
    if (!g) throw new Error('ru-0252: missing "Российские"');
    g.label = 'Российские комедии';
    g.items = ['Кухня', 'Интерны', 'Сваты', 'Реальные пацаны'];
    if (g.revealHint) g.revealHint = 'КОМЕДИЯ РФ';
  }],
  ['ru-0271', (p) => {
    const desktop = p.groups.find(x => x.label === 'Десктопные ОС');
    const server = p.groups.find(x => x.label === 'Серверные');
    if (!desktop || !server) throw new Error('ru-0271: missing expected groups');
    // Replace Fedora with Ubuntu in desktop
    const fi = desktop.items.indexOf('Fedora');
    if (fi !== -1) desktop.items[fi] = 'Ubuntu';
    // Replace server items
    server.items = ['Windows Server', 'RHEL', 'Ubuntu Server', 'VMware ESXi'];
  }],
  ['ru-0380', (p) => {
    const g = p.groups.find(x => x.label === 'Крафт');
    if (!g) throw new Error('ru-0380: missing "Крафт"');
    g.label = 'Бельгийские';
    g.items = ['Chimay', 'Duvel', 'Leffe', 'Stella Artois'];
    if (g.revealHint) g.revealHint = 'БЕЛЬГИЯ';
  }],
  ['ru-0485', (p) => {
    const g = p.groups.find(x => x.label === 'Экспорт России');
    if (!g) throw new Error('ru-0485: missing "Экспорт России"');
    g.label = 'Экспортные рынки';
    g.items = ['Китай', 'Индия', 'Турция', 'Беларусь'];
    if (g.revealHint) g.revealHint = 'РЫНКИ';
  }],
];

const DIRS = ['puzzles/ru/pool', 'puzzles/ru-drafts'];

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

for (const dir of DIRS) {
  for (const [id, mutate] of RESTRUCTURES) {
    const file = path.join(dir, `${id}.json`);
    if (!fs.existsSync(file)) { console.log(`MISS: ${file}`); continue; }
    const puzzle = JSON.parse(fs.readFileSync(file, 'utf8'));
    try {
      mutate(puzzle);
    } catch (e) {
      console.log(`FAIL: ${file} :: ${e.message}`);
      continue;
    }
    const isDraft = dir.includes('ru-drafts');
    const out = isDraft ? serializeDraft(puzzle) : JSON.stringify(puzzle, null, 2) + '\n';
    fs.writeFileSync(file, out, 'utf8');
    console.log(`OK: ${file}`);
  }
}
