import js from "@eslint/js";
import ts from "typescript-eslint";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";

export default [
  {
    // `tiktok/video_automation/**` are one-off TikTok capture harnesses
    // that reference browser globals inside Playwright callbacks and are
    // not part of the app build path. They ship as artefacts next to the
    // report, not as production tooling, so lint does not apply.
    ignores: [
      "dist",
      "node_modules",
      "coverage",
      ".vite",
      "assets/**",
      "ios/**",
      "itch.io/**",
      "tiktok/**",
      "docs/reports/**",
      "reports/**",
    ],
  },
  js.configs.recommended,
  ...ts.configs.recommended,
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: {
      react,
      "react-hooks": reactHooks,
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        localStorage: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        console: "readonly",
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    settings: {
      react: { version: "detect" },
    },
    rules: {
      "react/jsx-uses-react": "off",
      "react/react-in-jsx-scope": "off",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "no-console": ["warn", { allow: ["warn", "error"] }],
      // Empty catches inside localStorage / navigator probes are
      // intentional — we fall back to defaults if the read fails.
      "no-empty": ["error", { allowEmptyCatch: true }],
    },
  },
  {
    // Scripts and e2e test harnesses run in Node but drive a Playwright
    // browser via page.evaluate(() => ...). The callback source lives in
    // this file and references browser globals (window, document,
    // getComputedStyle) that only exist at browser-evaluation time. ESLint
    // lints the callback as source code, so we declare them here.
    files: ["scripts/**/*.{ts,mjs,js,cjs}", "tests/**/*.{ts,mjs,js}"],
    languageOptions: {
      globals: {
        // Node.js runtime globals (scripts/*.mjs run on node)
        process: "readonly",
        console: "readonly",
        require: "readonly",
        module: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        Buffer: "readonly",
        // Browser globals reachable via Playwright page.evaluate callbacks
        window: "readonly",
        document: "readonly",
        localStorage: "readonly",
        navigator: "readonly",
        getComputedStyle: "readonly",
        fetch: "readonly",
      },
    },
    rules: {
      "no-console": "off",
      "@typescript-eslint/no-require-imports": "off",
      // Script-local heuristic: empty catch around filesystem / JSON
      // probing is deliberate (try the file, move on). Don't flag it.
      "no-empty": ["error", { allowEmptyCatch: true }],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  {
    files: ["sw.js", "public/sw.js"],
    languageOptions: {
      globals: {
        console: "readonly",
      },
    },
    rules: {
      "no-console": "off",
    },
  },
];
