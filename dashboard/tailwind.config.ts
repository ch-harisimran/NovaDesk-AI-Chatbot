import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", "var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        surface: {
          DEFAULT: "#0A0A0F",
          light: "#FAFAFA",
          raised: "#111118",
          border: "rgba(255,255,255,0.08)",
        },
        brand: {
          from: "#6366F1",
          to: "#8B5CF6",
          DEFAULT: "#6366F1",
        },
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
        "brand-gradient-soft": "linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.15) 100%)",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(139,92,246,0.15), 0 8px 32px -4px rgba(99,102,241,0.45)",
        "glow-lg": "0 0 0 1px rgba(139,92,246,0.2), 0 20px 60px -8px rgba(99,102,241,0.5)",
        card: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 8px 24px -8px rgba(0,0,0,0.4)",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
        "gradient-x": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        blob: {
          "0%, 100%": { transform: "translate(0px, 0px) scale(1)" },
          "33%": { transform: "translate(30px, -50px) scale(1.1)" },
          "66%": { transform: "translate(-20px, 20px) scale(0.9)" },
        },
      },
      animation: {
        shimmer: "shimmer 2s infinite linear",
        "gradient-x": "gradient-x 8s ease infinite",
        blob: "blob 12s infinite ease-in-out",
      },
      backgroundSize: {
        "shimmer-size": "1000px 100%",
      },
    },
  },
  plugins: [],
} satisfies Config;
