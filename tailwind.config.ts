import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: {
          DEFAULT: "#FBF7F0",
          50: "#FDFAF4",
          100: "#FAF4EA",
          200: "#F2E9D8",
        },
        paper: "#FFFFFF",
        ink: {
          DEFAULT: "#2A2620",
          soft: "#5A5249",
          muted: "#8B8278",
          faint: "#B7AE9F",
        },
        warm: {
          50: "#F8F4EC",
          100: "#EFE8DD",
          200: "#E2D8C6",
          300: "#CFC2AB",
          400: "#A89B83",
        },
        terracotta: {
          DEFAULT: "#C56B4A",
          50: "#FBF1EC",
          100: "#F5DDD2",
          200: "#EBBCA8",
          300: "#DD9A7E",
          400: "#D17F5E",
          500: "#C56B4A",
          600: "#AC5938",
          700: "#8C462C",
          800: "#6D3622",
        },
        sage: {
          DEFAULT: "#7A9479",
          50: "#EFF3EE",
          100: "#DDE5DC",
          200: "#BCCABA",
          300: "#9BAF99",
          400: "#7A9479",
          500: "#637C62",
          600: "#4F634F",
        },
        // === 쌤노트 시안 색상 (신규 추가) ===
        coral: {
          DEFAULT: "#E85A4F",
          light: "#F58575",
          bg: "#FCE8E5",
        },
        ssaem_sage: {
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
      },
      fontFamily: {
        display: ["'Gowun Dodum'", "'Pretendard'", "system-ui", "sans-serif"],
        sans: ["'Pretendard'", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(42, 38, 32, 0.04), 0 4px 12px rgba(42, 38, 32, 0.04)",
        "card-hover":
          "0 1px 2px rgba(42, 38, 32, 0.05), 0 8px 24px rgba(42, 38, 32, 0.06)",
        soft: "0 1px 0 rgba(42, 38, 32, 0.04)",
        coral: "0 4px 14px rgba(232, 90, 79, 0.25)",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.25rem",
      },
    },
  },
  plugins: [],
} satisfies Config;
