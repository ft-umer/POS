import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {

      extend: {
        colors: {
          primary: "#FF7A00", // orange – accent
          background: "#FFFFFF", // white – base
          text: "#000000", // black – main text
          muted: "#4D4D4D", // for subtle text
          border: "#E5E5E5",
          hover: "#FF9B33", // slightly brighter orange
        },
        fontFamily: {
          sans: ["Inter", "sans-serif"],
        },
      },

      colors: {
        /* 🎨 Core Brand Palette (60–30–10 Rule) */
        primary: {
          DEFAULT: "#FF7A00", // 10% accent (orange)
          hover: "#FF9B33",   // hover variation
        },
        background: "#FFFFFF", // 60% main background (white)
        text: "#000000",       // 30% main text (black)
        muted: "#4D4D4D",      // secondary text
        border: "#E5E5E5",     // subtle dividers

        /* 🔘 UI Semantic Tokens */
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        foreground: "hsl(var(--foreground))",

        /* 🎴 UI Elements */
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#000000",
        },
        popover: {
          DEFAULT: "#FFFFFF",
          foreground: "#000000",
        },
        accent: {
          DEFAULT: "#FF7A00",
          foreground: "#FFFFFF",
        },

        /* 🧭 Sidebar Theming */
        sidebar: {
          DEFAULT: "#000000",          // black background for sidebar
          foreground: "#FFFFFF",       // white text
          primary: "#FF7A00",          // orange highlights for active items
          "primary-foreground": "#FFFFFF",
          accent: "#FF9B33",           // hover accent
          "accent-foreground": "#FFFFFF",
          border: "#1F1F1F",           // subtle border for sidebar
          ring: "#FF7A00",
        },
      },

      /* 🪶 Rounded Corners */
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },

      /* ✨ Animations */
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
