import type { ArchivistProfile, DisciplineId } from "./types";
import { GUILD_RANKS } from "./types";
import { SEALS, TITLES, STAMP_COLLECTION } from "./stamps";
import { fnv1a } from "../utils/hash";
import { generateQrMatrix, drawQrToCanvas } from "./qr";

export interface CompactPassportPayload {
  v: 1;
  lvl: number;
  xp: number;
  ink: number;
  wax: number;
  p: number;
  d: DisciplineId;
  s: string;
  n: string;
  t: string;
  st: string[];
  ps?: string;
  ca: number;
  cw: number;
}

function toBase64(str: string): string {
  try {
    if (typeof btoa === "function") {
      const bytes = new TextEncoder().encode(str);
      let binary = "";
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
    }
  } catch {
    /* fallback */
  }
  return Buffer.from(str, "utf-8").toString("base64");
}

function fromBase64(b64: string): string {
  try {
    if (typeof atob === "function") {
      const binary = atob(b64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return new TextDecoder().decode(bytes);
    }
  } catch {
    /* fallback */
  }
  return Buffer.from(b64, "base64").toString("utf-8");
}

export function encodePassportToSeal(
  profile: ArchivistProfile,
  playerSeed?: string,
): string {
  const stampIds = Array.isArray(profile.collectedStampIds) ? profile.collectedStampIds : [];
  let stampMask = 0;
  let allInCollection = true;
  for (const s of stampIds) {
    const idx = STAMP_COLLECTION.findIndex((item) => item.id === s);
    if (idx !== -1) {
      stampMask |= (1 << idx);
    } else {
      allInCollection = false;
      break;
    }
  }
  const compactStamps = allInCollection ? stampMask : stampIds;

  // Ultra-compact array payload: [v, lvl, xp, ink, wax, p, d, s, n, t, st, ps, ca, cw]
  const payloadArray = [
    1,
    Math.max(1, Math.floor(profile.level)),
    Math.max(0, Math.floor(profile.xp)),
    Math.max(0, Math.floor(profile.ink)),
    Math.max(0, Math.floor(profile.wax)),
    Math.max(0, Math.floor(profile.prestige)),
    profile.discipline || "scribe",
    profile.sealId || "seal_raven",
    profile.nibId || "nib_brass",
    profile.titleId || "title_truths",
    compactStamps,
    playerSeed ?? profile.playerSeed ?? null,
    Math.max(0, Math.floor(profile.contractsAttempted || 0)),
    Math.max(0, Math.floor(profile.contractsWon || 0)),
  ];

  const jsonStr = JSON.stringify(payloadArray);
  const hash = (fnv1a(jsonStr) >>> 0).toString(16).padStart(8, "0");
  const b64 = toBase64(jsonStr);
  return `FWSEAL1:${hash}-${b64}`;
}

export interface DecodeResult {
  ok: boolean;
  profile?: ArchivistProfile;
  playerSeed?: string;
  error?: string;
}

export function decodePassportFromSeal(sealString: string): DecodeResult {
  const trimmed = sealString.trim();
  if (!trimmed.startsWith("FWSEAL1:")) {
    return { ok: false, error: "Invalid seal format (missing FWSEAL1 header)" };
  }

  const rest = trimmed.slice("FWSEAL1:".length);
  const dashIndex = rest.indexOf("-");
  if (dashIndex === -1) {
    return { ok: false, error: "Invalid seal format (corrupt checksum separator)" };
  }

  const expectedHash = rest.slice(0, dashIndex);
  const b64 = rest.slice(dashIndex + 1);

  try {
    const jsonStr = fromBase64(b64);
    const actualHash = (fnv1a(jsonStr) >>> 0).toString(16).padStart(8, "0");
    if (actualHash !== expectedHash) {
      return { ok: false, error: "Seal verification failed (checksum mismatch / tampering)" };
    }

    const rawPayload = JSON.parse(jsonStr);
    let v: number;
    let lvl: number;
    let xp: number;
    let ink: number;
    let wax: number;
    let p: number;
    let d: DisciplineId;
    let s: string;
    let n: string;
    let t: string;
    let st: number | string[];
    let ps: string | null | undefined;
    let ca: number;
    let cw: number;

    if (Array.isArray(rawPayload)) {
      [v, lvl, xp, ink, wax, p, d, s, n, t, st, ps, ca, cw] = rawPayload;
    } else {
      const obj = rawPayload as Partial<CompactPassportPayload>;
      v = obj.v ?? 1;
      lvl = obj.lvl ?? 1;
      xp = obj.xp ?? 0;
      ink = obj.ink ?? 0;
      wax = obj.wax ?? 0;
      p = obj.p ?? 0;
      d = obj.d ?? "scribe";
      s = obj.s ?? "seal_raven";
      n = obj.n ?? "nib_brass";
      t = obj.t ?? "title_truths";
      st = obj.st ?? ["stamp_morning_brew"];
      ps = obj.ps;
      ca = obj.ca ?? 0;
      cw = obj.cw ?? 0;
    }

    if (v !== 1) {
      return { ok: false, error: `Unsupported seal version (${v})` };
    }
    if (typeof lvl !== "number" || typeof xp !== "number") {
      return { ok: false, error: "Missing level or XP in seal data" };
    }

    // Resolve stamps
    let collectedStampIds: string[];
    if (typeof st === "number") {
      collectedStampIds = [];
      for (let i = 0; i < STAMP_COLLECTION.length; i++) {
        if ((st & (1 << i)) !== 0) {
          collectedStampIds.push(STAMP_COLLECTION[i].id);
        }
      }
      if (collectedStampIds.length === 0) {
        collectedStampIds = ["stamp_morning_brew"];
      }
    } else if (Array.isArray(st)) {
      collectedStampIds = st.map((item) => (item.startsWith("stamp_") ? item : `stamp_${item}`));
    } else {
      collectedStampIds = ["stamp_morning_brew"];
    }

    const cleanSealId = s?.startsWith("seal_") ? s : s ? `seal_${s}` : "seal_raven";
    const cleanNibId = n?.startsWith("nib_") ? n : n ? `nib_${n}` : "nib_brass";
    const cleanTitleId = t?.startsWith("title_") ? t : t ? `title_${t}` : "title_truths";

    const profile: ArchivistProfile = {
      version: 1,
      level: Math.max(1, lvl),
      xp: Math.max(0, xp),
      ink: Math.max(0, ink ?? 0),
      wax: Math.max(0, wax ?? 0),
      prestige: Math.max(0, p ?? 0),
      discipline: d ?? "scribe",
      sealId: cleanSealId,
      nibId: cleanNibId,
      titleId: cleanTitleId,
      collectedStampIds,
      contractsAttempted: Math.max(0, ca ?? 0),
      contractsWon: Math.max(0, cw ?? 0),
      activeContract: null,
      playerSeed: ps || undefined,
    };

    return { ok: true, profile, playerSeed: ps || undefined };
  } catch (err) {
    return { ok: false, error: `Decoding error: ${err instanceof Error ? err.message : String(err)}` };
  }
}

export function drawWaxSealCertificate(
  canvas: HTMLCanvasElement,
  profile: ArchivistProfile,
  sealString: string,
  lang: string = "en",
): void {
  const width = 540;
  const height = 680;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const fontStack = "'Manrope Variable', -apple-system, sans-serif";

  // Background - rich archival surface
  ctx.fillStyle = "#121613";
  ctx.fillRect(0, 0, width, height);

  // Inner parchment card
  ctx.fillStyle = "#1b201c";
  ctx.fillRect(16, 16, width - 32, height - 32);

  // Border lines
  ctx.strokeStyle = "#38433a";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(22, 22, width - 44, height - 44);

  ctx.strokeStyle = "#b59f63"; // gold inner pinstripe
  ctx.lineWidth = 0.8;
  ctx.strokeRect(26, 26, width - 52, height - 52);

  // Guild Header
  ctx.textAlign = "center";
  ctx.fillStyle = "#a5ada6";
  ctx.font = `700 10px ${fontStack}`;
  ctx.fillText(
    lang === "ru"
      ? "ГИЛЬДИЯ АРХИВАРИУСОВ · ОФИЦИАЛЬНАЯ ГРАМОТА"
      : lang === "de"
        ? "GILDEN-URKUNDE · ARCHIVARSGILDE"
        : "ARCHIVIST GUILD · OFFICIAL DISPATCH",
    width / 2,
    55,
  );

  ctx.fillStyle = "#f1f4ee";
  ctx.font = `800 20px ${fontStack}`;
  ctx.fillText(
    lang === "ru"
      ? "Сургучный Паспорт Архивариуса"
      : lang === "de"
        ? "Archivars-Siegelpass"
        : "Archivist Seal Passport",
    width / 2,
    82,
  );

  // Wax Seal Emblem
  const seal = SEALS.find((s) => s.id === profile.sealId) ?? SEALS[0];
  const sealX = width / 2;
  const sealY = 145;

  // Outer melted wax pool
  ctx.save();
  ctx.beginPath();
  ctx.arc(sealX, sealY, 40, 0, Math.PI * 2);
  ctx.fillStyle = "#8a2020";
  ctx.shadowColor = "rgba(0,0,0,0.6)";
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 4;
  ctx.fill();
  ctx.restore();

  // Inner stamped ring
  ctx.beginPath();
  ctx.arc(sealX, sealY, 34, 0, Math.PI * 2);
  ctx.fillStyle = "#9e2a2b";
  ctx.fill();
  ctx.strokeStyle = "#6b1414";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Crest icon
  ctx.font = "28px serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(seal.icon, sealX, sealY);

  // Title & Level
  const rank = GUILD_RANKS.find((r) => r.minLevel <= profile.level) ?? GUILD_RANKS[0];
  const rankTitle =
    lang === "ru" ? rank.titleRu : lang === "de" ? rank.titleDe : rank.titleEn;
  const officialTitle =
    TITLES.find((t) => t.id === profile.titleId) ?? TITLES[0];
  const titleLabel =
    lang === "ru"
      ? officialTitle.labelRu
      : lang === "de"
        ? officialTitle.labelDe
        : officialTitle.labelEn;

  ctx.fillStyle = "#e0b25e";
  ctx.font = `700 13px ${fontStack}`;
  ctx.textBaseline = "alphabetic";
  ctx.fillText(`${rank.icon} ${rankTitle} · Lv. ${profile.level}`, width / 2, 212);

  ctx.fillStyle = "#a5ada6";
  ctx.font = `italic 12px ${fontStack}`;
  ctx.fillText(`"${titleLabel}"`, width / 2, 230);

  // Resource Ledger strip
  const ledgerY = 262;
  ctx.fillStyle = "#252b26";
  ctx.fillRect(44, ledgerY - 18, width - 88, 36);
  ctx.strokeStyle = "#38433a";
  ctx.lineWidth = 1;
  ctx.strokeRect(44, ledgerY - 18, width - 88, 36);

  ctx.font = `700 11px ${fontStack}`;
  ctx.fillStyle = "#f1f4ee";
  ctx.textAlign = "center";
  ctx.fillText(
    `XP: ${profile.xp}   ·   💧 ${profile.ink}   ·   🕯️ ${profile.wax}   ·   👑 ${profile.prestige}   ·   💌 ${profile.collectedStampIds.length}`,
    width / 2,
    ledgerY + 5,
  );

  // QR Code Frame
  const qrSize = 220;
  const qrX = (width - qrSize) / 2;
  const qrY = 300;

  // White parchment backing for scan contrast
  ctx.fillStyle = "#f1f4ee";
  ctx.fillRect(qrX - 8, qrY - 8, qrSize + 16, qrSize + 16);
  ctx.strokeStyle = "#b59f63";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(qrX - 8, qrY - 8, qrSize + 16, qrSize + 16);

  // Draw QR code matrix
  const matrix = generateQrMatrix(sealString);
  drawQrToCanvas(ctx, matrix, qrX, qrY, qrSize, "#151a17", "#f1f4ee");

  // Code snippet text below QR
  ctx.fillStyle = "#a5ada6";
  ctx.font = `600 9px monospace`;
  ctx.textAlign = "center";
  const displaySnippet =
    sealString.length > 44 ? sealString.slice(0, 42) + "..." : sealString;
  ctx.fillText(displaySnippet, width / 2, qrY + qrSize + 22);

  // Footer motto
  ctx.fillStyle = "#747d75";
  ctx.font = `italic 10px ${fontStack}`;
  ctx.fillText("Scripta manent · In veritate silentium", width / 2, height - 36);

  ctx.fillStyle = "#4a534c";
  ctx.font = `700 8px ${fontStack}`;
  ctx.fillText("neural-void.com/foldwink", width / 2, height - 24);
}

export const ARCHIVIST_BACKUP_KEY = "foldwink_archivist_backup";

export interface ArchivistBackupPayload {
  profile: ArchivistProfile;
  playerSeed?: string;
  backedUpAt: string;
}

export function saveArchivistBackup(profile: ArchivistProfile, playerSeed?: string): void {
  if (typeof localStorage === "undefined") return;
  try {
    const payload: ArchivistBackupPayload = {
      profile,
      playerSeed,
      backedUpAt: new Date().toISOString(),
    };
    localStorage.setItem(ARCHIVIST_BACKUP_KEY, JSON.stringify(payload));
  } catch {
    /* ignore */
  }
}

export function loadArchivistBackup(): ArchivistBackupPayload | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(ARCHIVIST_BACKUP_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ArchivistBackupPayload;
  } catch {
    return null;
  }
}

export function hasArchivistBackup(): boolean {
  if (typeof localStorage === "undefined") return false;
  try {
    return Boolean(localStorage.getItem(ARCHIVIST_BACKUP_KEY));
  } catch {
    return false;
  }
}

export function clearArchivistBackup(): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.removeItem(ARCHIVIST_BACKUP_KEY);
  } catch {
    /* ignore */
  }
}
