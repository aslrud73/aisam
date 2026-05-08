"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";
import { NAV_ITEMS, ACCENT_BG, ACCENT_TEXT, type NavItem } from "./navItems";
import { getMonthlyCounts } from "../lib/db";

const CATEGORY_LABEL: Record<NavItem["category"], string> = {
  daily: "매일 사용",
  regular: "정기 작성",
  manage: "관리",
};

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export function Sidebar() {
  const pathname = usePathname();
  const [monthly, setMonthly] = useState<{ alrim: number; gwanchal: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    getMonthlyCounts()
      .then((c) => {
        if (!cancelled) setMonthly(c);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const groups: Array<{ key: NavItem["category"]; items: NavItem[] }> = [
    { key: "daily", items: NAV_ITEMS.filter((i) => i.category === "daily") },
    { key: "regular", items: NAV_ITEMS.filter((i) => i.category === "regular") },
    { key: "manage", items: NAV_ITEMS.filter((i) => i.category === "manage") },
  ];

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-[240px] lg:fixed lg:inset-y-0 bg-white border-r border-line-light px-4 py-5">
      <Link href="/" className="flex items-center gap-2.5 px-2 mb-8 group">
        <Logo size={36} />
        <div>
          <div className="font-extrabold text-[1.25rem] text-ink leading-tight tracking-[-0.04em]">
            쌤노트
          </div>
          <div className="text-[11px] text-ink-tertiary leading-tight">
            선생님의 1시간을 돌려드려요
          </div>
        </div>
      </Link>

      <nav className="flex-1 flex flex-col gap-5">
        {groups.map((group) => (
          <div key={group.key}>
            <div className="text-[11px] font-semibold tracking-wider text-ink-tertiary uppercase px-2 mb-2">
              {CATEGORY_LABEL[group.key]}
            </div>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const active = isActive(pathname, item.href);
                const Icon = item.Icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 ${
                        active
                          ? `${ACCENT_BG[item.accent]} ${ACCENT_TEXT[item.accent]} font-bold`
                          : "text-ink-secondary hover:bg-warm/60"
                      }`}
                    >
                      <span
                        className={
                          active ? ACCENT_TEXT[item.accent] : "text-ink-tertiary"
                        }
                      >
                        <Icon size={20} />
                      </span>
                      <span className="text-[15px]">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {monthly && (monthly.alrim > 0 || monthly.gwanchal > 0) && (
        <div className="mt-4 p-3 bg-coral-bg rounded-xl">
          <div className="text-[11px] font-bold text-coral mb-1">이번 달 누적</div>
          <div className="text-xs text-ink-secondary leading-relaxed">
            알림장 {monthly.alrim}건 · 관찰일지 {monthly.gwanchal}건
          </div>
        </div>
      )}
    </aside>
  );
}
