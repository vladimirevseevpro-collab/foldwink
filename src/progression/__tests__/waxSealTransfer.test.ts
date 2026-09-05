import { describe, expect, it } from "vitest";
import { generateQrMatrix } from "../qr";
import {
  encodePassportToSeal,
  decodePassportFromSeal,
  saveArchivistBackup,
  loadArchivistBackup,
  hasArchivistBackup,
  clearArchivistBackup,
} from "../waxSealTransfer";
import type { ArchivistProfile } from "../types";
import { STAMP_COLLECTION } from "../stamps";

// ISO 18004 Galois Field + Reed Solomon validator
const EXP_TABLE = new Uint8Array(512);
const LOG_TABLE = new Uint8Array(256);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP_TABLE[i] = x;
    EXP_TABLE[i + 255] = x;
    LOG_TABLE[x] = i;
    x <<= 1;
    if (x & 256) x ^= 0x11d;
  }
})();

function gmult(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return EXP_TABLE[LOG_TABLE[a] + LOG_TABLE[b]];
}

function polyMultiply(p1: number[], p2: number[]): number[] {
  const result = new Array(p1.length + p2.length - 1).fill(0);
  for (let i = 0; i < p1.length; i++) {
    for (let j = 0; j < p2.length; j++) {
      result[i + j] ^= gmult(p1[i], p2[j]);
    }
  }
  return result;
}

function rsGeneratorPoly(degree: number): number[] {
  let poly = [1];
  for (let i = 0; i < degree; i++) {
    poly = polyMultiply(poly, [1, EXP_TABLE[i]]);
  }
  return poly;
}

function rsRemainder(data: number[], ecCount: number): number[] {
  const gen = rsGeneratorPoly(ecCount);
  const result = new Array(data.length + ecCount).fill(0);
  for (let i = 0; i < data.length; i++) result[i] = data[i];
  for (let i = 0; i < data.length; i++) {
    const coef = result[i];
    if (coef !== 0) {
      for (let j = 0; j < gen.length; j++) {
        result[i + j] ^= gmult(gen[j], coef);
      }
    }
  }
  return result.slice(data.length);
}

const VERSION_SPECS = [
  { version: 1, totalCodewords: 26, dataCodewords: 19, ecCodewordsPerBlock: 7, blocks: [{ count: 1, dataCodewords: 19 }], alignments: [] },
  { version: 2, totalCodewords: 44, dataCodewords: 34, ecCodewordsPerBlock: 10, blocks: [{ count: 1, dataCodewords: 34 }], alignments: [6, 18] },
  { version: 3, totalCodewords: 70, dataCodewords: 55, ecCodewordsPerBlock: 15, blocks: [{ count: 1, dataCodewords: 55 }], alignments: [6, 22] },
  { version: 4, totalCodewords: 100, dataCodewords: 80, ecCodewordsPerBlock: 20, blocks: [{ count: 1, dataCodewords: 80 }], alignments: [6, 26] },
  { version: 5, totalCodewords: 134, dataCodewords: 108, ecCodewordsPerBlock: 26, blocks: [{ count: 1, dataCodewords: 108 }], alignments: [6, 30] },
  { version: 6, totalCodewords: 172, dataCodewords: 136, ecCodewordsPerBlock: 18, blocks: [{ count: 2, dataCodewords: 68 }], alignments: [6, 34] },
  { version: 7, totalCodewords: 196, dataCodewords: 156, ecCodewordsPerBlock: 20, blocks: [{ count: 2, dataCodewords: 78 }], alignments: [6, 22, 38] },
  { version: 8, totalCodewords: 242, dataCodewords: 194, ecCodewordsPerBlock: 24, blocks: [{ count: 2, dataCodewords: 97 }], alignments: [6, 24, 42] },
  { version: 9, totalCodewords: 292, dataCodewords: 232, ecCodewordsPerBlock: 30, blocks: [{ count: 2, dataCodewords: 116 }], alignments: [6, 26, 46] },
  { version: 10, totalCodewords: 346, dataCodewords: 274, ecCodewordsPerBlock: 18, blocks: [{ count: 2, dataCodewords: 68 }, { count: 2, dataCodewords: 69 }], alignments: [6, 28, 50] },
];

