import { useEffect, useState } from "react";
import { trackEvent } from "../analytics/eventLog";
import {
  isBeforeInstallPromptEvent,
  isStandalonePwa,
  type BeforeInstallPromptEvent,
} from "../pwa/installPrompt";
import { useLang, useT } from "../i18n/useLanguage";

/**
 * The browser only exposes this prompt when the page meets its own install
 * criteria. Keeping the CTA absent otherwise avoids a dead control on iOS,
 * embeds, and already-installed apps.
 */
export function InstallFoldwink() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const t = useT();
  const lang = useLang();

  useEffect(() => {
    if (isStandalonePwa()) return;

    const onBeforeInstallPrompt = (event: Event): void => {
      if (!isBeforeInstallPromptEvent(event)) return;
      event.preventDefault();
      setDeferredPrompt(event);
    };
    const onInstalled = (): void => setDeferredPrompt(null);

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = async (): Promise<void> => {
    if (!deferredPrompt) return;
    const prompt = deferredPrompt;
    setDeferredPrompt(null);
    await prompt.prompt();
    const choice = await prompt.userChoice;
    trackEvent({
      name: "pwa_install_choice",
      props: { surface: "menu", outcome: choice.outcome, lang },
    });
  };

  if (!deferredPrompt) return null;

  return (
    <button
      type="button"
      onClick={() => void install()}
      className="inline-flex items-center gap-1.5 text-[11px] text-muted hover:text-accent transition-colors"
    >
      <span aria-hidden="true">+</span>
      <span>{t.menu.installApp}</span>
    </button>
  );
}