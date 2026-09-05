/**
 * Zero-dependency QR Code Generator for Foldwink.
 * Implements ISO/IEC 18004 QR Code specification (Byte mode, Error Correction Level L).
 * Supports automatic version selection (Versions 1 to 10).
 */

// GF(256) tables with primitive polynomial 0x11d
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

function rsCalculateRemainder(data: number[], ecCount: number): number[] {
  const gen = rsGeneratorPoly(ecCount);
  const result = new Array(data.length + ecCount).fill(0);
  for (let i = 0; i < data.length; i++) {
    result[i] = data[i];
  }
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

// Version table for Error Correction Level L
interface VersionSpec {
  version: number;
  totalCodewords: number;
  dataCodewords: number;
  ecCodewordsPerBlock: number;
  blocks: { count: number; dataCodewords: number }[];
  alignments: number[];
}

const VERSION_SPECS: VersionSpec[] = [
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

// ISO/IEC 18004 Table D.1 - Version Information (BCH 18, 6)
const VERSION_INFO: Record<number, number> = {
  7: 0x07c94,
  8: 0x085bc,
  9: 0x09a99,
  10: 0x0a4d3,
};

function selectVersion(dataLenBytes: number): VersionSpec {
  for (const spec of VERSION_SPECS) {
    const headerBits = spec.version < 10 ? 12 : 20;
    const availableDataBytes = spec.dataCodewords;
    if (Math.ceil((headerBits + dataLenBytes * 8) / 8) <= availableDataBytes) {
      return spec;
    }
  }
  return VERSION_SPECS[VERSION_SPECS.length - 1];
}

class BitBuffer {
  buffer: number[] = [];
  length: number = 0;

  put(num: number, length: number): void {
    for (let i = 0; i < length; i++) {
      this.putBit(((num >>> (length - i - 1)) & 1) === 1);
    }
  }

  putBit(bit: boolean): void {
    const bufIndex = Math.floor(this.length / 8);
    if (this.buffer.length <= bufIndex) {
      this.buffer.push(0);
    }
    if (bit) {
      this.buffer[bufIndex] |= 0x80 >>> (this.length % 8);
    }
    this.length++;
  }
}

export function generateQrMatrix(text: string): boolean[][] {
  const utf8Bytes = Array.from(new TextEncoder().encode(text));

  const spec = selectVersion(utf8Bytes.length);
  const buffer = new BitBuffer();

  // Mode: Byte (0100)
  buffer.put(0x4, 4);
  // Character count indicator (8 bits for V1-9, 16 bits for V10+)
  buffer.put(utf8Bytes.length, spec.version < 10 ? 8 : 16);

  // Data bytes
  for (const byte of utf8Bytes) {
    buffer.put(byte, 8);
  }

  // Terminator (up to 4 zeroes)
  const maxBits = spec.dataCodewords * 8;
  const termLen = Math.min(4, maxBits - buffer.length);
  if (termLen > 0) {
    buffer.put(0, termLen);
  }

  // Pad to byte boundary
  while (buffer.length % 8 !== 0 && buffer.length < maxBits) {
    buffer.putBit(false);
  }

  // Pad with alternating 0xEC, 0x11
  const padBytes = [0xec, 0x11];
  let padIdx = 0;
  while (buffer.length < maxBits) {
    buffer.put(padBytes[padIdx % 2], 8);
    padIdx++;
  }

  const dataCodewords = buffer.buffer;

  // Split into blocks and calculate EC
  const dataBlocks: number[][] = [];
  const ecBlocks: number[][] = [];
  let byteOffset = 0;

  for (const blk of spec.blocks) {
    for (let b = 0; b < blk.count; b++) {
      const slice = dataCodewords.slice(byteOffset, byteOffset + blk.dataCodewords);
      byteOffset += blk.dataCodewords;
      dataBlocks.push(slice);
      ecBlocks.push(rsCalculateRemainder(slice, spec.ecCodewordsPerBlock));
    }
  }

  // Interleave data codewords
  const interleaved: number[] = [];
  const maxDataBlockLen = Math.max(...dataBlocks.map((b) => b.length));
  for (let i = 0; i < maxDataBlockLen; i++) {
    for (let b = 0; b < dataBlocks.length; b++) {
      if (i < dataBlocks[b].length) {
        interleaved.push(dataBlocks[b][i]);
      }
    }
  }

  // Interleave error correction codewords
  for (let i = 0; i < spec.ecCodewordsPerBlock; i++) {
    for (let b = 0; b < ecBlocks.length; b++) {
      interleaved.push(ecBlocks[b][i]);
    }
  }

  // Construct module matrix
  const size = 17 + 4 * spec.version;
  const matrix: (boolean | null)[][] = Array.from({ length: size }, () =>
    new Array(size).fill(null),
  );

  // Helper: set finder pattern
  const setFinder = (row: number, col: number): void => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const tr = row + r;
        const tc = col + c;
        if (tr >= 0 && tr < size && tc >= 0 && tc < size) {
          if (r === -1 || r === 7 || c === -1 || c === 7) {
            matrix[tr][tc] = false; // separator
          } else if (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
            matrix[tr][tc] = true;
          } else {
            matrix[tr][tc] = false;
          }
        }
      }
    }
  };

  setFinder(0, 0);
  setFinder(0, size - 7);
  setFinder(size - 7, 0);

  // Alignment patterns
  if (spec.alignments.length > 0) {
    for (const r of spec.alignments) {
      for (const c of spec.alignments) {
        if (
          (r < 9 && c < 9) ||
          (r < 9 && c >= size - 9) ||
          (r >= size - 9 && c < 9)
        ) {
          continue;
        }
        for (let ar = -2; ar <= 2; ar++) {
          for (let ac = -2; ac <= 2; ac++) {
            const isBorder = Math.abs(ar) === 2 || Math.abs(ac) === 2;
            const isCenter = ar === 0 && ac === 0;
            matrix[r + ar][c + ac] = isBorder || isCenter;
          }
        }
      }
    }
  }

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    if (matrix[6][i] === null) matrix[6][i] = i % 2 === 0;
    if (matrix[i][6] === null) matrix[i][6] = i % 2 === 0;
  }

  // Dark module
  matrix[4 * spec.version + 9][8] = true;

  // Version information for Version 7 and above (ISO/IEC 18004 Table D.1)
  if (spec.version >= 7) {
    const vInfo = VERSION_INFO[spec.version] ?? 0;
    for (let i = 0; i < 18; i++) {
      const bit = ((vInfo >>> i) & 1) === 1;
      // Bottom-left: 3 rows x 6 cols
      matrix[size - 11 + (i % 3)][Math.floor(i / 3)] = bit;
      // Top-right: 6 rows x 3 cols
      matrix[Math.floor(i / 3)][size - 11 + (i % 3)] = bit;
    }
  }

  // Reserve format information spaces
  for (let i = 0; i < 9; i++) {
    if (matrix[8][i] === null) matrix[8][i] = false;
    if (matrix[i][8] === null) matrix[i][8] = false;
  }
  for (let i = size - 8; i < size; i++) {
    if (matrix[8][i] === null) matrix[8][i] = false;
    if (matrix[i][8] === null) matrix[i][8] = false;
  }

  // Zigzag data placement
  let byteIdx = 0;
  let bitIdx = 7;
  let dir = -1; // moving upwards
  let x = size - 1;

  while (x > 0) {
    if (x === 6) x--; // skip timing pattern column
    for (let i = 0; i < size; i++) {
      const y = dir === -1 ? size - 1 - i : i;
      for (let col = 0; col < 2; col++) {
        const cx = x - col;
        if (matrix[y][cx] === null) {
          let bit = false;
          if (byteIdx < interleaved.length) {
            bit = ((interleaved[byteIdx] >>> bitIdx) & 1) === 1;
            bitIdx--;
            if (bitIdx < 0) {
              bitIdx = 7;
              byteIdx++;
            }
          }
          // Apply mask 0: (row + col) % 2 === 0
          if ((y + cx) % 2 === 0) {
            bit = !bit;
          }
          matrix[y][cx] = bit;
        }
      }
    }
    dir = -dir;
    x -= 2;
  }

  // Format info: EC Level L (01), Mask 0 (000)
  // Final 15-bit BCH codeword = 0b111011111000100
  // bit 0 (LSB) = 0, bit 14 (MSB) = 1
  const finalBits = 0b111011111000100;
  const formatBits = new Array(15);
  for (let i = 0; i < 15; i++) {
    formatBits[i] = ((finalBits >>> i) & 1) === 1;
  }

  // Write format info (ISO/IEC 18004 Table 23)
  // Top-left: (8, 0..5) -> bit 0..5, (8, 7) -> bit 6, (8, 8) -> bit 7, (7, 8) -> bit 8, (5..0, 8) -> bit 9..14
  for (let i = 0; i <= 5; i++) matrix[8][i] = formatBits[i];
  matrix[8][7] = formatBits[6];
  matrix[8][8] = formatBits[7];
  matrix[7][8] = formatBits[8];
  for (let i = 9; i < 15; i++) matrix[14 - i][8] = formatBits[i];

  // Right-top & left-bottom:
  // Top-right: (8, size - 1) down to (8, size - 8) receives bit 0 to 7
  for (let i = 0; i < 8; i++) matrix[8][size - 1 - i] = formatBits[i];
  // Bottom-left: (size - 7, 8) up to (size - 1, 8) receives bit 8 to 14
  for (let i = 8; i < 15; i++) matrix[size - 15 + i][8] = formatBits[i];

  return matrix.map((row) => row.map((cell) => cell ?? false));
}

export function drawQrToCanvas(
  ctx: CanvasRenderingContext2D,
  matrix: boolean[][],
  x: number,
  y: number,
  size: number,
  fgColor = "#151a17",
  bgColor = "#ffffff",
): void {
  const count = matrix.length;
  const cellSize = size / count;

  ctx.save();
  ctx.fillStyle = bgColor;
  ctx.fillRect(x, y, size, size);

  ctx.fillStyle = fgColor;
  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      if (matrix[r][c]) {
        ctx.fillRect(
          Math.floor(x + c * cellSize),
          Math.floor(y + r * cellSize),
          Math.ceil(cellSize),
          Math.ceil(cellSize),
        );
      }
    }
  }
  ctx.restore();
}
