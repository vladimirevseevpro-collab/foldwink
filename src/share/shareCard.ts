/**
 * Foldwink share-card renderer.
 *
 * Produces a square 1080x1080 PNG in the Night Print Studio visual system.
 * The renderer is browser-only and intentionally has no runtime dependencies.
 */

const WIDTH = 1080;
const HEIGHT_SQUARE = 1080;
const HEIGHT_STORY = 1920;

const COLOR = {
  bg: "#101310",
  surface: "#1b201c",
  surfaceHi: "#252b26",
  line: "#343d36",
  text: "#f1f4ee",
  muted: "#a5ada6",
  accent: "#67d7d0",
  accentEdge: "#367f7a",
  paper: "#f1f4ee",
  paperEdge: "#aeb7ad",
  ink: "#151a17",
  solved: ["#f1c75b", "#75c88a", "#ec8b7d", "#b9a2f2"] as const,
  solvedEdge: ["#b8902e", "#418f58", "#b6574c", "#7c68ba"] as const,
} as const;

const FONT_STACK =
  "'Manrope Variable', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

export interface ShareCardLabels {
  solved?: string;
  closeCall?: string;
  time?: string;
  mistakes?: string;
  winkUsed?: string;
  noWink?: string;
  supporter?: string;
}

import { todayLocal } from "../utils/date";

export interface ShareCardOptions {
  mode: "daily" | "standard";
  title: string;
  subtitle: string;
  result: "win" | "loss";
  mistakesUsed: number;
  durationMs: number;
  difficulty: "easy" | "medium" | "hard";
  difficultyLabel?: string;
  groupOrder: readonly string[];
  solvedGroupIds: readonly string[];
  winkUsed: boolean;
  winkAvailable: boolean;
  winkedGroupId?: string | null;
  supporter?: boolean;
  archetype?: string;
  format?: "square" | "story";
  labels?: ShareCardLabels;
  sealIcon?: string;
  sealLabel?: string;
  dateStr?: string;
  kintsugiRestored?: boolean;
}

export function isShareCardSupported(): boolean {
  return (
    typeof document !== "undefined" &&
    typeof HTMLCanvasElement !== "undefined" &&
    typeof document.createElement === "function"
  );
}

function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function fillRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fill: string,
): void {
  ctx.fillStyle = fill;
  roundRect(ctx, x, y, width, height, radius);
  ctx.fill();
}

function drawFoldedCorner(
  ctx: CanvasRenderingContext2D,
  right: number,
  top: number,
  size: number,
): void {
  ctx.fillStyle = COLOR.accent;
  ctx.beginPath();
  ctx.moveTo(right - size, top);
  ctx.lineTo(right, top);
  ctx.lineTo(right, top + size);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = COLOR.ink;
  ctx.lineWidth = Math.max(3, size * 0.09);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(right - size * 0.45, top + size * 0.28);
  ctx.lineTo(right - size * 0.16, top + size * 0.57);
  ctx.stroke();
}

function drawBackground(ctx: CanvasRenderingContext2D, height: number): void {
  ctx.fillStyle = COLOR.bg;
  ctx.fillRect(0, 0, WIDTH, height);

  ctx.strokeStyle = COLOR.line;
  ctx.lineWidth = 2;
  roundRect(ctx, 34, 34, WIDTH - 68, height - 68, 18);
  ctx.stroke();

  drawFoldedCorner(ctx, WIDTH - 34, 34, 62);

  ctx.fillStyle = COLOR.accent;
  ctx.fillRect(74, 72, 72, 4);
  ctx.fillStyle = COLOR.line;
  ctx.fillRect(154, 72, 34, 4);
}

function drawBrandMark(ctx: CanvasRenderingContext2D, centerX: number, top: number): void {
  const size = 94;
  const x = centerX - size / 2;

  fillRoundRect(ctx, x, top + 7, size, size, 11, COLOR.paperEdge);
  fillRoundRect(ctx, x, top, size, size, 11, COLOR.paper);
  ctx.strokeStyle = COLOR.line;
  ctx.lineWidth = 2;
  roundRect(ctx, x, top, size, size, 11);
  ctx.stroke();

  const tile = 29;
  const gap = 8;
  const tileX = x + 10;
  const tileY = top + 10;
  COLOR.solved.forEach((color, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    fillRoundRect(ctx, tileX + col * (tile + gap), tileY + row * (tile + gap), tile, tile, 5, color);
  });
  drawFoldedCorner(ctx, x + size, top, 25);
}

