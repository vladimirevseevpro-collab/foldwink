import fs from "node:fs";
import path from "node:path";

const POOLS = [
  { key: "EN", dir: "puzzles/pool" },
  { key: "RU", dir: "puzzles/ru/pool" },
  { key: "DE", dir: "puzzles/de/pool" },
];

let fixed = 0;

for (const { dir } of POOLS) {
  if (!fs.existsSync(dir)) continue;
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const puzzle = JSON.parse(fs.readFileSync(fullPath, "utf8"));
    let modified = false;

    // Fix single letter items in any puzzle
    for (const g of puzzle.groups) {
      g.items = g.items.map((it) => {
        if (it.length === 1) {
          modified = true;
          return `[${it}]`;
        }
        return it;
      });
    }

    if (modified) {
      fs.writeFileSync(fullPath, JSON.stringify(puzzle, null, 2), "utf8");
      fixed++;
    }
  }
}

console.log(`Auto-fixed ${fixed} puzzle files with single-letter items.`);
