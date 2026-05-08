"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";
import { Icon } from "./Icon";
import { NAV_ITEMS, ACCENT_TEXT, ACCENT_BG_SOFT, type NavItem } from "./navItems";

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

  const groups: Array<{ key: NavItem["category"]; items: NavItem[] }> = [
    { key: "daily", items: NAV_ITEMS.filter((i) => i.category === "daily") },
    { key: "regular", items: NAV_ITEMS.filter((i) => i.category === "regular") },
    { key: "manage", items: NAV_ITEMS.filter((i) => i.category === "manage") },
  ];

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-[240px] lg:fixed lg:inset-y-0 bg-paper border-r border-warm-100 px-4 py-5 z-10">
      <Link href="/" className="flex items-center gap-2.5 px-2 mb-7 group">
        <Logo size={36} />
        <div>
          <div className="font-extrabold text-[1.25rem] text-ink leading-tight tracking-[-0.04em]">
            쌤노트
          </div>
          <div className="text-[11px] text-ink-muted leading-tight">
            선생님의 1시간을 돌려드려요
          </div>
        </div>
      </Link>

      <nav className="flex-1 flex flex-col gap-5">
        {groups.map((group) => (
          <div key={group.key}>
            <div className="text-[11px] font-semibold tracking-wider text-ink-muted uppercase px-2 mb-2">
              {CATEGORY_LABEL[group.key]}
            </div>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${
                        active
                          ? `${ACCENT_BG_SOFT[item.accent]} ${ACCENT_TEXT[item.accent]} font-semibold`
                          : "text-ink-soft hover:bg-warm-50 font-medium"
                      }`}
                    >
                      <span className={active ? ACCENT_TEXT[item.accent] : "text-ink-muted"}>
                        <Icon name={item.icon} size={18} strokeWidth={active ? 1.9 : 1.7} />
                      </span>
                      <span className="text-[14.5px]">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