function drawWordmark(ctx: CanvasRenderingContext2D, baseline: number): void {
  ctx.font = `800 88px ${FONT_STACK}`;
  ctx.textBaseline = "alphabetic";
  const foldWidth = ctx.measureText("Fold").width;
  const winkWidth = ctx.measureText("wink").width;
  const x = (WIDTH - foldWidth - winkWidth) / 2;

  ctx.textAlign = "left";
  ctx.fillStyle = COLOR.text;
  ctx.fillText("Fold", x, baseline);
  ctx.fillStyle = COLOR.accent;
  ctx.fillText("wink", x + foldWidth, baseline);

  const lineY = baseline + 24;
  ctx.fillStyle = COLOR.line;
  ctx.fillRect(WIDTH / 2 - 86, lineY, 66, 3);
  ctx.fillRect(WIDTH / 2 + 20, lineY, 66, 3);
  ctx.save();
  ctx.translate(WIDTH / 2, lineY + 1);
  ctx.rotate(Math.PI / 4);
  ctx.strokeStyle = COLOR.accentEdge;
  ctx.lineWidth = 3;
  ctx.strokeRect(-7, -7, 14, 14);
  ctx.restore();
}

function fittedFontSize(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  preferred: number,
  minimum: number,
  weight: number,
): number {
  let size = preferred;
  while (size > minimum) {
    ctx.font = `${weight} ${size}px ${FONT_STACK}`;
    if (ctx.measureText(text).width <= maxWidth) break;
    size -= 2;
  }
  return size;
}

function drawCenteredText(
  ctx: CanvasRenderingContext2D,
  text: string,
  y: number,
  maxWidth: number,
  preferredSize: number,
  minimumSize: number,
  weight: number,
  color: string,
): void {
  const size = fittedFontSize(ctx, text, maxWidth, preferredSize, minimumSize, weight);
  ctx.font = `${weight} ${size}px ${FONT_STACK}`;
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(text, WIDTH / 2, y);
}

