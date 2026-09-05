import { useState, useRef, useEffect } from "react";
import {
  loadArchivistProfile,
  saveArchivistProfile,
  getGuildRank,
  getXpForLevel,
} from "../progression/archivistProfile";
import { STAMP_COLLECTION, SEALS, NIBS, TITLES } from "../progression/stamps";
import { useLang } from "../i18n/useLanguage";
import { useSound } from "../audio/useSound";
import { triggerHaptic } from "../haptics/haptics";
import { getOrCreatePlayerSeed, setPlayerSeed } from "../puzzles/progression";
import {
  encodePassportToSeal,
  decodePassportFromSeal,
  drawWaxSealCertificate,
} from "../progression/waxSealTransfer";

interface ArchivistPassportModalProps {
  onClose: () => void;
  onOpenContract?: () => void;
}

export function ArchivistPassportModal({ onClose, onOpenContract }: ArchivistPassportModalProps) {
  const [profile, setProfile] = useState(loadArchivistProfile);
  const [activeTab, setActiveTab] = useState<"passport" | "stamps">("passport");
  const [selectedStampId, setSelectedStampId] = useState<string | null>(null);
  const [subView, setSubView] = useState<"none" | "export" | "import">("none");
  const [importInput, setImportInput] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lang = useLang();
  const playSound = useSound();

  const rank = getGuildRank(profile.level);
  const curLevelXp = getXpForLevel(profile.level);
  const nextLevelXp = getXpForLevel(profile.level + 1);
  const xpProgress = Math.min(
    100,
    Math.max(0, ((profile.xp - curLevelXp) / Math.max(1, nextLevelXp - curLevelXp)) * 100),
  );

  const sealString = encodePassportToSeal(profile, getOrCreatePlayerSeed());

  useEffect(() => {
    if (subView === "export" && canvasRef.current) {
      drawWaxSealCertificate(canvasRef.current, profile, sealString, lang);
    }
  }, [subView, profile, sealString, lang]);

  const handleUpdateField = (key: "sealId" | "nibId" | "titleId", val: string) => {
    const next = { ...profile, [key]: val };
    setProfile(next);
    saveArchivistProfile(next);
    playSound("select");
    triggerHaptic("select");
  };

  const handleCopySeal = async () => {
    try {
      await navigator.clipboard.writeText(sealString);
      setCopySuccess(true);
      playSound("submit");
      triggerHaptic("select");
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const handleDownloadCertificate = () => {
    if (!canvasRef.current) return;
    const url = canvasRef.current.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `foldwink-passport-${profile.level}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    playSound("submit");
  };

  const handleImportSubmit = () => {
    setImportError(null);
    const res = decodePassportFromSeal(importInput);
    if (!res.ok || !res.profile) {
      setImportError(
        res.error ??
          (lang === "ru"
            ? "Неверная сургучная печать"
            : "Invalid wax seal code"),
      );
      playSound("wrong");
      triggerHaptic("wrong");
      return;
    }

    saveArchivistProfile(res.profile);
    if (res.playerSeed) {
      setPlayerSeed(res.playerSeed);
    }
    setProfile(res.profile);
    setImportSuccess(true);
    playSound("correct");
    triggerHaptic("correct");
    setTimeout(() => {
      setImportSuccess(false);
      setSubView("none");
      setImportInput("");
    }, 1500);
  };

  const getRankTitle = () => {
    if (lang === "ru") return rank.titleRu;
    if (lang === "de") return rank.titleDe;
    return rank.titleEn;
  };

  const getTitleLabel = (tId: string) => {
    const item = TITLES.find((t) => t.id === tId) ?? TITLES[0];
    if (lang === "ru") return item.labelRu;
    if (lang === "de") return item.labelDe;
    return item.labelEn;
  };

  const selectedStamp = STAMP_COLLECTION.find((s) => s.id === selectedStampId);
  const validatedImport = importInput.trim() ? decodePassportFromSeal(importInput) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header Tabs & Close */}
        <div className="flex items-center justify-between border-b border-line pb-3">
          {subView === "none" ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("passport")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  activeTab === "passport" ? "bg-accent text-white" : "text-muted hover:text-text"
                }`}
              >
                📜 {lang === "ru" ? "Паспорт" : lang === "de" ? "Pass" : "Passport"}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("stamps")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  activeTab === "stamps" ? "bg-accent text-white" : "text-muted hover:text-text"
                }`}
              >
                💌 {lang === "ru" ? "Альбом Марок" : lang === "de" ? "Marken-Album" : "Stamp Album"} ({profile.collectedStampIds.length}/{STAMP_COLLECTION.length})
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setSubView("none");
                setImportError(null);
              }}
              className="text-xs font-bold text-accent hover:underline flex items-center gap-1"
            >
              ← {lang === "ru" ? "Назад в Паспорт" : lang === "de" ? "Zurück" : "Back to Passport"}
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="text-muted hover:text-text text-sm p-1"
          >
            ✕
          </button>
        </div>

        {/* SubView: Wax Seal Export */}
        {subView === "export" && (
          <div className="space-y-4 text-center animate-in zoom-in-95 duration-150">
            <div className="text-xs uppercase tracking-widest font-bold text-muted">
              {lang === "ru"
                ? "📜 Сургучная Грамота (Перенос без сервера)"
                : "📜 Wax Seal Certificate (Zero-Backend Export)"}
            </div>

            <div className="flex justify-center">
              <canvas
                ref={canvasRef}
                className="w-64 h-auto rounded-xl border border-line shadow-2xl bg-[#121613]"
              />
            </div>

            <p className="text-[11px] text-muted max-w-xs mx-auto">
              {lang === "ru"
                ? "Отсканируйте QR-код камерой на другом устройстве или скопируйте строку печати для мгновенного переноса профиля."
                : "Scan this QR code with another device or copy the seal code below to transfer your passport without any server."}
            </p>

            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                onClick={handleCopySeal}
                className="w-full py-2.5 rounded-xl border border-accent/60 bg-accent/20 hover:bg-accent/30 text-accent text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <span>{copySuccess ? "✓" : "📋"}</span>
                <span>
                  {copySuccess
                    ? (lang === "ru" ? "Печать Скопирована!" : "Seal Copied!")
                    : (lang === "ru" ? "Скопировать Код Печати" : "Copy Seal Code")}
                </span>
              </button>

              <button
                type="button"
                onClick={handleDownloadCertificate}
                className="w-full py-2 rounded-xl border border-line bg-surfaceHi hover:bg-surfaceHi/80 text-text text-xs font-medium transition-all flex items-center justify-center gap-2"
              >
                <span>💾</span>
                <span>{lang === "ru" ? "Сохранить Грамоту (PNG)" : "Download Scroll (PNG)"}</span>
              </button>
            </div>
          </div>
        )}

        {/* SubView: Wax Seal Import */}
        {subView === "import" && (
          <div className="space-y-4 text-left animate-in zoom-in-95 duration-150">
            <div className="text-center">
              <div className="text-xs uppercase tracking-widest font-bold text-muted">
                {lang === "ru" ? "📥 Импорт Сургучной Печати" : "📥 Import Wax Seal"}
              </div>
              <p className="text-[11px] text-muted mt-1">
                {lang === "ru"
                  ? "Вставьте код сургучной печати (FWSEAL1:...) для восстановления паспорта."
                  : "Paste your wax seal code (FWSEAL1:...) to restore your passport."}
              </p>
            </div>

            <div>
              <textarea
                value={importInput}
                onChange={(e) => {
                  setImportInput(e.target.value);
                  setImportError(null);
                }}
                rows={3}
                placeholder="FWSEAL1:..."
                className="w-full rounded-xl border border-line bg-surfaceHi p-2.5 text-xs text-text font-mono focus:border-accent outline-none"
              />
            </div>

            {importError && (
              <div className="p-2 rounded-lg bg-red-950/40 border border-red-500/50 text-red-300 text-xs">
                ⚠️ {importError}
              </div>
            )}

            {validatedImport?.ok && validatedImport.profile && (
              <div className="p-3 rounded-xl border border-accent/60 bg-accent/10 space-y-1 text-xs animate-in fade-in duration-150">
                <div className="font-bold text-accent flex items-center gap-1.5">
                  <span>✓</span>
                  <span>{lang === "ru" ? "Печать проверена Гильдией" : "Verified Guild Seal"}</span>
                </div>
                <div className="text-text font-medium">
                  {getGuildRank(validatedImport.profile.level).icon}{" "}
                  {lang === "ru"
                    ? getGuildRank(validatedImport.profile.level).titleRu
                    : getGuildRank(validatedImport.profile.level).titleEn}{" "}
                  · Lv. {validatedImport.profile.level} ({validatedImport.profile.xp} XP)
                </div>
                <div className="text-muted text-[11px]">
                  💧 {validatedImport.profile.ink} · 🕯️ {validatedImport.profile.wax} · 👑 {validatedImport.profile.prestige} · 💌 {validatedImport.profile.collectedStampIds.length} {lang === "ru" ? "марок" : "stamps"}
                </div>
              </div>
            )}

            <button
              type="button"
              disabled={!validatedImport?.ok || importSuccess}
              onClick={handleImportSubmit}
              className={`w-full py-2.5 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm ${
                validatedImport?.ok
                  ? "border-accent bg-accent text-white hover:opacity-90 cursor-pointer"
                  : "border-line bg-surfaceHi text-muted opacity-50 cursor-not-allowed"
              }`}
            >
              <span>{importSuccess ? "✓" : "📥"}</span>
              <span>
                {importSuccess
                  ? (lang === "ru" ? "Паспорт Успешно Восстановлен!" : "Passport Restored!")
                  : (lang === "ru" ? "Применить Печать и Восстановить" : "Apply Seal & Restore")}
              </span>
            </button>
          </div>
        )}

        {/* Main View: Passport / Stamps */}
        {subView === "none" && activeTab === "passport" && (
          <div className="space-y-4">
            {/* Vintage Guild Passport Card */}
            <div className="rounded-xl border-2 border-line bg-surfaceHi/60 p-4 relative overflow-hidden shadow-inner space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-widest text-muted">
                    Guild of Archivists
                  </div>
                  <div className="text-base font-extrabold text-text flex items-center gap-1.5">
                    <span>{rank.icon}</span>
                    <span>{getRankTitle()}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-black text-accent">Lv. {profile.level}</div>
                  <div className="text-[10px] text-muted">{profile.xp} XP</div>
                </div>
              </div>

              {/* XP Progress bar */}
              <div className="w-full bg-line/60 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-accent h-full transition-all duration-300"
                  style={{ width: `${xpProgress}%` }}
                />
              </div>

              {/* Balances */}
              <div className="grid grid-cols-4 gap-1.5 pt-1 text-center">
                <div className="p-1.5 rounded-lg bg-surface/80 border border-line">
                  <div className="text-xs font-bold text-blue-400">💧 {profile.ink}</div>
                  <div className="text-[9px] text-muted uppercase font-semibold">{lang === "ru" ? "Чернила" : "Ink"}</div>
                </div>
                <div className="p-1.5 rounded-lg bg-surface/80 border border-line">
                  <div className="text-xs font-bold text-amber-400">🕯️ {profile.wax}</div>
                  <div className="text-[9px] text-muted uppercase font-semibold">{lang === "ru" ? "Сургуч" : "Wax"}</div>
                </div>
                <div className="p-1.5 rounded-lg bg-surface/80 border border-line">
                  <div className="text-xs font-bold text-yellow-300">👑 {profile.prestige}</div>
                  <div className="text-[9px] text-muted uppercase font-semibold">Prestige</div>
                </div>
                <div className="p-1.5 rounded-lg bg-surface/80 border border-line">
                  <div className="text-xs font-bold text-red-400">⚔️ {profile.contractsWon}</div>
                  <div className="text-[9px] text-muted uppercase font-semibold">{lang === "ru" ? "Контракты" : "Trials"}</div>
                </div>
              </div>
            </div>

            {/* Customization: Title, Seal, Nib */}
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-1">
                  {lang === "ru" ? "Официальный Титул" : "Official Guild Title"}
                </label>
                <select
                  value={profile.titleId}
                  onChange={(e) => handleUpdateField("titleId", e.target.value)}
                  className="w-full rounded-lg border border-line bg-surfaceHi p-2 text-xs text-text font-medium"
                >
                  {TITLES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {getTitleLabel(t.id)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-1">
                    {lang === "ru" ? "Личная Печать" : "Wax Seal"}
                  </label>
                  <select
                    value={profile.sealId}
                    onChange={(e) => handleUpdateField("sealId", e.target.value)}
                    className="w-full rounded-lg border border-line bg-surfaceHi p-2 text-xs text-text font-medium"
                  >
                    {SEALS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.icon} {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-1">
                    {lang === "ru" ? "Перо Мастера" : "Scribe Nib"}
                  </label>
                  <select
                    value={profile.nibId}
                    onChange={(e) => handleUpdateField("nibId", e.target.value)}
                    className="w-full rounded-lg border border-line bg-surfaceHi p-2 text-xs text-text font-medium"
                  >
                    {NIBS.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.icon} {n.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Zero-Backend Portable Wax Seal Export & Import Actions */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setSubView("export");
                  playSound("select");
                  triggerHaptic("select");
                }}
                className="py-2.5 px-3 rounded-xl border border-amber-500/40 bg-amber-950/20 hover:bg-amber-950/40 text-amber-200 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-sm"
              >
                <span>📜</span>
                <span>{lang === "ru" ? "Запечатать (QR)" : "Seal Passport"}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSubView("import");
                  playSound("select");
                  triggerHaptic("select");
                }}
                className="py-2.5 px-3 rounded-xl border border-line bg-surfaceHi hover:bg-surfaceHi/80 text-muted hover:text-text text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-sm"
              >
                <span>📥</span>
                <span>{lang === "ru" ? "Импорт Печати" : "Import Seal"}</span>
              </button>
            </div>

            {/* Iron Contract CTA */}
            {onOpenContract && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenContract();
                }}
                className="w-full py-2.5 rounded-xl border border-red-500/40 bg-red-950/30 hover:bg-red-950/50 text-red-200 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <span>⚔️</span>
                <span>{lang === "ru" ? "Железный Контракт (Высокие Ставки)" : "The Iron Contract (High Stakes)"}</span>
              </button>
            )}
          </div>
        )}

        {/* Main View: Stamp Album Tab */}
        {subView === "none" && activeTab === "stamps" && (
          <div className="space-y-3">
            <div className="grid grid-cols-4 gap-2">
              {STAMP_COLLECTION.map((stamp) => {
                const isCollected = profile.collectedStampIds.includes(stamp.id);
                return (
                  <button
                    key={stamp.id}
                    type="button"
                    onClick={() => setSelectedStampId(stamp.id)}
                    className={`aspect-square rounded-xl border flex flex-col items-center justify-center p-1.5 transition-all ${
                      isCollected
                        ? "border-accent/60 bg-surfaceHi/80 hover:scale-105 shadow-sm"
                        : "border-line/40 opacity-30 bg-surfaceHi/20 cursor-default"
                    }`}
                  >
                    <span className="text-2xl">{isCollected ? stamp.icon : "🔒"}</span>
                    <span className="text-[9px] text-muted font-bold truncate max-w-full mt-1">
                      {isCollected ? stamp.theme : "???"}
                    </span>
                  </button>
                );
              })}
            </div>

            {selectedStamp && (
              <div className="p-3 rounded-xl border border-line bg-surfaceHi text-left space-y-1 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-xs text-text flex items-center gap-1.5">
                    <span>{selectedStamp.icon}</span>
                    <span>
                      {lang === "ru"
                        ? selectedStamp.nameRu
                        : lang === "de"
                          ? selectedStamp.nameDe
                          : selectedStamp.nameEn}
                    </span>
                  </div>
                  <span className="text-[9px] uppercase px-1.5 py-0.5 rounded font-bold bg-accent/20 text-accent">
                    {selectedStamp.rarity}
                  </span>
                </div>
                <p className="text-[11px] text-muted italic">
                  "{lang === "ru"
                    ? selectedStamp.provenanceRu
                    : lang === "de"
                      ? selectedStamp.provenanceDe
                      : selectedStamp.provenanceEn}"
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
