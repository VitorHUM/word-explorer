import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "color-primary": "#6200F2",
        "color-secondary": "#6BFF69",
        "color-text": "#000000",
        "color-accent": "#8940F4",
        "color-accent-light": "#B080F8",
        "color-surface": "#D8C0FB",
        "color-border": "#E3E3E3",
        "color-muted": "#BEBEBE",
        "color-white": "#FFFFFF",
        background: "var(--bg)",
        surface: "var(--surface)",
        "surface-soft": "var(--surface-soft)",
        text: "var(--text)",
        muted: "var(--muted)",
        border: "var(--border)",
        primary: "var(--primary)",
        "primary-strong": "var(--primary-strong)",
        accent: "var(--accent)",
        "accent-soft": "var(--accent-soft)",
        secondary: "var(--secondary)",
      },
      fontFamily: {
        primary: ["var(--font-raleway)", "sans-serif"],
        secondary: ["var(--font-raleway)", "sans-serif"],
        text: ["var(--font-raleway)", "sans-serif"],
        accent: ["var(--font-raleway)", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