function drawSupporterSeal(ctx: CanvasRenderingContext2D, label: string, top = 112): void {
  ctx.save();
  ctx.translate(78, top);
  ctx.rotate(-0.045);
  fillRoundRect(ctx, 0, 0, 198, 48, 7, COLOR.solved[0]);
  ctx.strokeStyle = COLOR.solvedEdge[0];
  ctx.lineWidth = 2;
  roundRect(ctx, 0, 0, 198, 48, 7);
  ctx.stroke();
  ctx.fillStyle = COLOR.ink;
  ctx.font = `800 22px ${FONT_STACK}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, 99, 25, 170);
  ctx.restore();
}

function drawArchetypeBadge(ctx: CanvasRenderingContext2D, badge: string, centerX: number, centerY: number): void {
  ctx.save();
  ctx.font = `800 20px ${FONT_STACK}`;
  const textWidth = ctx.measureText(badge).width;
  const paddingX = 24;
  const badgeWidth = textWidth + paddingX * 2;
  const badgeHeight = 42;
  const x = centerX - badgeWidth / 2;
  const y = centerY - badgeHeight / 2;

  fillRoundRect(ctx, x, y, badgeWidth, badgeHeight, 21, COLOR.surfaceHi);
  ctx.strokeStyle = COLOR.accent;
  ctx.lineWidth = 1.5;
  roundRect(ctx, x, y, badgeWidth, badgeHeight, 21);
  ctx.stroke();

  ctx.fillStyle = COLOR.accent;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(badge, centerX, centerY);
  ctx.restore();
}

function drawMetricStrip(ctx: CanvasRenderingContext2D, opts: ShareCardOptions, y: number): void {
  const labels = opts.labels ?? {};
  const thirdValue =
    opts.difficulty === "medium"
      ? opts.winkUsed
        ? (labels.winkUsed ?? "Wink used")
        : (labels.noWink ?? "No Wink")
      : (opts.difficultyLabel ?? opts.difficulty);
  const cells = [
    { value: formatDuration(opts.durationMs), label: labels.time ?? "Time" },
    { value: `${opts.mistakesUsed}/4`, label: labels.mistakes ?? "Mistakes" },
    { value: thirdValue, label: opts.difficultyLabel ?? opts.difficulty },
  ];

  const left = 222;
  const width = WIDTH - left * 2;
  const cellWidth = width / cells.length;
  ctx.fillStyle = COLOR.line;
  ctx.fillRect(left, y, width, 2);
  ctx.fillRect(left, y + 104, width, 2);

  cells.forEach((cell, index) => {
    const centerX = left + cellWidth * (index + 0.5);
    if (index > 0) {
      ctx.fillStyle = COLOR.line;
      ctx.fillRect(left + cellWidth * index, y + 22, 2, 62);
    }
    const valueSize = fittedFontSize(ctx, cell.value, cellWidth - 30, 32, 21, 750);
    ctx.font = `750 ${valueSize}px ${FONT_STACK}`;
    ctx.fillStyle = COLOR.text;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(cell.value, centerX, y + 48);
    ctx.font = `650 18px ${FONT_STACK}`;
    ctx.fillStyle = COLOR.muted;
    ctx.fillText(cell.label.toUpperCase(), centerX, y + 78, cellWidth - 24);
  });
}

function drawMarker(
  ctx: CanvasRenderingContext2D,
  row: number,
  centerX: number,
  centerY: number,
): void {
  ctx.fillStyle = COLOR.ink;
  ctx.beginPath();
  if (row % 4 === 0) {
    ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
  } else if (row % 4 === 1) {
    ctx.moveTo(centerX, centerY - 10);
    ctx.lineTo(centerX + 10, centerY);
    ctx.lineTo(centerX, centerY + 10);
    ctx.lineTo(centerX - 10, centerY);
    ctx.closePath();
  } else if (row % 4 === 2) {
    ctx.moveTo(centerX, centerY - 10);
    ctx.lineTo(centerX + 10, centerY + 9);
    ctx.lineTo(centerX - 10, centerY + 9);
    ctx.closePath();
  } else {
    ctx.rect(centerX - 8, centerY - 8, 16, 16);
  }
  ctx.fill();
}

function drawGrid(
  ctx: CanvasRenderingContext2D,
  opts: ShareCardOptions,
  y: number,
  cell = 72,
  gap = 12,
): void {
  const totalWidth = 4 * cell + 3 * gap;
  const startX = (WIDTH - totalWidth) / 2;
  const solvedSet = new Set(opts.solvedGroupIds);

  opts.groupOrder.forEach((groupId, row) => {
    const solved = solvedSet.has(groupId);
    for (let col = 0; col < 4; col++) {
      const x = startX + col * (cell + gap);
      const top = y + row * (cell + gap);
      const fill = solved ? COLOR.solved[row % 4] : COLOR.surfaceHi;
      const edge = solved ? COLOR.solvedEdge[row % 4] : COLOR.surface;

      fillRoundRect(ctx, x, top + 6, cell, cell, 10, edge);
      fillRoundRect(ctx, x, top, cell, cell, 10, fill);
      ctx.strokeStyle = solved ? edge : COLOR.line;
      ctx.lineWidth = 2;
      roundRect(ctx, x, top, cell, cell, 10);
      ctx.stroke();

      if (solved) drawMarker(ctx, row, x + cell / 2, top + cell / 2);
      if (opts.winkedGroupId === groupId && col === 3) {
        drawFoldedCorner(ctx, x + cell, top, Math.floor(cell * 0.38));
      }
    }
  });
}

function drawPerforation(ctx: CanvasRenderingContext2D, y: number): void {
  ctx.save();
  ctx.strokeStyle = COLOR.line;
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.moveTo(60, y);
  ctx.lineTo(WIDTH - 60, y);
  ctx.stroke();
  ctx.setLineDash([]);

  // Left and right ticket notch cutouts
  ctx.fillStyle = COLOR.bg;
  ctx.beginPath();
  ctx.arc(34, y, 10, -Math.PI / 2, Math.PI / 2);
  ctx.fill();
  ctx.strokeStyle = COLOR.line;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(WIDTH - 34, y, 10, Math.PI / 2, -Math.PI / 2);
  ctx.fill();
  ctx.strokeStyle = COLOR.line;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

function drawPostalStamp(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  solved: boolean,
  label: string,
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.055); // ~3.1 deg organic artisan tilt

  const w = 176;
  const h = 72;
  const stampColor = solved ? COLOR.accent : COLOR.muted;

  ctx.strokeStyle = stampColor;
  ctx.lineWidth = 2.5;
  roundRect(ctx, -w / 2, -h / 2, w, h, 8);
  ctx.stroke();

  // Inner subtle border
  ctx.strokeStyle = COLOR.line;
  ctx.lineWidth = 1;
  roundRect(ctx, -w / 2 + 4, -h / 2 + 4, w - 8, h - 8, 5);
  ctx.stroke();

  ctx.fillStyle = stampColor;
  ctx.font = `800 13px ${FONT_STACK}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("FOLDWINK POST", 0, -12);

  ctx.font = `700 11px ${FONT_STACK}`;
  ctx.fillStyle = COLOR.text;
  ctx.fillText("DAILY EDITION", 0, 4);

  ctx.font = `800 12px ${FONT_STACK}`;
  ctx.fillStyle = solved ? COLOR.solved[0] : COLOR.muted;
  ctx.fillText(solved ? "★ SOLVED ★" : label.toUpperCase(), 0, 21);

  ctx.restore();
}