function decodeQr(matrix: boolean[][]): string {
  const size = matrix.length;
  const version = (size - 17) / 4;
  const spec = VERSION_SPECS.find((s) => s.version === version);
  if (!spec) throw new Error(`Unsupported version ${version}`);

  // Format info reading
  const formatCoords = [
    [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8],
    [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8],
  ];
  let formatBits = 0;
  for (let i = 0; i < 15; i++) {
    const [r, c] = formatCoords[i];
    if (matrix[r][c]) formatBits |= (1 << i);
  }
  const unmaskedFormat = formatBits ^ 0x5412;
  const ecLevel = (unmaskedFormat >> 13) & 0b11; // 01 for L
  const mask = (unmaskedFormat >> 10) & 0b111; // 000 for mask 0
  if (ecLevel !== 1) throw new Error(`Unexpected EC level ${ecLevel}`);
  if (mask !== 0) throw new Error(`Unexpected mask ${mask}`);

  // Function module marking
  const isFunction = Array.from({ length: size }, () => new Array(size).fill(false));
  const mark = (r: number, c: number) => {
    if (r >= 0 && r < size && c >= 0 && c < size) isFunction[r][c] = true;
  };

  for (let r = 0; r <= 8; r++) {
    for (let c = 0; c <= 8; c++) mark(r, c);
  }
  for (let r = 0; r <= 8; r++) {
    for (let c = size - 8; c < size; c++) mark(r, c);
  }
  for (let r = size - 8; r < size; r++) {
    for (let c = 0; c <= 8; c++) mark(r, c);
  }
  for (let i = 0; i < size; i++) {
    mark(6, i);
    mark(i, 6);
  }
  mark(4 * version + 9, 8);

  for (const r of spec.alignments) {
    for (const c of spec.alignments) {
      if ((r < 9 && c < 9) || (r < 9 && c >= size - 9) || (r >= size - 9 && c < 9)) continue;
      for (let ar = -2; ar <= 2; ar++) {
        for (let ac = -2; ac <= 2; ac++) mark(r + ar, c + ac);
      }
    }
  }

  if (version >= 7) {
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 3; c++) {
        mark(r, size - 11 + c);
        mark(size - 11 + c, r);
      }
    }
  }

  // Zigzag bit reading
  const bits: boolean[] = [];
  let dir = -1;
  let x = size - 1;
  while (x > 0) {
    if (x === 6) x--;
    for (let i = 0; i < size; i++) {
      const y = dir === -1 ? size - 1 - i : i;
      for (let col = 0; col < 2; col++) {
        const cx = x - col;
        if (!isFunction[y][cx]) {
          let cell = matrix[y][cx];
          if ((y + cx) % 2 === 0) cell = !cell;
          bits.push(cell);
        }
      }
    }
    dir = -dir;
    x -= 2;
  }

  const codewords: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    let b = 0;
    for (let j = 0; j < 8; j++) {
      if (bits[i + j]) b |= (1 << (7 - j));
    }
    codewords.push(b);
  }

  const totalBlocks = spec.blocks.reduce((sum, b) => sum + b.count, 0);
  const dataBlockLengths: number[] = [];
  for (const b of spec.blocks) {
    for (let i = 0; i < b.count; i++) dataBlockLengths.push(b.dataCodewords);
  }
  const maxDataLen = Math.max(...dataBlockLengths);

  const dataBlocks: number[][] = Array.from({ length: totalBlocks }, () => []);
  let cwIdx = 0;
  for (let i = 0; i < maxDataLen; i++) {
    for (let b = 0; b < totalBlocks; b++) {
      if (i < dataBlockLengths[b]) {
        dataBlocks[b].push(codewords[cwIdx++]);
      }
    }
  }

  const ecBlocks: number[][] = Array.from({ length: totalBlocks }, () => []);
  for (let i = 0; i < spec.ecCodewordsPerBlock; i++) {
    for (let b = 0; b < totalBlocks; b++) {
      ecBlocks[b].push(codewords[cwIdx++]);
    }
  }

  for (let b = 0; b < totalBlocks; b++) {
    const fullBlock = [...dataBlocks[b], ...ecBlocks[b]];
    const rem = rsRemainder(fullBlock, spec.ecCodewordsPerBlock);
    if (rem.some((val) => val !== 0)) throw new Error(`RS verification failed on block ${b}`);
  }

  const allDataCodewords: number[] = [];
  for (const b of dataBlocks) allDataCodewords.push(...b);

  let bitPos = 0;
  const readBits = (num: number): number => {
    let val = 0;
    for (let i = 0; i < num; i++) {
      const byteIndex = Math.floor(bitPos / 8);
      const bitIndex = 7 - (bitPos % 8);
      const bit = (allDataCodewords[byteIndex] >>> bitIndex) & 1;
      val = (val << 1) | bit;
      bitPos++;
    }
    return val;
  };

  const mode = readBits(4);
  if (mode !== 4) throw new Error(`Expected Byte mode 4, got ${mode}`);
  const charCountBits = spec.version < 10 ? 8 : 16;
  const charCount = readBits(charCountBits);
  const bytes: number[] = [];
  for (let i = 0; i < charCount; i++) bytes.push(readBits(8));

  return new TextDecoder().decode(new Uint8Array(bytes));
}

describe("QR Code Generator", () => {
  it("generates a square matrix of modules for short and long text", () => {
    const m1 = generateQrMatrix("TEST");
    expect(m1.length).toBeGreaterThan(20);
    expect(m1[0].length).toBe(m1.length);

    const m2 = generateQrMatrix("FWSEAL1:12345678-abcdefghijklmnop");
    expect(m2.length).toBeGreaterThan(20);
    expect(m2[0].length).toBe(m2.length);
  });

  it("places finder patterns correctly at the three corners", () => {
    const matrix = generateQrMatrix("HELLO");
    const n = matrix.length;
    expect(matrix[3][3]).toBe(true);
    expect(matrix[0][0]).toBe(true);
    expect(matrix[3][n - 4]).toBe(true);
    expect(matrix[n - 4][3]).toBe(true);
  });

  it("decodes cleanly according to ISO/IEC 18004 across multiple versions", () => {
    const samples = [
      "HELLO",
      "Foldwink 2026",
      "FWSEAL1:12345678-abcdefghijklmnopqrstuvwxyz",
      "A".repeat(150), // Version 7
      "B".repeat(240), // Version 10
    ];

    for (const sample of samples) {
      const matrix = generateQrMatrix(sample);
      const decoded = decodeQr(matrix);
      expect(decoded).toBe(sample);
    }
  });
});

