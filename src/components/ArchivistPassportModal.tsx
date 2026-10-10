import { useState, useRef, useEffect } from "react";
import {
  loadArchivistProfile,
  getGuildRank,
  getXpForLevel,
} from "../progression/archivistProfile";
import { STAMP_COLLECTION, SEALS, NIBS, TITLES } from "../progression/stamps";
import { StampArtwork } from "./StampArtwork";
import { useLang, useT } from "../i18n/useLanguage";
import { useGameStore } from "../game/state/appStore";
import { useFeedback } from "../feedback/useFeedback";
import { getOrCreatePlayerSeed } from "../puzzles/progression";
import {
  COLLECTION_MILESTONES,
  earnedCollectionMilestones,
  uniqueSolvedCount,
} from "../progression/milestones";
import {
  encodePassportToSeal,
  decodePassportFromSeal,
  drawWaxSealCertificate,
  type DecodeResult,
} from "../progression/waxSealTransfer";
import { tryGenerateQrMatrix } from "../progression/qr";
import { ProfileTransferDialog } from "./ProfileTransferDialog";

interface ArchivistPassportModalProps {
  onClose: () => void;
  onOpenContract?: () => void;
}

export function ArchivistPassportModal({
  onClose,
  onOpenContract,
}: ArchivistPassportModalProps) {
  const [profile, setProfile] = useState(loadArchivistProfile);
  const [activeTab, setActiveTab] = useState<"passport" | "stamps">("passport");
  const [selectedStampId, setSelectedStampId] = useState<string | null>(null);
  const [subView, setSubView] = useState<"none" | "export" | "import" | "diff">("none");
  const [pendingImport, setPendingImport] = useState<DecodeResult | null>(null);
  const [importInput, setImportInput] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const [legacyImportBusy, setLegacyImportBusy] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [profileTransferOpen, setProfileTransferOpen] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lang = useLang();
  const t = useT();
  const stats = useGameStore((s) => s.stats);
  const updateProfileCosmetic = useGameStore((s) => s.updateProfileCosmetic);
  const importLegacyPassport = useGameStore((s) => s.importLegacyPassport);
  const solvedCount = uniqueSolvedCount(stats);
  const earnedMilestones = earnedCollectionMilestones(stats);
  const feedback = useFeedback();

  const rank = getGuildRank(profile.level);
  const curLevelXp = getXpForLevel(profile.level);
  const nextLevelXp = getXpForLevel(profile.level + 1);
  const xpProgress = Math.min(
    100,
    Math.max(0, ((profile.xp - curLevelXp) / Math.max(1, nextLevelXp - curLevelXp)) * 100),
  );

  const sealString = encodePassportToSeal(profile, getOrCreatePlayerSeed());
  const sealQrResult = tryGenerateQrMatrix(sealString);

  useEffect(() => {
    if (subView === "export" && canvasRef.current) {
      drawWaxSealCertificate(canvasRef.current, profile, sealString, lang);
    }
  }, [subView, profile, sealString, lang]);

  const handleUpdateField = (key: "sealId" | "nibId" | "titleId", val: string) => {
    const next = { ...profile, [key]: val };
    if (updateProfileCosmetic(key, val)) {
      setProfile(next);
      feedback("select");
    }
  };

  const handleCopySeal = async () => {
    try {
      await navigator.clipboard.writeText(sealString);
      setCopySuccess(true);
      feedback("submit");
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
    feedback("submit");
  };

  const handleImportSubmit = () => {
    setImportError(null);
    const res = decodePassportFromSeal(importInput);
    if (!res.ok || !res.profile) {
      setImportError(
        res.error ?? (lang === "ru" ? "Неверная сургучная печать" : "Invalid wax seal code"),
      );
      feedback("wrong");
      return;
    }

    // Instead of immediately overwriting, proceed to Diff Preview
    setPendingImport(res);
    setSubView("diff");
    feedback("select");
  };

  const handleConfirmReplace = async () => {
    if (!pendingImport || !pendingImport.profile) return;
    setLegacyImportBusy(true);
    setImportError(null);
    const incoming = pendingImport.profile;
    const committed = await importLegacyPassport({
      playerSeed: pendingImport.playerSeed,
      sealId: incoming.sealId,
      nibId: incoming.nibId,
      titleId: incoming.titleId,
      collectedStampIds: incoming.collectedStampIds,
    });
    setLegacyImportBusy(false);
    if (!committed) {
      setImportError(
        lang === "ru"
          ? "Не удалось надёжно сохранить паспорт. Проверь память браузера или закрой другую вкладку с игрой."
          : lang === "de"
            ? "Der Pass konnte nicht sicher gespeichert werden. Prüfe Speicher oder einen Tab-Konflikt."
            : "The passport could not be saved safely. Check storage or another-tab conflict.",
      );
      feedback("wrong");
      return;
    }
    setProfile({
      ...profile,
      sealId: incoming.sealId,
      nibId: incoming.nibId,
      titleId: incoming.titleId,
      collectedStampIds: [
        ...new Set([...profile.collectedStampIds, ...incoming.collectedStampIds]),
      ],
      playerSeed: pendingImport.playerSeed ?? profile.playerSeed,
    });
    setImportSuccess(true);
    feedback("correct");
    setTimeout(() => {
      setImportSuccess(false);
      setSubView("none");
      setPendingImport(null);
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

  const getSealLabel = (sId: string) => {
    const item = SEALS.find((s) => s.id === sId) ?? SEALS[0];
    if (lang === "ru") return item.labelRu ?? item.label;
    if (lang === "de") return item.labelDe ?? item.label;
    return item.label;
  };

  const getNibLabel = (nId: string) => {
    const item = NIBS.find((n) => n.id === nId) ?? NIBS[0];
    if (lang === "ru") return item.labelRu ?? item.label;
    if (lang === "de") return item.labelDe ?? item.label;
    return item.label;
  };

  const selectedStamp = STAMP_COLLECTION.find((s) => s.id === selectedStampId);
  const validatedImport = importInput.trim() ? decodePassportFromSeal(importInput) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header Tabs & Close */}
        <div className="flex items-center justify-between border-b border-line pb-3">
          {subView === "none" ? (
            <div
              className="flex items-center gap-2"
              role="tablist"
              aria-label={t.passport.tabPassport}
            >
              <button
                type="button"
                id="passport-tab"
                role="tab"
                aria-selected={activeTab === "passport"}
                aria-controls="passport-panel"
                onClick={() => setActiveTab("passport")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  activeTab === "passport"
                    ? "bg-accent text-white"
                    : "text-muted hover:text-text"
                }`}
              >
                📜 {t.passport.tabPassport}
              </button>
              <button
                type="button"
                id="stamps-tab"
                role="tab"
                aria-selected={activeTab === "stamps"}
                aria-controls="stamps-panel"
                onClick={() => setActiveTab("stamps")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  activeTab === "stamps" ? "bg-accent text-white" : "text-muted hover:text-text"
                }`}
              >
                💌 {t.passport.tabStamps} ({earnedMilestones.length}/6)
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setSubView(subView === "diff" ? "import" : "none");
                setImportError(null);
              }}
              className="text-xs font-bold text-accent hover:underline flex items-center gap-1"
            >
              ←{" "}
              {subView === "diff"
                ? lang === "ru"
                  ? "Назад к коду"
                  : lang === "de"
                    ? "Zurück zum Code"
                    : "Back to Input"
                : lang === "ru"
                  ? "Назад в Паспорт"
                  : lang === "de"
                    ? "Zurück zum Pass"
                    : "Back to Passport"}
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
                ? "📜 Legacy-сургуч (только паспорт / seed)"
                : lang === "de"
                  ? "📜 Legacy-Wachssiegel (nur Pass / Seed)"
                  : "📜 Legacy Wax Seal (passport / seed only)"}
            </div>

            <div className="flex justify-center">
              <canvas
                ref={canvasRef}
                className="w-64 h-auto rounded-xl border border-line shadow-2xl bg-[#121613]"
                data-testid="legacy-passport-certificate"
              />
            </div>

            {!sealQrResult.ok && (
              <p
                className="rounded-xl border border-amber-500/40 bg-amber-950/20 p-3 text-[11px] text-amber-100"
                role="status"
                data-testid="legacy-passport-qr-fallback"
              >
                {lang === "ru"
                  ? "Этот старый код слишком длинный для надёжного QR. Паспорт не повреждён — нажми «Скопировать код печати»."
                  : lang === "de"
                    ? "Dieser alte Code ist zu lang für einen zuverlässigen QR. Der Pass ist intakt — nutze „Code kopieren“."
                    : "This legacy code is too long for a reliable QR. The passport is intact — use Copy code."}
              </p>
            )}

            <p className="text-[11px] text-muted max-w-xs mx-auto">
              {lang === "ru"
                ? "Legacy: переносит только паспорт и seed, а не полный прогресс. Для полного backup используй кнопку ниже в паспорте."
                : lang === "de"
                  ? "Legacy: überträgt nur Pass und Seed, nicht den vollständigen Fortschritt. Nutze Vollständiges Backup / Import im Pass."
                  : "Legacy: transfers passport and seed only, not full progress. Use Full backup / import in the passport for a complete transfer."}
            </p>

            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                onClick={handleCopySeal}
                className="w-full py-2.5 rounded-xl border border-accent/60 bg-accent/20 hover:bg-accent/30 text-accent text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <span>{copySuccess ? "✓" : "📋"}</span>
                <span>{copySuccess ? t.passport.sealCopied : t.passport.copyCode}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadCertificate}
                className="w-full py-2 rounded-xl border border-line bg-surfaceHi hover:bg-surfaceHi/80 text-text text-xs font-medium transition-all flex items-center justify-center gap-2"
              >
                <span>💾</span>
                <span>{t.passport.downloadPng}</span>
              </button>
            </div>
          </div>
        )}

        {/* SubView: Wax Seal Import */}
        {subView === "import" && (
          <div className="space-y-4 text-left animate-in zoom-in-95 duration-150">
            <div className="text-center">
              <div className="text-xs uppercase tracking-widest font-bold text-muted">
                {lang === "ru"
                  ? "📥 Legacy-импорт сургуча"
                  : lang === "de"
                    ? "📥 Legacy-Wachssiegel importieren"
                    : "📥 Legacy Wax Seal Import"}
              </div>
              <p className="text-[11px] text-muted mt-1">
                {lang === "ru"
                  ? "Legacy: вставь код (FWSEAL1:...), чтобы восстановить только паспорт и seed, не полный прогресс."
                  : lang === "de"
                    ? "Legacy: Siegelcode (FWSEAL1:...) einfügen, um nur Pass und Seed wiederherzustellen, nicht den vollständigen Fortschritt."
                    : "Legacy: paste a wax seal code (FWSEAL1:...) to restore only your passport and seed, not full progress."}
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
                maxLength={4096}
                placeholder="FWSEAL1:..."
                className="w-full rounded-xl border border-line bg-surfaceHi p-2.5 text-xs text-text font-mono focus:border-accent outline-none"
                data-testid="legacy-passport-input"
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
                  <span>
                    {lang === "ru"
                      ? "Формат legacy-паспорта распознан"
                      : lang === "de"
                        ? "Legacy-Passformat erkannt"
                        : "Legacy passport format recognized"}
                  </span>
                </div>
                <div className="text-muted text-[11px]">
                  {lang === "ru"
                    ? "Будут проверены только seed, оформление и известные марки."
                    : lang === "de"
                      ? "Nur Seed, Gestaltung und bekannte Marken werden geprüft."
                      : "Only seed, cosmetics, and known stamps will be reviewed."}
                </div>
              </div>
            )}

            <button
              type="button"
              disabled={!validatedImport?.ok || importSuccess || legacyImportBusy}
              onClick={handleImportSubmit}
              className={`w-full py-2.5 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm ${
                validatedImport?.ok
                  ? "border-accent bg-accent text-white hover:opacity-90 cursor-pointer"
                  : "border-line bg-surfaceHi text-muted opacity-50 cursor-not-allowed"
              }`}
              data-testid="legacy-passport-review"
            >
              <span>{importSuccess ? "✓" : "⚖️"}</span>
              <span>
                {importSuccess
                  ? lang === "ru"
                    ? "Детали паспорта сохранены"
                    : lang === "de"
                      ? "Passdetails gespeichert"
                      : "Passport details saved"
                  : legacyImportBusy
                    ? lang === "ru"
                      ? "Проверка хранилища…"
                      : lang === "de"
                        ? "Speicher wird geprüft…"
                        : "Checking storage…"
                    : lang === "ru"
                      ? "Проверить детали паспорта"
                      : lang === "de"
                        ? "Passdetails prüfen"
                        : "Review passport details"}
              </span>
            </button>
          </div>
        )}

        {/* SubView: Diff Preview */}
        {subView === "diff" && pendingImport?.profile && (
          <div
            className="space-y-4 text-left animate-in zoom-in-95 duration-150"
            data-testid="passport-diff-preview"
          >
            <div className="text-center">
              <div className="text-xs uppercase tracking-widest font-bold text-amber-400">
                ⚖️{" "}
                {lang === "ru"
                  ? "Детали legacy-паспорта"
                  : lang === "de"
                    ? "Legacy-Passdetails"
                    : "Legacy passport details"}
              </div>
              <p className="text-[11px] text-muted mt-1">
                {lang === "ru"
                  ? "XP, уровень, Ink/Wax, статистика и награды останутся на этом устройстве без изменений."
                  : lang === "de"
                    ? "XP, Level, Ink/Wax, Statistik und Belohnungen bleiben auf diesem Gerät unverändert."
                    : "XP, level, Ink/Wax, stats, and rewards stay unchanged on this device."}
              </p>
            </div>

            <div className="rounded-xl border border-line bg-surfaceHi/50 p-3 text-xs space-y-2">
              <div className="flex justify-between gap-3">
                <span className="text-muted">
                  {lang === "ru" ? "Титул" : lang === "de" ? "Titel" : "Title"}
                </span>
                <span className="text-right font-bold text-text">
                  {getTitleLabel(pendingImport.profile.titleId)}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted">{t.passport.waxSealLabel}</span>
                <span className="text-right font-bold text-text">
                  {getSealLabel(pendingImport.profile.sealId)}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted">{t.passport.scribeNibLabel}</span>
                <span className="text-right font-bold text-text">
                  {getNibLabel(pendingImport.profile.nibId)}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted">
                  {lang === "ru"
                    ? "Известные марки"
                    : lang === "de"
                      ? "Bekannte Marken"
                      : "Known stamps"}
                </span>
                <span className="text-right font-bold text-text">
                  {pendingImport.profile.collectedStampIds.length}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted">Seed</span>
                <span className="max-w-[12rem] truncate text-right font-mono text-[10px] text-text">
                  {pendingImport.playerSeed ??
                    (lang === "ru"
                      ? "не указан"
                      : lang === "de"
                        ? "nicht enthalten"
                        : "not included")}
                </span>
              </div>
            </div>

            {importError && (
              <div className="rounded-lg border border-red-500/50 bg-red-950/40 p-2 text-xs text-red-300">
                ⚠️ {importError}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setSubView("import")}
                className="flex-1 py-2.5 rounded-xl border border-line bg-surface hover:bg-surfaceHi text-muted hover:text-text text-xs font-bold transition-all"
              >
                {lang === "ru" ? "Отмена" : lang === "de" ? "Abbrechen" : "Cancel"}
              </button>

              <button
                type="button"
                onClick={handleConfirmReplace}
                disabled={legacyImportBusy}
                className="flex-1 py-2.5 rounded-xl border border-accent bg-accent hover:opacity-90 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md"
                data-testid="legacy-passport-apply"
              >
                {legacyImportBusy
                  ? lang === "ru"
                    ? "Сохранение…"
                    : lang === "de"
                      ? "Speichern…"
                      : "Saving…"
                  : lang === "ru"
                    ? "Применить детали"
                    : lang === "de"
                      ? "Details anwenden"
                      : "Apply details"}
              </button>
            </div>
          </div>
        )}

        {/* Main View: Profile Card Tab */}
        {subView === "none" && activeTab === "passport" && (
          <div
            className="space-y-4"
            id="passport-panel"
            role="tabpanel"
            aria-labelledby="passport-tab"
          >
            <div className="rounded-xl border border-line bg-surfaceHi/50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-wider font-bold text-accent">
                    {getRankTitle()}
                  </div>
                  <div className="text-lg font-extrabold text-text flex items-center gap-1.5 mt-0.5">
                    <span>{rank.icon}</span>
                    <span>Lv. {profile.level}</span>
                    <span className="text-xs font-semibold text-muted">
                      · {getTitleLabel(profile.titleId)}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-text tabular-nums">
                    {profile.xp} XP
                  </div>
                  <div className="text-[10px] text-muted">
                    {t.passport.statLevel} {profile.level}
                  </div>
                </div>
              </div>

              {/* XP Progress Bar */}
              <div className="space-y-1">
                <div className="h-2 w-full rounded-full bg-surface border border-line overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-accent to-accent/70 transition-all duration-300"
                    style={{ width: `${xpProgress}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-muted">
                  <span>{profile.xp - curLevelXp} XP</span>
                  <span>
                    {nextLevelXp - curLevelXp} XP to Lv. {profile.level + 1}
                  </span>
                </div>
              </div>

              {/* Resource Ledger */}
              <div className="grid grid-cols-4 gap-2 pt-2 text-center border-t border-line">
                <div className="p-1.5 rounded-lg bg-surface/80 border border-line">
                  <div className="text-xs font-bold text-blue-400">💧 {profile.ink}</div>
                  <div className="text-[9px] text-muted uppercase font-semibold">
                    {t.passport.statInk}
                  </div>
                </div>
                <div className="p-1.5 rounded-lg bg-surface/80 border border-line">
                  <div className="text-xs font-bold text-amber-400">🕯️ {profile.wax}</div>
                  <div className="text-[9px] text-muted uppercase font-semibold">
                    {t.passport.statWax}
                  </div>
                </div>
                <div className="p-1.5 rounded-lg bg-surface/80 border border-line">
                  <div className="text-xs font-bold text-yellow-300">👑 {profile.prestige}</div>
                  <div className="text-[9px] text-muted uppercase font-semibold">Prestige</div>
                </div>
                <div className="p-1.5 rounded-lg bg-surface/80 border border-line">
                  <div className="text-xs font-bold text-red-400">
                    ⚔️ {profile.contractsWon}
                  </div>
                  <div className="text-[9px] text-muted uppercase font-semibold">
                    {lang === "ru" ? "Контракты" : lang === "de" ? "Verträge" : "Trials"}
                  </div>
                </div>
              </div>
            </div>

            {/* Customization: Title, Seal, Nib */}
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-1">
                  {t.passport.officialTitle}
                </label>
                <select
                  value={profile.titleId}
                  onChange={(e) => handleUpdateField("titleId", e.target.value)}
                  className="w-full rounded-lg border border-line bg-surfaceHi p-2 text-xs text-text font-medium"
                >
                  {TITLES.map((tit) => (
                    <option key={tit.id} value={tit.id}>
                      {getTitleLabel(tit.id)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="passport-seal-select"
                    className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-1"
                  >
                    {t.passport.waxSealLabel}
                  </label>
                  <select
                    id="passport-seal-select"
                    value={profile.sealId}
                    onChange={(e) => handleUpdateField("sealId", e.target.value)}
                    className="w-full rounded-lg border border-line bg-surfaceHi p-2 text-xs text-text font-medium"
                  >
                    {SEALS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.icon} {getSealLabel(s.id)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-1">
                    {t.passport.scribeNibLabel}
                  </label>
                  <select
                    value={profile.nibId}
                    onChange={(e) => handleUpdateField("nibId", e.target.value)}
                    className="w-full rounded-lg border border-line bg-surfaceHi p-2 text-xs text-text font-medium"
                  >
                    {NIBS.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.icon} {getNibLabel(n.id)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setProfileTransferOpen(true);
                feedback("select");
              }}
              className="w-full rounded-xl border border-accent bg-accent px-3 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition-all hover:opacity-90"
              data-testid="open-profile-transfer"
            >
              {lang === "ru"
                ? "Полный backup / import"
                : lang === "de"
                  ? "Vollständiges Backup / Import"
                  : "Full backup / import"}
            </button>
            <p className="-mt-2 text-center text-[10px] text-muted">
              {lang === "ru"
                ? "Прогресс, решения, daily и коллекция"
                : lang === "de"
                  ? "Fortschritt, Lösungen, Daily-Verlauf und Sammlung"
                  : "Progress, solves, daily history, and collection"}
            </p>

            {/* Legacy passport / seed transfer. This is intentionally not a full backup. */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setSubView("export");
                  feedback("select");
                }}
                className="py-2.5 px-3 rounded-xl border border-amber-500/40 bg-amber-950/20 hover:bg-amber-950/40 text-amber-200 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-sm"
                data-testid="legacy-passport-open-export"
              >
                <span>📜</span>
                <span>
                  {lang === "ru"
                    ? "Legacy: паспорт / seed"
                    : lang === "de"
                      ? "Legacy: Pass / Seed"
                      : "Legacy: passport / seed"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSubView("import");
                  feedback("select");
                }}
                className="py-2.5 px-3 rounded-xl border border-line bg-surfaceHi hover:bg-surfaceHi/80 text-muted hover:text-text text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-sm"
                data-testid="legacy-passport-open-import"
              >
                <span>📥</span>
                <span>
                  {lang === "ru"
                    ? "Legacy: импорт"
                    : lang === "de"
                      ? "Legacy: Import"
                      : "Legacy: import"}
                </span>
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
                <span>{t.passport.ironContractCta}</span>
              </button>
            )}
          </div>
        )}

        {/* Main View: Stamp Album Tab */}
        {subView === "none" && activeTab === "stamps" && (
          <div
            className="space-y-3"
            id="stamps-panel"
            role="tabpanel"
            aria-labelledby="stamps-tab"
          >
            <section aria-labelledby="passport-pages-title">
              <div className="mb-2 flex items-end justify-between gap-3 text-left">
                <div>
                  <h3
                    id="passport-pages-title"
                    className="text-[11px] font-bold uppercase tracking-[0.12em] text-accent"
                  >
                    {lang === "ru"
                      ? "Страницы архива"
                      : lang === "de"
                        ? "Archivseiten"
                        : "Archive pages"}
                  </h3>
                  <p className="text-[10px] text-muted">
                    {lang === "ru"
                      ? "Выдаются за уникальные официальные решения"
                      : lang === "de"
                        ? "Für einzigartige offizielle Lösungen"
                        : "Earned from unique official solutions"}
                  </p>
                </div>
                <span className="text-xs font-bold tabular-nums text-text">{solvedCount}</span>
              </div>
              <div className="grid grid-cols-3 gap-2" data-testid="passport-milestone-pages">
                {COLLECTION_MILESTONES.map((milestone) => {
                  const earned = solvedCount >= milestone.threshold;
                  return (
                    <div
                      key={milestone.id}
                      className={`rounded-lg border p-2 text-center ${
                        earned
                          ? "border-accent/55 bg-surfaceHi"
                          : "border-line/50 bg-surface/40"
                      }`}
                    >
                      <StampArtwork
                        stampId={milestone.id}
                        color={earned ? milestone.color : "currentColor"}
                        locked={!earned}
                        size={32}
                      />
                      <div
                        className={`mt-1 text-[9px] font-bold ${earned ? "text-text" : "text-muted"}`}
                      >
                        {milestone.label[lang]}
                      </div>
                      <div className="mt-0.5 text-[9px] tabular-nums text-muted">
                        {Math.min(solvedCount, milestone.threshold)}/{milestone.threshold}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <div className="border-t border-line pt-3 text-left">
              <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
                {lang === "ru"
                  ? "Ранняя коллекция"
                  : lang === "de"
                    ? "Frühe Sammlung"
                    : "Early collection"}
              </h3>
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
                      <StampArtwork
                        stampId={stamp.id}
                        color={isCollected ? stamp.color : "currentColor"}
                        locked={!isCollected}
                        size={34}
                      />
                      <span className="text-[9px] text-muted font-bold truncate max-w-full mt-1">
                        {isCollected ? stamp.theme : "???"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedStamp && (
              <div className="p-3 rounded-xl border border-line bg-surfaceHi text-left space-y-1 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-xs text-text flex items-center gap-1.5">
                    <StampArtwork
                      stampId={selectedStamp.id}
                      color={selectedStamp.color}
                      size={24}
                    />
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
                  "
                  {lang === "ru"
                    ? selectedStamp.provenanceRu
                    : lang === "de"
                      ? selectedStamp.provenanceDe
                      : selectedStamp.provenanceEn}
                  "
                </p>
              </div>
            )}
          </div>
        )}
      </div>
      {profileTransferOpen && (
        <ProfileTransferDialog language={lang} onClose={() => setProfileTransferOpen(false)} />
      )}
    </div>
  );
}
