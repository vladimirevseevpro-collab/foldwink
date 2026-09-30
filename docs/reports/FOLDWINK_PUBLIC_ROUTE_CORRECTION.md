# Foldwink Public Route Correction

Date: 2026-07-24
Scope: correct the public route that sent every direct player to itch.io.

## Finding

The public canonical URL https://neural-void.com/foldwink/ returned HTTP 200
but did not serve the game. It was a legacy static landing page whose only
primary CTA linked to https://neural-void.itch.io/foldwink.

That architecture sent mobile traffic into the itch iframe and made local
mobile/PWA fixes invisible at the canonical URL. It also contradicted the
direct-web/PWA product decision.

## Local Source Correction

The Cloudflare Pages source tree at C:/AI/neural-void.com/site was prepared:

- site/foldwink/ root assets were replaced with the verified current Foldwink
  production dist output.
- site/foldwink/overview/ now immediately routes to /foldwink/ and is
  noindex,follow.
- the Foldwink section on the Neural Void home page now uses player-first copy
  and links directly to the game rather than describing a white-label module.
- original site assets were preserved outside the Cloudflare upload tree at
  C:/AI/neural-void.com/_foldwink_site_backups/.

A local static-server Playwright check of the prepared source passed at
390x844: /foldwink/ rendered 16 game cards and 4 Tabs with no horizontal
overflow.

## itch.io Release

The fresh HTML5 package was published to the stable itch channel:

- target: neural-void/foldwink:html
- upload: #17237271
- active build: #1821709
- user version: 0.8.2
- package: itch.io/export/foldwink-itch-upload-v0.8.2-2026-07-24.zip

The upload contains 31 files and was built from the current verified
production output.

## Direct-Web Deployment Blocker

Cloudflare Pages project neural-void-site is known locally, but the configured
Wrangler authentication token is expired. Non-interactive wrangler cannot
deploy until one of these external actions occurs:

1. run wrangler login interactively; or
2. provide a valid CLOUDFLARE_API_TOKEN in the deployment environment.

No claim of a direct-web publication should be made until the Pages deploy
succeeds and the public URL is rechecked.

## Go / No-Go

- itch.io HTML5 channel: GO and updated.
- local Cloudflare Pages source: GO and ready.
- canonical direct web/PWA URL: NO-GO pending Cloudflare re-authentication and
  deploy.
- paid activation: NO-GO pending canonical direct deploy, public payment URLs,
  and real checkout-return verification.
