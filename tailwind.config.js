/**
 * Theme colours are CSS variables so the desk themes can swap them at
 * runtime. Tailwind cannot apply an opacity modifier (`bg-accent/40`) to a
 * plain `var(...)` colour and silently emits no CSS for it, so every such
 * class fell back to the default border/ring colour. A function colour lets
 * the modifier compile to `color-mix()` while plain classes stay a plain var.
 */
function themeColor(variable, fallback) {
  const base = `var(${variable}, ${fallback})`;
  return ({ opacityValue } = {}) => {
    if (opacityValue === undefined || String(opacityValue).startsWith("var(")) return base;
    const pct = Math.round(Number(opacityValue) * 1000) / 10;
    if (!Number.isFinite(pct)) return base;
    return `color-mix(in srgb, ${base} ${pct}%, transparent)`;
  };
}

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: themeColor("--theme-bg", "#1a1614"),
        surface: themeColor("--theme-surface", "#251e19"),
        surfaceHi: themeColor("--theme-surface-hi", "#322720"),
        surfaceHover: themeColor("--theme-surface-hover", "#3f3229"),
        text: themeColor("--theme-text", "#f7efe1"),
        muted: themeColor("--theme-muted", "#aa9987"),
        accent: themeColor("--theme-accent", "#e27a5b"),
        accentHi: themeColor("--theme-accent-hi", "#ef8d6f"),
        accentBorder: themeColor("--theme-accent-border", "#b8573b"),
        paper: "#fffdf7",
        paperHi: "#ffffff",
        paperBorder: "#d9cca8",
        paperEdge: "#b5a47e",
        ink: "#2b1d15",
        line: themeColor("--theme-line", "#48392f"),
        solved1: "#f3cb65",
        solved1Border: "#c89f38",
        solved2: "#7bc88f",
        solved2Border: "#50a266",
        solved3: "#ea8878",
        solved3Border: "#be5e4e",
        solved4: "#bfa7f2",
        solved4Border: "#8f74cf",
        danger: "#c84635",
        dangerHi: "#dc5846",
        dangerBorder: "#942e20",
        warning: "#df9f43",
      },
      fontFamily: {
        sans: [
          "Manrope Variable",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
      boxShadow: {
        paperRest:
          "0 4px 0 #b5a47e, 0 10px 18px -4px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.95)",
        paperHover:
          "0 6px 0 #9e8d67, 0 14px 24px -4px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,1)",
        paperPressed:
          "0 1px 0 #b5a47e, 0 3px 6px -2px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.4)",
        paperSelected:
          "0 5px 0 #b8573b, 0 14px 24px -4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.95), 0 0 0 2px rgba(226,122,91,0.6)",
        paperSelectedPressed:
          "0 2px 0 #b8573b, 0 6px 10px -4px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.5)",
        solvedDepth1:
          "0 4px 0 #b88f2e, 0 10px 18px -4px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.6)",
        solvedDepth2:
          "0 4px 0 #46965c, 0 10px 18px -4px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.6)",
        solvedDepth3:
          "0 4px 0 #b25445, 0 10px 18px -4px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.6)",
        solvedDepth4:
          "0 4px 0 #7e69be, 0 10px 18px -4px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.6)",
        control: "0 3px 0 #18120e",
        controlPressed: "0 1px 0 #18120e",
        accentControl: "0 3px 0 #8e382c",
        accentControlPressed: "0 1px 0 #8e382c",
        dangerControl: "0 3px 0 #701d14",
        dangerControlPressed: "0 1px 0 #701d14",
        tab: "0 2px 0 #18120e",
        tab3D: "0 3px 0 #18120e, 0 6px 12px -4px rgba(0,0,0,0.4)",
        ready: "0 0 0 4px rgba(226, 122, 91, 0.2)",
        mat: "0 24px 60px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.06), 0 0 0 1px rgba(72,57,47,0.8)",
      },
    },
  },
  plugins: [],
};
