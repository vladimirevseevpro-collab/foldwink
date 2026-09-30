import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT_ROOT = join(ROOT, "public", "runtime-content", "v1");
const languages = ["en", "ru", "de"];
// Archive payloads are intentionally fixed at 32 boards. This keeps the
// request count bounded without making a language switch download its entire
// authoring pool at once.
const chunkSize = 32;
const checkOnly = process.argv.includes("--check");

const readJson = async (file) => JSON.parse(await readFile(file, "utf8"));
const hash = (value) => createHash("sha256").update(value).digest("hex");
const outputJson = (value) => JSON.stringify(value);
const sameRef = (left, right) =>
  left.language === right.language &&
  left.puzzleId === right.puzzleId &&
  left.lineageId === right.lineageId &&
  left.contentVersion === right.contentVersion;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function isRef(value, language, contentVersion) {
  return (
    value &&
    value.language === language &&
    typeof value.puzzleId === "string" &&
    value.puzzleId.length > 0 &&
    typeof value.lineageId === "string" &&
    value.lineageId.length > 0 &&
    value.contentVersion === contentVersion
  );
}

function stripPuzzle(source) {
  assert(source && typeof source === "object", "Puzzle source must be an object");
  assert(typeof source.id === "string" && source.id, "Puzzle source is missing id");
  assert(typeof source.title === "string" && source.title, `Puzzle ${source.id} is missing title`);
  assert(["easy", "medium", "hard"].includes(source.difficulty), `Puzzle ${source.id} has invalid difficulty`);
  assert(Array.isArray(source.groups) && source.groups.length === 4, `Puzzle ${source.id} needs 4 groups`);
  return {
    id: source.id,
    title: source.title,
    difficulty: source.difficulty,
    groups: source.groups.map((group) => {
      assert(group && typeof group === "object", `Puzzle ${source.id} has invalid group`);
      assert(typeof group.id === "string" && group.id, `Puzzle ${source.id} group needs id`);
      assert(typeof group.label === "string" && group.label, `Puzzle ${source.id} group needs label`);
      assert(Array.isArray(group.items) && group.items.length === 4, `Puzzle ${source.id} group needs 4 items`);
      const result = { id: group.id, label: group.label, items: group.items };
      if (typeof group.revealHint === "string" && group.revealHint) result.revealHint = group.revealHint;
      return result;
    }),
    ...(source.meta
      ? {
          meta: Object.fromEntries(
            ["theme", "categoryType", "difficultyScore", "editorialRank"]
              .filter((key) => source.meta[key] !== undefined)
              .map((key) => [key, source.meta[key]]),
          )
        }
      : {}),
  };
}

async function readLanguagePool(language, contentVersion, editorialById) {
  const directory = language === "en" ? join(ROOT, "puzzles", "pool") : join(ROOT, "puzzles", language, "pool");
  const files = (await readdir(directory)).filter((file) => file.endsWith(".json")).sort();
  assert(files.length === 1000, `${language} published source pool must contain exactly 1000 boards`);
  const seen = new Set();
  const puzzles = [];
  for (const file of files) {
    const source = await readJson(join(directory, file));
    const puzzle = stripPuzzle(source);
    assert(!seen.has(puzzle.id), `${language} source pool repeats ${puzzle.id}`);
    seen.add(puzzle.id);
    const ref = editorialById.get(puzzle.id) ?? {
      language,
      puzzleId: puzzle.id,
      lineageId: puzzle.id,
      contentVersion,
    };
    assert(isRef(ref, language, contentVersion), `${language} generated reference is invalid: ${puzzle.id}`);
    puzzles.push({ ref, puzzle });
  }
  return puzzles.sort((left, right) => left.puzzle.id.localeCompare(right.puzzle.id));
}

