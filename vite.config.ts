import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { generateServiceWorker } from "./scripts/generate-service-worker.ts";

function generatedServiceWorkerPlugin() {
  let options: { outDir: string; base: string } | null = null;
  return {
    name: "foldwink-generated-service-worker",
    apply: "build" as const,
    configResolved(config: { build: { outDir: string }; base: string }) {
      options = { outDir: config.build.outDir, base: config.base };
    },
    async closeBundle() {
      if (!options) throw new Error("Foldwink service worker build options were not resolved");
      await generateServiceWorker(options);
    },
  };
}

export default defineConfig({
  plugins: [react(), generatedServiceWorkerPlugin()],
  base: "./",
  server: {
    host: true,
    allowedHosts: true,
  },
  // Enable top-level await — appStore.ts blocks module evaluation on
  // `ensureLangLoaded(lang)` so session-resume sees a populated non-EN
  // pool. All supported Foldwink targets (Chrome 89+, Safari 15+,
  // Firefox 89+) have native TLA.
  build: {
    target: "es2022",
    rollupOptions: {
      output: {
        // Puzzle JSONs are imported via `import.meta.glob({eager:false})`
        // in loaderDe.ts / loaderRu.ts. Without guidance, Rollup emits
        // a separate chunk per JSON file — 500+ tiny chunks per language,
        // which translates to a flood of HTTP requests on first switch.
        // Collapse each language's pool into a single chunk.
        manualChunks(id) {
          if (id.includes("/puzzles/de/pool/")) return "puzzles-de";
          if (id.includes("/puzzles/ru/pool/")) return "puzzles-ru";
          // EN pool is imported eagerly (loader.ts), but keeping it in its
          // own chunk halves the app chunk and lets puzzle-content updates
          // and code updates cache-invalidate independently.
          if (id.includes("/puzzles/pool/")) return "puzzles-en";
          return undefined;
        },
      },
    },
  },
  test: {
    globals: true,
    environment: "node",
  },
});
