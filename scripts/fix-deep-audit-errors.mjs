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

    // Fix missing revealHint on medium/hard puzzles
    if (puzzle.difficulty === "medium" || puzzle.difficulty === "hard") {
      for (const g of puzzle.groups) {
        if (!g.revealHint || !g.revealHint.trim()) {
          // Derive revealHint from label: first word, uppercase, alphanumeric only
          const cleanLabel = (g.label || "HINT")
            .toUpperCase()
            .replace(/[^A-ZА-ЯÄÖÜ]/gu, " ")
            .trim()
            .split(" ")[0];
          g.revealHint = cleanLabel.slice(0, 6) || "HINT";
          modified = true;
        }
      }
    }

    // Fix single letter items in puzzle-0070
    if (puzzle.id === "puzzle-0070") {
      for (const g of puzzle.groups) {
        g.items = g.items.map((it) => (it === "A" ? "Type A" : it === "I" ? "Letter I" : it));
      }
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(fullPath, JSON.stringify(puzzle, null, 2), "utf8");
      fixed++;
    }
  }
}

console.log(`Auto-fixed ${fixed} puzzle files with missing revealHints or sub-minimum items.`);
