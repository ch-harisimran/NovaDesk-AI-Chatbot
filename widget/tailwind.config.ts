import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Geist", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        brandFrom: "#6366F1",
        brandTo: "#8B5CF6",
        surface: "#0A0A0F",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(139,92,246,0.15), 0 8px 32px -4px rgba(99,102,241,0.45)",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
    },
  },
  plugins: [],
} satisfies Config;
