#!/usr/bin/env node
/**
 * Foldwink release preflight.
 *
 * This script never contacts a payment provider and never reads secrets.
 * It only checks the public values required to activate the optional
 * tip/supporter surfaces in a production build.
 *
 * Usage:
 *   npm run release:preflight
 *   npm run release:preflight:paid
 */
import { existsSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { URL } from "node:url";
import { checkDailyHorizon, formatHorizon } from "./check-daily-horizon.mjs";

const paid = process.argv.includes("--paid");
const root = resolve(".");
const distDir = join(root, "dist");
const koFiHandle = (process.env.VITE_KOFI_HANDLE ?? "").trim();
const checkoutUrl = (process.env.VITE_SUPPORTER_CHECKOUT_URL ?? "").trim();
const canonicalUrl = (process.env.FOLDWINK_CANONICAL_URL ?? "").trim();
const KO_FI_HANDLE_RE = /^[a-z0-9](?:[a-z0-9-_]{0,62}[a-z0-9])?$/i;

function httpsUrl(value) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function withSuccessQuery(value) {
  const url = new URL(value);
  url.searchParams.set("supporter", "success");
  return url.toString();
}

const errors = [];
const warnings = [];

if (!existsSync(distDir)) {
  errors.push("dist/ is missing. Run npm run build first.");
} else if (!statSync(distDir).isDirectory() || !existsSync(join(distDir, "index.html"))) {
  errors.push("dist/ does not contain index.html. Run npm run build again.");
}

const koFiState = !koFiHandle
  ? "not configured (tip CTA stays hidden)"
  : KO_FI_HANDLE_RE.test(koFiHandle)
    ? "configured"
    : "invalid (tip CTA stays hidden)";
const checkoutState = !checkoutUrl
  ? "not configured (supporter CTA stays hidden)"
  : httpsUrl(checkoutUrl)
    ? "configured"
    : "invalid (supporter CTA stays hidden)";

if (koFiHandle && !KO_FI_HANDLE_RE.test(koFiHandle)) {
  errors.push("VITE_KOFI_HANDLE is malformed.");
}
if (checkoutUrl && !httpsUrl(checkoutUrl)) {
  errors.push("VITE_SUPPORTER_CHECKOUT_URL must be an HTTPS URL.");
}

if (paid) {
  if (!koFiHandle) errors.push("VITE_KOFI_HANDLE is required for a paid launch.");
  if (!checkoutUrl) errors.push("VITE_SUPPORTER_CHECKOUT_URL is required for a paid launch.");
  if (!httpsUrl(canonicalUrl)) {
    errors.push("FOLDWINK_CANONICAL_URL must be the HTTPS direct web/PWA URL.");
  }
} else if (!canonicalUrl) {
  warnings.push(
    "FOLDWINK_CANONICAL_URL is not set, so checkout success URL cannot be printed.",
  );
} else if (!httpsUrl(canonicalUrl)) {
  errors.push("FOLDWINK_CANONICAL_URL must be an HTTPS URL when set.");
}

const horizon = await checkDailyHorizon({ root });
if (!horizon.ok) {
  errors.push(`Daily horizon is too short: ${horizon.failures.join("; ")}`);
}

console.log("Foldwink release preflight");
console.log(
  "- dist: " + (errors.some((error) => error.startsWith("dist/")) ? "FAIL" : "ready"),
);
console.log("- daily horizon: " + (horizon.ok ? "ready" : "FAIL"));
console.log("  " + formatHorizon(horizon));
console.log("- tip jar: " + koFiState);
console.log("- supporter checkout: " + checkoutState);
console.log("- paid activation: " + (paid ? "requested" : "not requested"));

if (httpsUrl(canonicalUrl)) {
  console.log("- checkout success URL: " + withSuccessQuery(canonicalUrl));
}

for (const warning of warnings) console.warn("WARN: " + warning);
for (const error of errors) console.error("ERROR: " + error);

if (errors.length > 0) {
  console.error("\nNO-GO: fix the listed items before activating paid CTAs.");
  process.exit(1);
}

if (paid) {
  console.log(
    "\nCONFIG GO: complete the documented real-device and provider-return checks before public paid activation.",
  );
} else {
  console.log(
    "\nBuild GO: optional public monetization surfaces remain hidden until valid config is supplied.",
  );
}
