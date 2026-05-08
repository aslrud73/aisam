import type { ComponentType } from "react";
import {
  TodayIcon,
  ParentIcon,
  PlayIcon,
  ReportIcon,
  SettingsIcon,
  HelpIcon,
} from "./NavIcons";

export type NavCategory = "daily" | "regular" | "manage";

export type NavItem = {
  href: string;
  label: string;
  shortLabel?: string;
  Icon: ComponentType<{ size?: number; className?: string }>;
  accent: "coral" | "mustard" | "lavender" | "navy" | "neutral";
  category: NavCategory;
  /** Show in mobile bottom tab bar (limit 5). */
  inBottomTab?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  {
    href: "/",
    label: "오늘 기록",
    shortLabel: "오늘",
    Icon: TodayIcon,
    accent: "coral",
    category: "daily",
    inBottomTab: true,
  },
  {
    href: "/parent",
    label: "학부모 답변",
    shortLabel: "학부모",
    Icon: ParentIcon,
    accent: "mustard",
    category: "daily",
    inBottomTab: true,
  },
  {
    href: "/play",
    label: "놀이기록",
    shortLabel: "놀이",
    Icon: PlayIcon,
    accent: "lavender",
    category: "daily",
    inBottomTab: true,
  },
  {
    href: "/reports",
    label: "성장 리포트",
    shortLabel: "리포트",
    Icon: ReportIcon,
    accent: "navy",
    category: "regular",
    inBottomTab: true,
  },
  {
    href: "/settings",
    label: "설정",
    shortLabel: "설정",
    Icon: SettingsIcon,
    accent: "neutral",
    category: "manage",
    inBottomTab: true,
  },
  {
    href: "/help",
    label: "사용 설명서",
    shortLabel: "도움말",
    Icon: HelpIcon,
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
  neutral: "text-ink-secondary",
};

export const ACCENT_BG: Record<NavItem["accent"], string> = {
  coral: "bg-coral-bg",
  mustard: "bg-mustard-bg",
  lavender: "bg-lavender-bg",
  navy: "bg-navy-bg",
  neutral: "bg-warm",
};
