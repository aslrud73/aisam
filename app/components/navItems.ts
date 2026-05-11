import type { IconName } from "./Icon";

export type NavCategory = "daily" | "regular" | "manage";

export type NavItem = {
  href: string;
  label: string;
  shortLabel?: string;
  icon: IconName;
  accent: "coral" | "mustard" | "lavender" | "navy" | "neutral";
  category: NavCategory;
  inBottomTab?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  {
    href: "/",
    label: "오늘 기록",
    shortLabel: "오늘",
    icon: "note",
    accent: "coral",
    category: "daily",
    inBottomTab: true,
  },
  {
    href: "/parent",
    label: "학부모 답변",
    shortLabel: "학부모",
    icon: "chat",
    accent: "mustard",
    category: "daily",
    inBottomTab: true,
  },
  {
    href: "/play",
    label: "놀이기록",
    shortLabel: "놀이",
    icon: "camera",
    accent: "lavender",
    category: "daily",
    inBottomTab: true,
  },
  {
    href: "/reports",
    label: "성장 리포트",
    shortLabel: "리포트",
    icon: "chart",
    accent: "navy",
    category: "regular",
    inBottomTab: true,
  },
  {
    href: "/settings",
    label: "설정",
    shortLabel: "설정",
    icon: "settings",
    accent: "neutral",
    category: "manage",
    inBottomTab: true,
  },
  {
    href: "/help",
    label: "사용 설명서",
    shortLabel: "도움말",
    icon: "book",
    accent: "neutral",
    category: "manage",
    inBottomTab: false,
  },
];

export const ACCENT_TEXT: Record<NavItem["accent"], string> = {
  coral: "text-coral",
  mustard: "text-mustard",
  lavender: "text-lavender",
  navy: "text-navy",
  neutral: "text-ink-soft",
};

export const ACCENT_BG_SOFT: Record<NavItem["accent"], string> = {
  coral: "bg-coral-bg",
  mustard: "bg-mustard-bg",
  lavender: "bg-lavender-bg",
  navy: "bg-navy-bg",
  neutral: "bg-warm-50",
};
