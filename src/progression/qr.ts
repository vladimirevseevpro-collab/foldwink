import qrcodegen from "@ribpay/qr-code-generator";

const { QrCode, QrSegment } = qrcodegen;

/**
 * Camera-friendly ceiling accepted for W5: byte mode, ECC M, versions 1–10.
 * A larger value may be valid under ISO 18004, but denser codes are not
 * presented as usable on Foldwink's small certificate surface.
 */
export const QR_MAX_INPUT_BYTES = 213;
export const QR_MAX_VERSION = 10;
export const QR_ERROR_CORRECTION = "M" as const;

export class QrPayloadTooLargeError extends Error {
  readonly code = "payload-too-large" as const;

  constructor(
    readonly bytes: number,
    readonly maxBytes = QR_MAX_INPUT_BYTES,
  ) {
    super(`QR payload is ${bytes} bytes; the supported ECC-M limit is ${maxBytes}.`);
    this.name = "QrPayloadTooLargeError";
  }
}

export type QrGenerationResult =
  | {
      ok: true;
      matrix: boolean[][];
      bytes: number;
      version: number;
      errorCorrection: typeof QR_ERROR_CORRECTION;
    }
  | { ok: false; code: "payload-too-large"; bytes: number; maxBytes: number };

function encode(text: string): { matrix: boolean[][]; version: number; bytes: number } {
  const bytes = [...new TextEncoder().encode(text)];
  if (bytes.length > QR_MAX_INPUT_BYTES) throw new QrPayloadTooLargeError(bytes.length);
  try {
    const qr = QrCode.encodeSegments(
      [QrSegment.makeBytes(bytes)],
      QrCode.Ecc.MEDIUM,
      QrCode.MIN_VERSION,
      QR_MAX_VERSION,
      -1,
      false,
    );
    const matrix = Array.from({ length: qr.size }, (_, y) =>
      Array.from({ length: qr.size }, (_cell, x) => qr.getModule(x, y)),
    );
    return { matrix, version: qr.version, bytes: bytes.length };
  } catch {
    // The explicit byte limit and the encoder share one failure contract.
    throw new QrPayloadTooLargeError(bytes.length);
  }
}

export function generateQrMatrix(text: string): boolean[][] {
  return encode(text).matrix;
}

/** Never truncates or presents a partial code as success. */
export function tryGenerateQrMatrix(text: string): QrGenerationResult {
  const bytes = new TextEncoder().encode(text).byteLength;
  if (bytes > QR_MAX_INPUT_BYTES) {
    return { ok: false, code: "payload-too-large", bytes, maxBytes: QR_MAX_INPUT_BYTES };
  }
  try {
    const encoded = encode(text);
    return {
      ok: true,
      matrix: encoded.matrix,
      bytes,
      version: encoded.version,
      errorCorrection: QR_ERROR_CORRECTION,
    };
  } catch {
    return { ok: false, code: "payload-too-large", bytes, maxBytes: QR_MAX_INPUT_BYTES };
  }
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
  const moduleCount = matrix.length;
  // Four-module quiet zone is required for reliable camera detection.
  const quietZone = 4;
  const totalModules = moduleCount + quietZone * 2;
  const cellSize = size / totalModules;

  ctx.save();
  ctx.fillStyle = bgColor;
  ctx.fillRect(x, y, size, size);
  ctx.fillStyle = fgColor;
  for (let row = 0; row < moduleCount; row++) {
    for (let column = 0; column < moduleCount; column++) {
      if (!matrix[row][column]) continue;
      ctx.fillRect(
        Math.floor(x + (column + quietZone) * cellSize),
        Math.floor(y + (row + quietZone) * cellSize),
        Math.ceil(cellSize),
        Math.ceil(cellSize),
      );
    }
  }
  ctx.restore();
}
