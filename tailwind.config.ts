import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        base: {
          950: "#14100C",
          900: "#1B1611",
          800: "#241D16",
          700: "#332A1F",
        },
        accent: {
          DEFAULT: "#C97C3D",
          soft: "#E3A868",
          dim: "#8A5A30",
        },
        sage: {
          DEFAULT: "#7A9186",
          soft: "#A8BDB2",
          dim: "#4E5E56",
        },
        paper: {
          DEFAULT: "#EDE3D3",
          muted: "#9C8F7E",
          faint: "#5C5347",
        },
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        mono: ["var(--font-plex-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        glass: "0 8px 32px rgba(0, 0, 0, 0.35)",
        glow: "0 0 24px rgba(201, 124, 61, 0.35)",
      },
      transitionTimingFunction: {
        deck: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      keyframes: {
        flicker: {
          "0%, 100%": { opacity: "1" },
          "92%": { opacity: "1" },
          "93%": { opacity: "0.85" },
          "94%": { opacity: "1" },
        },
      },
      animation: {
        flicker: "flicker 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
