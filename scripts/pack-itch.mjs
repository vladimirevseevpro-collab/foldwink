#!/usr/bin/env node
import { createWriteStream, readFileSync, statSync, existsSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { createDeflateRaw } from "node:zlib";
import { pipeline } from "node:stream/promises";
import { PassThrough } from "node:stream";
import { Buffer } from "node:buffer";
import { crc32 as zlibCrc32 } from "node:zlib";
import { prepareFreshWorkspaceOutput } from "./release-path-safety.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const dist = join(root, "dist");
const version = JSON.parse(readFileSync(join(root, "package.json"), "utf8")).version;
const date = new Date().toISOString().slice(0, 10);
const outDir = join(root, "itch.io", "export");
const base = `foldwink-itch-upload-v${version}-${date}`;
function pickOutPath() {
  const first = join(outDir, `${base}.zip`);
  if (!existsSync(first)) return first;
  for (let i = 2; i < 100; i++) {
    const p = join(outDir, `${base}-r${i}.zip`);
    if (!existsSync(p)) return p;
  }
  throw new Error("too many drops today");
}
async function walkRegularFiles(d) {
  const out = [];
  const entries = await readdir(d, { withFileTypes: true });
  entries.sort((left, right) =>
    left.name < right.name ? -1 : left.name > right.name ? 1 : 0,
  );
  for (const e of entries) {
    const p = join(d, e.name);
    if (e.isDirectory()) out.push(...(await walkRegularFiles(p)));
    else if (e.isFile()) out.push(p);
    else throw new Error(`Non-regular archive input is not allowed: ${p}`);
  }
  return out;
}

function u16(n) {
  const b = Buffer.alloc(2);
  b.writeUInt16LE(n);
  return b;
}
function u32(n) {
  const b = Buffer.alloc(4);
  b.writeUInt32LE(n);
  return b;
}

async function deflate(buf) {
  const z = createDeflateRaw();
  const chunks = [];
  const sink = new PassThrough();
  sink.on("data", (c) => chunks.push(c));
  const src = new PassThrough();
  src.end(buf);
  await pipeline(src, z, sink);
  return Buffer.concat(chunks);
}

export async function createDeterministicZip(sourceDirectory, outputPath) {
  const files = await walkRegularFiles(sourceDirectory);
  files.sort((left, right) => {
    const leftPath = relative(sourceDirectory, left).split(sep).join("/");
    const rightPath = relative(sourceDirectory, right).split(sep).join("/");
    return leftPath < rightPath ? -1 : leftPath > rightPath ? 1 : 0;
  });
  const entries = [];
  const parts = [];
  let offset = 0;

  for (const full of files) {
    const name = relative(sourceDirectory, full).split(sep).join("/");
    const data = readFileSync(full);
    const crc = zlibCrc32(data) >>> 0;
    const deflated = await deflate(data);
    const useDeflate = deflated.length < data.length;
    const stored = useDeflate ? deflated : data;
    const method = useDeflate ? 8 : 0;
    const nameBuf = Buffer.from(name, "utf8");
    const local = Buffer.concat([
      u32(0x04034b50),
      u16(20),
      u16(0),
      u16(method),
      u16(0),
      u16(0),
      u32(crc),
      u32(stored.length),
      u32(data.length),
      u16(nameBuf.length),
      u16(0),
      nameBuf,
      stored,
    ]);
    entries.push({
      name,
      crc,
      csize: stored.length,
      usize: data.length,
      method,
      offset,
      nameBuf,
    });
    parts.push(local);
    offset += local.length;
  }

  const cdStart = offset;
  for (const e of entries) {
    const cd = Buffer.concat([
      u32(0x02014b50),
      u16(20),
      u16(20),
      u16(0),
      u16(e.method),
      u16(0),
      u16(0),
      u32(e.crc),
      u32(e.csize),
      u32(e.usize),
      u16(e.nameBuf.length),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(0),
      u32(e.offset),
      e.nameBuf,
    ]);
    parts.push(cd);
    offset += cd.length;
  }
  const cdSize = offset - cdStart;
  parts.push(
    Buffer.concat([
      u32(0x06054b50),
      u16(0),
      u16(0),
      u16(entries.length),
      u16(entries.length),
      u32(cdSize),
      u32(cdStart),
      u16(0),
    ]),
  );

  await new Promise((finish, reject) => {
    const ws = createWriteStream(outputPath, { flags: "wx" });
    ws.once("error", reject);
    for (const part of parts) ws.write(part);
    ws.end(finish);
  });
  return { files: entries.length, bytes: statSync(outputPath).size };
}

async function main() {
  if (!existsSync(dist)) {
    throw new Error("dist/ missing — run `npm run build` first.");
  }
  const outPath = pickOutPath();
  await prepareFreshWorkspaceOutput(root, outPath, "Itch archive output");
  const result = await createDeterministicZip(dist, outPath);
  console.log(`wrote ${outPath}`);
  console.log(`${result.files} files, ${result.bytes} bytes`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
