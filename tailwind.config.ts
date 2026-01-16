import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#e6fafb",
          100: "#ccf5f8",
          200: "#99ebf1",
          300: "#66e1ea",
          400: "#33d7e3",
          500: "#1ecbe1", // Base color
          600: "#18a8ba",
          700: "#128999",
          800: "#0d6a78",
          900: "#084b57",
          950: "#042d35",
        },
        accent: {
          green: "#1ee1a5", // Analogous teal-green
          blue: "#1ea5e1",  // Analogous blue
        },
      },
    },
  },
  plugins: [],
} satisfies Config;