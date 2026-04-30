/**
 * Pack the final/ folder + reports/ + configs/ into foldwink_video_pack.zip.
 * Uses forward-slash entries (same convention as scripts/pack-itch.mjs).
 */
import {
  readFileSync,
  readdirSync,
  writeFileSync,
  statSync,
  existsSync,
  mkdirSync,
} from "node:fs";
import { createWriteStream } from "node:fs";
import { resolve, join, relative } from "node:path";
import { createGzip, deflateRawSync } from "node:zlib";

const ROOT = resolve(process.cwd());
const BASE = resolve(ROOT, "reports/video_automation");
const OUT_ZIP = join(BASE, "foldwink_video_pack.zip");

function walk(dir, out = []) {
  for (const f of readdirSync(dir)) {
    const full = join(dir, f);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

function dosTime(d) {
  const t = (d.getHours() << 11) | (d.getMinutes() << 5) | Math.floor(d.getSeconds() / 2);
  const dt = (((d.getFullYear() - 1980) & 0x7f) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  return { t, dt };
}

function crc32(buf) {
  let c;
  const table = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  return (crc ^ 0xffffffff) >>> 0;
}

function writeU16(buf, off, v) {
  buf.writeUInt16LE(v, off);
}
function writeU32(buf, off, v) {
  buf.writeUInt32LE(v, off);
}

function buildZip(files) {
  const chunks = [];
  const central = [];
  let offset = 0;
  const d = new Date();
  const { t, dt } = dosTime(d);

  for (const f of files) {
    const data = readFileSync(f.abs);
    const deflated = deflateRawSync(data);
    const useDeflate = deflated.length < data.length;
    const method = useDeflate ? 8 : 0;
    const body = useDeflate ? deflated : data;
    const crc = crc32(data);
    const nameBuf = Buffer.from(f.entry, "utf-8");

    const local = Buffer.alloc(30 + nameBuf.length);
    writeU32(local, 0, 0x04034b50);
    writeU16(local, 4, 20);
    writeU16(local, 6, 0);
    writeU16(local, 8, method);
    writeU16(local, 10, t);
    writeU16(local, 12, dt);
    writeU32(local, 14, crc);
    writeU32(local, 18, body.length);
    writeU32(local, 22, data.length);
    writeU16(local, 26, nameBuf.length);
    writeU16(local, 28, 0);
    nameBuf.copy(local, 30);

    chunks.push(local, body);
    const cd = Buffer.alloc(46 + nameBuf.length);
    writeU32(cd, 0, 0x02014b50);
    writeU16(cd, 4, 20);
    writeU16(cd, 6, 20);
    writeU16(cd, 8, 0);
    writeU16(cd, 10, method);
    writeU16(cd, 12, t);
    writeU16(cd, 14, dt);
    writeU32(cd, 16, crc);
    writeU32(cd, 20, body.length);
    writeU32(cd, 24, data.length);
    writeU16(cd, 28, nameBuf.length);
    writeU16(cd, 30, 0);
    writeU16(cd, 32, 0);
    writeU16(cd, 34, 0);
    writeU16(cd, 36, 0);
    writeU32(cd, 38, 0);
    writeU32(cd, 42, offset);
    nameBuf.copy(cd, 46);
    central.push(cd);
    offset += local.length + body.length;
  }
  const cdStart = offset;
  let cdSize = 0;
  for (const c of central) {
    chunks.push(c);
    cdSize += c.length;
  }
  const end = Buffer.alloc(22);
  writeU32(end, 0, 0x06054b50);
  writeU16(end, 4, 0);
  writeU16(end, 6, 0);
  writeU16(end, 8, central.length);
  writeU16(end, 10, central.length);
  writeU32(end, 12, cdSize);
  writeU32(end, 16, cdStart);
  writeU16(end, 20, 0);
  chunks.push(end);
  return Buffer.concat(chunks);
}

function collect() {
  const include = ["final", "reports", "configs", "scripts", "README.md"];
  const files = [];
  for (const sub of include) {
    const abs = join(BASE, sub);
    if (!existsSync(abs)) continue;
    const st = statSync(abs);
    if (st.isDirectory()) {
      for (const f of walk(abs)) {
        if (/\.(webm|tmp)$/i.test(f)) continue;
        const entry = "video_automation/" + relative(BASE, f).replace(/\\/g, "/");
        files.push({ abs: f, entry });
      }
    } else {
      files.push({ abs, entry: "video_automation/" + sub });
    }
  }
  return files;
}

const files = collect();
if (!files.length) {
  console.error("[pack] nothing to zip");
  process.exit(1);
}
const zip = buildZip(files);
writeFileSync(OUT_ZIP, zip);
console.log(`[pack] wrote ${OUT_ZIP} with ${files.length} entries (${zip.length} bytes)`);