function drawBarcode(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  ctx.save();
  ctx.fillStyle = COLOR.line;
  const barCount = 32;
  const barWidth = width / (barCount * 1.5);
  for (let i = 0; i < barCount; i++) {
    const isThick = (i * 7 + 3) % 4 === 0;
    const curX = x + i * barWidth * 1.5;
    ctx.fillRect(curX, y, isThick ? barWidth * 1.6 : barWidth * 0.8, height);
  }
  ctx.restore();
}

function drawFooter(ctx: CanvasRenderingContext2D, height: number): void {
  drawBarcode(ctx, 74, height - 68, 180, 20);
  ctx.fillStyle = COLOR.muted;
  ctx.font = `600 20px ${FONT_STACK}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("neural-void.com/foldwink", WIDTH / 2, height - 52);
  drawBarcode(ctx, WIDTH - 254, height - 68, 180, 20);
}

function drawPersonalWaxSeal(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  icon: string,
  label?: string,
  kintsugi?: boolean,
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(0.04);

  // Drop shadow
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 2, 42, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
  ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 4;
  ctx.fill();
  ctx.restore();

  // Outer melted wax pool (deep crimson wax)
  ctx.beginPath();
  ctx.arc(0, 0, 40, 0, Math.PI * 2);
  ctx.fillStyle = "#871f1f";
  ctx.fill();

  // Highlight crest rim (top-left arc)
  ctx.beginPath();
  ctx.arc(0, 0, 39, Math.PI * 0.8, Math.PI * 1.8);
  ctx.strokeStyle = "#b53e3e";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Inner stamped circle impression
  ctx.beginPath();
  ctx.arc(0, 0, 33, 0, Math.PI * 2);
  ctx.fillStyle = "#9e2a2b";
  ctx.fill();
  ctx.strokeStyle = "#5a1313";
  ctx.lineWidth = 1.8;
  ctx.stroke();

  // Kintsugi golden repair vein across the wax seal
  if (kintsugi) {
    ctx.save();
    ctx.strokeStyle = "#d4af37";
    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.shadowColor = "#e5c158";
    ctx.shadowBlur = 5;
    ctx.beginPath();
    ctx.moveTo(-28, -14);
    ctx.bezierCurveTo(-10, -4, 4, 3, 26, 20);
    ctx.stroke();

    // Branch vein
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(4, 3);
    ctx.bezierCurveTo(12, -7, 20, -11, 28, -9);
    ctx.stroke();
    ctx.restore();
  }

  // Center crest icon (e.g. 🦅, 🧭, 🗝️, 🦉, 🌿)
  ctx.font = "26px serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(icon, 0, -2);

  // Micro label below
  ctx.font = `800 8px ${FONT_STACK}`;
  ctx.fillStyle = kintsugi ? "#ffd700" : "#f5d580";
  ctx.fillText(
    kintsugi ? "KINTSUGI" : label ? label.toUpperCase().slice(0, 10) : "ARCHIVIST",
    0,
    24,
  );

  ctx.restore();
}

function drawPostalCancellationMark(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  dateStr: string,
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.07);

  const inkColor = "rgba(165, 173, 166, 0.65)";
  ctx.strokeStyle = inkColor;

  // Outer postmark circle
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, 36, 0, Math.PI * 2);
  ctx.stroke();

  // Inner concentric ring
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.arc(0, 0, 30, 0, Math.PI * 2);
  ctx.stroke();

  // Date and postal archive text
  ctx.fillStyle = inkColor;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `800 8px ${FONT_STACK}`;
  ctx.fillText("FOLDWINK POST", 0, -15);

  ctx.font = `700 10px ${FONT_STACK}`;
  ctx.fillText(dateStr.replace(/-/g, "."), 0, 0);

  ctx.font = `700 8px ${FONT_STACK}`;
  ctx.fillText("BUREAU № 1", 0, 15);

  // Wavy killer lines extending horizontally across the stamp
  ctx.beginPath();
  ctx.lineWidth = 1.8;
  const lineOffsets = [-16, -8, 0, 8, 16];
  for (const dy of lineOffsets) {
    ctx.moveTo(34, dy);
    ctx.bezierCurveTo(55, dy - 5, 75, dy + 5, 95, dy);
    ctx.bezierCurveTo(115, dy - 5, 135, dy + 5, 155, dy);
    ctx.bezierCurveTo(175, dy - 5, 195, dy + 5, 215, dy);
  }
  ctx.stroke();

  ctx.restore();
}

export function drawShareCard(canvas: HTMLCanvasElement, opts: ShareCardOptions): void {
  const isStory = opts.format === "story";
  const height = isStory ? HEIGHT_STORY : HEIGHT_SQUARE;
  canvas.width = WIDTH;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  drawBackground(ctx, height);

  if (isStory) {
    drawBrandMark(ctx, WIDTH / 2, 160);
    drawWordmark(ctx, 380);

    if (opts.sealIcon) {
      drawPersonalWaxSeal(
        ctx,
        140,
        168,
        opts.sealIcon,
        opts.sealLabel,
        opts.kintsugiRestored,
      );
    }

    if (opts.supporter) {
      drawSupporterSeal(ctx, opts.labels?.supporter ?? "Supporter", 228);
    }

    drawPostalStamp(
      ctx,
      WIDTH - 148,
      168,
      opts.result === "win",
      opts.difficultyLabel ?? opts.difficulty,
    );
    drawPostalCancellationMark(
      ctx,
      WIDTH - 275,
      168,
      opts.dateStr ?? todayLocal(),
    );

    drawCenteredText(ctx, opts.subtitle, 450, 800, 34, 24, 650, COLOR.accent);
    const headline =
      opts.result === "win"
        ? (opts.labels?.solved ?? "Solved")
        : (opts.labels?.closeCall ?? "Close call");
    drawCenteredText(
      ctx,
      headline,
      560,
      900,
      118,
      64,
      800,
      opts.result === "win" ? COLOR.text : COLOR.muted,
    );
    drawCenteredText(ctx, opts.title, 620, 800, 32, 22, 650, COLOR.muted);

    if (opts.archetype) {
      drawArchetypeBadge(ctx, opts.archetype, WIDTH / 2, 680);
    }

    drawMetricStrip(ctx, opts, 750);
    drawGrid(ctx, opts, 920, 108, 18);

    drawCenteredText(ctx, "Can you solve today's puzzle?", 1640, 800, 28, 20, 600, COLOR.text);
    drawPerforation(ctx, 1780);
    drawFooter(ctx, height);
  } else {
    drawBrandMark(ctx, WIDTH / 2, 60);
    drawWordmark(ctx, 260);

    if (opts.sealIcon) {
      drawPersonalWaxSeal(
        ctx,
        140,
        100,
        opts.sealIcon,
        opts.sealLabel,
        opts.kintsugiRestored,
      );
    }

    if (opts.supporter) {
      drawSupporterSeal(ctx, opts.labels?.supporter ?? "Supporter", 158);
    }

    drawPostalStamp(
      ctx,
      WIDTH - 148,
      100,
      opts.result === "win",
      opts.difficultyLabel ?? opts.difficulty,
    );
    drawPostalCancellationMark(
      ctx,
      WIDTH - 275,
      100,
      opts.dateStr ?? todayLocal(),
    );

    drawCenteredText(ctx, opts.subtitle, 310, 760, 28, 20, 650, COLOR.accent);
    const headline =
      opts.result === "win"
        ? (opts.labels?.solved ?? "Solved")
        : (opts.labels?.closeCall ?? "Close call");
    drawCenteredText(
      ctx,
      headline,
      395,
      860,
      96,
      54,
      800,
      opts.result === "win" ? COLOR.text : COLOR.muted,
    );
    drawCenteredText(ctx, opts.title, 440, 760, 28, 18, 650, COLOR.muted);

    if (opts.archetype) {
      drawArchetypeBadge(ctx, opts.archetype, WIDTH / 2, 490);
      drawMetricStrip(ctx, opts, 535);
      drawGrid(ctx, opts, 658);
    } else {
      drawMetricStrip(ctx, opts, 510);
      drawGrid(ctx, opts, 635);
    }

    drawPerforation(ctx, 978);
    drawFooter(ctx, height);
  }
}

export function renderShareCard(opts: ShareCardOptions): Promise<Blob | null> {
  return new Promise((resolve) => {
    if (!isShareCardSupported()) {
      resolve(null);
      return;
    }
    try {
      const canvas = document.createElement("canvas");
      drawShareCard(canvas, opts);
      canvas.toBlob((blob) => resolve(blob), "image/png");
    } catch {
      resolve(null);
    }
  });
}
