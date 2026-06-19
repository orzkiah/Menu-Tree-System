import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Palette derived from the Figma reference.
        sidebar: {
          DEFAULT: "#1d2939",
          accent: "#253349",
        },
        brand: {
          DEFAULT: "#2563eb",
          dark: "#1d4ed8",
        },
      },
    },
  },
  plugins: [],
};

export default config;
