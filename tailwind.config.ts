import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#FFF9F0",
        terracotta: "#D97757",
        sage: "#8FA68E",
      },
      fontFamily: {
        display: ["'Gowun Dodum'", "system-ui", "sans-serif"],
        sans: ["'Pretendard'", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