async function makeLanguage(language) {
  const [starters, daily, editorial] = await Promise.all([
    readJson(join(ROOT, "puzzles", "manifests", `starters.${language}.json`)),
    readJson(join(ROOT, "puzzles", "manifests", `daily.${language}.2026-09-14.json`)),
    readJson(join(ROOT, "puzzles", "manifests", `editorial.${language}.json`)),
  ]);
  const contentVersion = editorial.catalogVersion;
  assert(typeof contentVersion === "string" && contentVersion, `${language} editorial catalogVersion is required`);
  assert(daily.language === language && starters.language === language && editorial.language === language, `${language} manifests disagree on language`);
  assert(Array.isArray(daily.entries) && daily.entries.length === 30, `${language} daily release manifest must contain exactly 30 boards`);
  assert(Array.isArray(starters.entries) && starters.entries.length === 6, `${language} starter manifest must contain exactly 6 boards`);
  assert(Array.isArray(editorial.records), `${language} editorial records are required`);

  const editorialById = new Map();
  for (const record of editorial.records) {
    assert(record?.status === "ready", `${language} editorial record is not ready`);
    assert(isRef(record.puzzleRef, language, contentVersion), `${language} editorial reference is invalid`);
    assert(!editorialById.has(record.puzzleRef.puzzleId), `${language} editorial manifest repeats ${record.puzzleRef.puzzleId}`);
    editorialById.set(record.puzzleRef.puzzleId, record.puzzleRef);
  }

  const releaseRefs = [];
  const seen = new Set();
  for (const entry of [...daily.entries, ...starters.entries.map((item) => item.puzzleRef)]) {
    const ref = entry?.puzzleRef ?? entry;
    assert(isRef(ref, language, contentVersion), `${language} release reference is invalid`);
    const canonical = editorialById.get(ref.puzzleId);
    assert(canonical && sameRef(canonical, ref), `${language} release reference does not match editorial identity: ${ref.puzzleId}`);
    if (!seen.has(ref.puzzleId)) {
      seen.add(ref.puzzleId);
      releaseRefs.push(canonical);
    }
  }
  assert(releaseRefs.length === 30, `${language} release manifest must resolve to 30 distinct boards`);

  const allPuzzles = await readLanguagePool(language, contentVersion, editorialById);
  const puzzleById = new Map(allPuzzles.map((entry) => [entry.puzzle.id, entry]));
  const bootPuzzles = releaseRefs.map((ref) => {
    const entry = puzzleById.get(ref.puzzleId);
    assert(entry, `${language} published release board is missing: ${ref.puzzleId}`);
    // Published refs are editorially pinned; do not replace their lineage or
    // version with a derived archive identity.
    return { ref, puzzle: entry.puzzle };
  });
  const releasedIds = new Set(releaseRefs.map((ref) => ref.puzzleId));
  const archivePuzzles = allPuzzles.filter((entry) => !releasedIds.has(entry.puzzle.id));
  assert(bootPuzzles.length === 30, `${language} boot payload must contain the 30 released boards`);
  assert(archivePuzzles.length === 970, `${language} archive must contain every non-boot board`);

  const writeAsset = (name, payload) => {
    const body = outputJson(payload);
    const sha256 = hash(body);
    const file = `${name}.${sha256.slice(0, 12)}.json`;
    return {
      file,
      body,
      sha256,
      count: payload.puzzles.length,
      puzzleRefs: payload.puzzles.map(({ ref }) => ref),
    };
  };
  const boot = writeAsset(`boot.${language}`, {
    schemaVersion: 1,
    language,
    contentVersion,
    puzzles: bootPuzzles,
  });
  const chunks = [];
  for (let start = 0; start < archivePuzzles.length; start += chunkSize) {
    const index = String(chunks.length + 1).padStart(3, "0");
    chunks.push(writeAsset(`archive.${language}.${index}`, {
      schemaVersion: 1,
      language,
      contentVersion,
      puzzles: archivePuzzles.slice(start, start + chunkSize),
    }));
  }
  const manifest = {
    schemaVersion: 1,
    manifestVersion: "runtime-content-v1",
    language,
    contentVersion,
    boot: {
      path: `./${boot.file}`,
      sha256: boot.sha256,
      count: boot.count,
      puzzleRefs: boot.puzzleRefs,
    },
    archive: chunks.map((chunk, index) => ({
      id: `archive-${language}-${String(index + 1).padStart(3, "0")}`,
      path: `./${chunk.file}`,
      sha256: chunk.sha256,
      count: chunk.count,
      puzzleRefs: chunk.puzzleRefs,
    })),
    publishedRefs: releaseRefs,
    starters,
    daily,
    editorial,
  };
  return { language, manifest, assets: [boot, ...chunks] };
}

const generated = await Promise.all(languages.map(makeLanguage));
const expected = new Map();
for (const item of generated) {
  expected.set(join(OUTPUT_ROOT, `manifest.${item.language}.json`), outputJson(item.manifest));
  for (const asset of item.assets) expected.set(join(OUTPUT_ROOT, asset.file), asset.body);
}

if (checkOnly) {
  for (const [file, body] of expected) {
    let actual;
    try {
      actual = await readFile(file, "utf8");
    } catch {
      throw new Error(`Missing generated runtime content: ${relative(ROOT, file)}. Run npm run content:build.`);
    }
    assert(actual === body, `Stale generated runtime content: ${relative(ROOT, file)}. Run npm run content:build.`);
  }
  let actualFiles;
  try {
    actualFiles = await readdir(OUTPUT_ROOT);
  } catch {
    throw new Error(`Missing generated runtime content directory: ${relative(ROOT, OUTPUT_ROOT)}. Run npm run content:build.`);
  }
  assert(actualFiles.length === expected.size && actualFiles.every((file) => expected.has(join(OUTPUT_ROOT, file))), "Unexpected generated runtime content. Run npm run content:build.");
  console.log(`Runtime content is current (${expected.size} files, ${chunkSize}-board archive chunks).`);
} else {
  await rm(OUTPUT_ROOT, { recursive: true, force: true });
  await mkdir(OUTPUT_ROOT, { recursive: true });
  for (const [file, body] of expected) {
    await writeFile(file, body, { encoding: "utf8", flush: true });
  }
  console.log(`Built runtime content (${expected.size} files, ${chunkSize}-board archive chunks).`);
}
