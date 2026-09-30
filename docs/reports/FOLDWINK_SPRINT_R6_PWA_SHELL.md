
# Foldwink Sprint R6 - PWA Shell

## Sprint Summary

This increment converts Foldwink from a manifest-only install candidate into a
real warm-cache PWA shell.

Implemented:

- same-origin service worker for the standalone direct web app
- network-then-cache navigation and cache-then-network static assets
- first-install app shell caching for the game, privacy page, manifest, and icons
- iframe guard so itch embeds do not register their own service worker
- raster install icons generated from the existing Foldwink mark
- Apple touch icon plus 192 and 512 pixel Android/PWA icons
- browser E2E proof that a warmed standalone app reopens offline
- player-initiated install action only when the browser exposes a real install prompt
- one coarse accepted/dismissed install outcome in the existing privacy-aware event log

No Capacitor wrapper, native billing flow, backend, account, or new gameplay
mechanic was added.

## Changed Files

- public/sw.js
- public/manifest.webmanifest
- public/apple-touch-icon.png
- public/icons/icon-192.png
- public/icons/icon-512.png
- src/pwa/registerServiceWorker.ts
- src/pwa/installPrompt.ts
- src/pwa/installPrompt.test.ts
- src/components/InstallFoldwink.tsx
- src/main.tsx
- src/screens/MenuScreen.tsx
- src/i18n/strings.ts
- src/analytics/eventLog.ts
- index.html
- scripts/build-pwa-icons.mjs
- package.json
- tests/e2e/pwa-offline-qa.mjs
- tests/e2e/run-all.mjs

## Tests Run

- npm run pwa:icons - PASS
- npm run typecheck - PASS
- npm run lint - PASS
- npm test - PASS, 23 files / 174 tests
- npm run build - PASS
- npm run test:e2e - PASS, 44 browser scenarios
- offline PWA E2E - PASS after service worker warm cache
- browser install-prompt E2E - PASS; CTA appears only after a valid beforeinstallprompt event

## Manual QA Notes

- The direct top-level app registers a service worker. An itch iframe does not.
- The first visit still needs a network connection. The following warm-cache
  reload was verified offline at a 390 by 844 mobile viewport.
- Android and Chromium-style browsers show an in-app install action only after the browser has determined the app is installable; no misleading control appears on unsupported browsers.
- The install icon set is derived from the existing brand mark, so app-store
  and homescreen visuals remain coherent with the game.
- Existing browser automation cannot prove iOS homescreen install, browser
  chrome behavior, or Android launcher treatment.

## Open Risks

- Cached assets update after the usual service-worker lifecycle; there is no
  in-app update banner yet.
- Language chunks are cached when visited. A language never opened before an
  offline session may still need the network once.
- Real iPhone and Android install, safe-area, homescreen icon, and share-sheet
  passes remain human-device QA.
- Capacitor Android/iOS shells, native share, native haptics, and store billing
  remain the next stage, not part of this web PWA increment.

## Go / No-Go

**GO** for a direct web/PWA closed test: installability assets and offline
warm-cache shell are real and browser-tested.

**NO-GO** for store submission until physical device QA, native-shell behavior,
and channel-compliant store billing are completed.
