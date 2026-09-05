import type { Lang } from "./strings";

export interface PrivacyStrings {
  control: string;
  title: string;
  intro: string;
  localOnlyTitle: string;
  localOnlyBody: string;
  analyticsTitle: string;
  analyticsBody: string;
  providerLabel: (provider: string) => string;
  providerName: string;
  noProvider: string;
  policyLink: string;
  grant: string;
  deny: string;
  close: string;
  menuPrompt: string;
  menuPromptAction: string;
  choiceSavedGranted: string;
  choiceSavedDenied: string;
  thankYou: string;
}

export const privacyStrings: Record<Lang, PrivacyStrings> = {
  en: {
    control: "Privacy",
    title: "Privacy choices",
    intro:
      "Foldwink keeps game progress on this device only. Optional anonymous measurement can help count broad product flows.",
    localOnlyTitle: "Local-only game data",
    localOnlyBody:
      "Stats, streaks, tutorial state, and supporter cosmetics stay in your browser storage on this device. No accounts. No cloud sync.",
    analyticsTitle: "Optional anonymous measurement",
    analyticsBody:
      "If you allow it, Foldwink sends only coarse event counts such as menu views, mode starts, wins/losses, share clicks, and support-link opens. No identifiers, no puzzle content, no card text, no raw URLs, and no free text.",
    providerLabel: (provider) => `Provider: ${provider}`,
    providerName: "Umami",
    noProvider: "No measurement provider is configured in this build.",
    policyLink: "Open privacy page",
    grant: "Allow anonymous measurement",
    deny: "Keep it local only",
    close: "Close",
    menuPrompt: "Anonymous measurement is available but off until you choose.",
    menuPromptAction: "Review privacy",
    choiceSavedGranted: "Anonymous measurement enabled.",
    choiceSavedDenied: "Anonymous measurement stays off.",
    thankYou:
      "Thanks for supporting Foldwink. Your Supporter badge is now active on this device.",
  },
  de: {
    control: "Datenschutz",
    title: "Datenschutzwahl",
    intro:
      "Foldwink speichert deinen Spielfortschritt nur auf diesem Gerät. Optionale anonyme Messung hilft nur bei groben Produktwegen.",
    localOnlyTitle: "Nur lokale Spieldaten",
    localOnlyBody:
      "Statistik, Streaks, Tutorial-Stand und Supporter-Kosmetik bleiben im Browser-Speicher dieses Geräts. Keine Konten. Kein Cloud-Sync.",
    analyticsTitle: "Optionale anonyme Messung",
    analyticsBody:
      "Wenn du zustimmst, sendet Foldwink nur grobe Ereignisse wie Menüaufrufe, Modusstarts, Siege/Niederlagen, Share-Klicks und Support-Links. Keine Kennungen, keine Rätselinhalte, keine Kartentexte, keine rohen URLs und kein Freitext.",
    providerLabel: (provider) => `Anbieter: ${provider}`,
    providerName: "Umami",
    noProvider: "In diesem Build ist kein Messanbieter konfiguriert.",
    policyLink: "Datenschutzseite öffnen",
    grant: "Anonyme Messung erlauben",
    deny: "Nur lokal bleiben",
    close: "Schließen",
    menuPrompt: "Anonyme Messung ist verfügbar, aber bis zu deiner Wahl deaktiviert.",
    menuPromptAction: "Datenschutz prüfen",
    choiceSavedGranted: "Anonyme Messung aktiviert.",
    choiceSavedDenied: "Anonyme Messung bleibt aus.",
    thankYou:
      "Danke für deine Unterstützung von Foldwink. Dein Supporter-Badge ist jetzt auf diesem Gerät aktiv.",
  },
  ru: {
    control: "Приватность",
    title: "Настройки приватности",
    intro:
      "Foldwink хранит игровой прогресс только на этом устройстве. Необязательное анонимное измерение помогает считать лишь крупные продуктовые переходы.",
    localOnlyTitle: "Только локальные игровые данные",
    localOnlyBody:
      "Статистика, серии, состояние обучения и косметический статус Supporter остаются в хранилище браузера на этом устройстве. Без аккаунтов. Без облачной синхронизации.",
    analyticsTitle: "Необязательное анонимное измерение",
    analyticsBody:
      "Если разрешить его, Foldwink отправляет только грубые события: просмотры меню, старты режимов, победы/поражения, клики по Share и открытия ссылок поддержки. Никаких идентификаторов, содержимого пазлов, текста карточек, сырых URL и свободного текста.",
    providerLabel: (provider) => `Провайдер: ${provider}`,
    providerName: "Umami",
    noProvider: "В этой сборке не настроен провайдер измерений.",
    policyLink: "Открыть страницу privacy",
    grant: "Разрешить анонимное измерение",
    deny: "Оставить только локально",
    close: "Закрыть",
    menuPrompt: "Анонимное измерение доступно, но выключено, пока ты не выберешь вариант.",
    menuPromptAction: "Проверить privacy",
    choiceSavedGranted: "Анонимное измерение включено.",
    choiceSavedDenied: "Анонимное измерение остаётся выключенным.",
    thankYou:
      "Спасибо за поддержку Foldwink. Значок Supporter теперь активен на этом устройстве.",
  },
};