describe("Wax Seal Passport Transfer", () => {
  const sampleProfile: ArchivistProfile = {
    version: 1,
    level: 5,
    xp: 1850,
    ink: 42,
    wax: 7,
    prestige: 2,
    discipline: "archivist",
    sealId: "seal_compass",
    nibId: "nib_obsidian",
    titleId: "title_connections",
    collectedStampIds: ["stamp_morning_brew", "stamp_midori_compass"],
    contractsAttempted: 3,
    contractsWon: 2,
    activeContract: null,
    playerSeed: "user_seed_test_123",
  };

  function installLocalStorage(): void {
    const store = new Map<string, string>();
    (globalThis as unknown as { localStorage?: Storage }).localStorage = {
      get length() {
        return store.size;
      },
      key(i: number) {
        return Array.from(store.keys())[i] ?? null;
      },
      getItem(k: string) {
        return store.has(k) ? store.get(k)! : null;
      },
      setItem(k: string, v: string) {
        store.set(k, v);
      },
      removeItem(k: string) {
        store.delete(k);
      },
      clear() {
        store.clear();
      },
    } as Storage;
  }

  it("encodes profile into a portable FWSEAL1 string", () => {
    installLocalStorage();
    const sealStr = encodePassportToSeal(sampleProfile, "user_seed_test_123");
    expect(sealStr.startsWith("FWSEAL1:")).toBe(true);
    expect(sealStr.includes("-")).toBe(true);
  });

  it("decodes portable seal string back into identical profile and playerSeed", () => {
    const sealStr = encodePassportToSeal(sampleProfile, "user_seed_test_123");
    const res = decodePassportFromSeal(sealStr);
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    expect(res.profile?.level).toBe(5);
    expect(res.profile?.xp).toBe(1850);
    expect(res.profile?.ink).toBe(42);
    expect(res.profile?.wax).toBe(7);
    expect(res.profile?.prestige).toBe(2);
    expect(res.profile?.discipline).toBe("archivist");
    expect(res.profile?.sealId).toBe("seal_compass");
    expect(res.profile?.nibId).toBe("nib_obsidian");
    expect(res.profile?.titleId).toBe("title_connections");
    expect(res.profile?.collectedStampIds).toEqual(["stamp_morning_brew", "stamp_midori_compass"]);
    expect(res.profile?.contractsWon).toBe(2);
    expect(res.playerSeed).toBe("user_seed_test_123");
  });

  it("encodes and decodes profile with all stamps unlocked cleanly", () => {
    const fullProfile: ArchivistProfile = {
      ...sampleProfile,
      level: 25,
      xp: 12000,
      collectedStampIds: STAMP_COLLECTION.map((s) => s.id),
    };
    const sealStr = encodePassportToSeal(fullProfile, "seed_full_stamps");
    const res = decodePassportFromSeal(sealStr);
    expect(res.ok).toBe(true);
    expect(res.profile?.collectedStampIds.length).toBe(STAMP_COLLECTION.length);

    // Also verify that the QR code generated from this seal string is 100% decodable!
    const matrix = generateQrMatrix(sealStr);
    const decodedFromQr = decodeQr(matrix);
    expect(decodedFromQr).toBe(sealStr);
    const roundtripFromQr = decodePassportFromSeal(decodedFromQr);
    expect(roundtripFromQr.ok).toBe(true);
    expect(roundtripFromQr.profile?.level).toBe(25);
  });

  it("rejects tampered or corrupted seal strings gracefully", () => {
    const sealStr = encodePassportToSeal(sampleProfile);
    const corrupted = sealStr.slice(0, -3) + "xyz";
    const res = decodePassportFromSeal(corrupted);
    expect(res.ok).toBe(false);
    expect(res.error).toBeDefined();

    const invalidHeader = decodePassportFromSeal("INVALID:xyz");
    expect(invalidHeader.ok).toBe(false);
  });

  it("handles profile backup, detection, and clearing correctly", () => {
    clearArchivistBackup();
    expect(hasArchivistBackup()).toBe(false);
    expect(loadArchivistBackup()).toBeNull();

    saveArchivistBackup(sampleProfile, "seed_backup_test");
    expect(hasArchivistBackup()).toBe(true);

    const loaded = loadArchivistBackup();
    expect(loaded?.profile.level).toBe(5);
    expect(loaded?.playerSeed).toBe("seed_backup_test");
    expect(loaded?.backedUpAt).toBeDefined();

    clearArchivistBackup();
    expect(hasArchivistBackup()).toBe(false);
  });
});
