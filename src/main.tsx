import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./app/App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { setupAutoFullscreen } from "./utils/iframeFullscreen";
import { consumeSupporterReturnUrl } from "./monetization/supporter";
import { captureUtm } from "./monetization/attribution";
import { bootstrapAnalytics, trackEvent } from "./analytics/eventLog";
import { getLangSync } from "./i18n/useLanguage";
import { registerServiceWorker } from "./pwa/registerServiceWorker";
import { applyInitialTheme } from "./styles/themes";
import "@fontsource-variable/manrope/wght.css";
import "./styles/index.css";

applyInitialTheme();
setupAutoFullscreen();
registerServiceWorker();
captureUtm();
void bootstrapAnalytics();
if (consumeSupporterReturnUrl()) {
  trackEvent({
    name: "supporter_return_success",
    props: {
      surface: "app",
      channel: "supporter",
      has_support_flag: "yes",
      lang: getLangSync(),
    },
  });
}

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Root element #root not found");

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
