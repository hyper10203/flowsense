/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#0a0a0f",
          surface: "#111118",
          elevated: "#16161f",
          subtle: "#1c1c27",
          hover: "#23232f",
        },
        border: {
          DEFAULT: "#23232f",
          subtle: "#1a1a24",
          strong: "#2e2e3c",
        },
        fg: {
          DEFAULT: "#e8e8f0",
          muted: "#9a9ab0",
          subtle: "#6a6a80",
        },
        accent: {
          DEFAULT: "#7c5cff",
          hover: "#9279ff",
          muted: "#5a3fef",
          subtle: "rgba(124, 92, 255, 0.12)",
        },
        success: "#3dd980",
        warning: "#f5b731",
        danger: "#ff5c7a",
      },
      borderRadius: {
        sm: "6px",
        md: "8px",
        lg: "12px",
        xl: "16px",
      },
      boxShadow: {
        sm: "0 1px 2px rgba(0,0,0,0.3)",
        md: "0 4px 12px rgba(0,0,0,0.4)",
        lg: "0 8px 24px rgba(0,0,0,0.5)",
        glow: "0 0 24px rgba(124, 92, 255, 0.25)",
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-dot": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
      },
      animation: {
        "fade-in": "fade-in 200ms ease-out",
        "slide-up": "slide-up 220ms ease-out",
        "pulse-dot": "pulse-dot 1.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
