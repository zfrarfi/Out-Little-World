import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          pink: "var(--color-soft-pink, #F8C8DC)",
          rose: "var(--color-rose, #E8A0BF)",
          roseDark: "var(--color-rose-dark, #C9769A)",
          cream: "var(--color-cream, #FFF8F0)",
          white: "#FFFFFF",
          brown: "var(--color-soft-brown, #8D6E63)",
          dark: "var(--color-dark-text, #39343A)",
        },
      },
      fontFamily: {
        poppins: ["var(--font-poppins)", "sans-serif"],
        nunito: ["var(--font-nunito)", "sans-serif"],
        sans: ["var(--active-font)", "var(--font-poppins)", "sans-serif"],
      },
      boxShadow: {
        romantic: "0 10px 30px -10px rgba(232, 160, 191, 0.35)",
        soft: "0 4px 20px -2px rgba(57, 52, 58, 0.06)",
        glass: "0 8px 32px 0 rgba(232, 160, 191, 0.18)",
      },
      borderRadius: {
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
      keyframes: {
        floatSlow: {
          "0%, 100%": { transform: "translateY(0px) rotate(0deg)" },
          "50%": { transform: "translateY(-10px) rotate(4deg)" },
        },
        heartbeat: {
          "0%, 100%": { transform: "scale(1)" },
          "25%": { transform: "scale(1.12)" },
          "50%": { transform: "scale(1)" },
          "75%": { transform: "scale(1.08)" },
        },
      },
      animation: {
        "float-slow": "floatSlow 5s ease-in-out infinite",
        heartbeat: "heartbeat 1.8s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
