import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/features/**/*.{ts,tsx}",
    "./src/shared/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-montserrat)", "var(--font-inter)", "sans-serif"],
      },
      colors: {
        primary: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
          900: "#0c4a6e",
        },
        accent: {
          500: "#f97316",
          600: "#ea580c",
        },
        neutral: {
          50: "#fafafa",
          100: "#f5f5f5",
          800: "#262626",
          900: "#171717",
        },
      },
      boxShadow: {
        elevated: "0 20px 45px -20px rgba(15, 23, 42, 0.35)",
      },
      transitionTimingFunction: {
        "spring-smooth": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};

export default config;

