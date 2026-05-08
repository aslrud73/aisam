import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#FBF7F0",
        warm: "#F5EFE3",
        soft: "#FDFAF4",
        ink: {
          DEFAULT: "#2C2420",
          secondary: "#6B5D52",
          tertiary: "#9A8C81",
        },
        coral: {
          DEFAULT: "#E85A4F",
          light: "#F58575",
          bg: "#FCE8E5",
        },
        sage: {
          DEFAULT: "#5B8A6F",
          light: "#8BB39A",
          bg: "#E5EFE9",
        },
        mustard: {
          DEFAULT: "#D4A537",
          light: "#E8C467",
          bg: "#FBF1D8",
        },
        lavender: {
          DEFAULT: "#8B7BB5",
          bg: "#ECE7F4",
        },
        navy: {
          DEFAULT: "#2D4A6B",
          bg: "#DCE6F0",
        },
        line: {
          light: "#EFE8DC",
          medium: "#DCD2C2",
          strong: "#B8AB97",
        },
        // legacy aliases (keep build green for any leftovers during transition)
        terracotta: "#E85A4F",
      },
      fontFamily: {
        sans: ["'Pretendard'", "-apple-system", "BlinkMacSystemFont", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(44, 36, 32, 0.04)",
        card: "0 2px 8px rgba(44, 36, 32, 0.06)",
        lift: "0 8px 24px rgba(44, 36, 32, 0.08)",
        coral: "0 4px 14px rgba(232, 90, 79, 0.25)",
        sage: "0 4px 14px rgba(91, 138, 111, 0.22)",
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
      },
    },
  },
  plugins: [],
} satisfies Config;
