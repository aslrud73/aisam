"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./Icon";
import { NAV_ITEMS, ACCENT_TEXT } from "./navItems";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export function BottomTabs() {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((i) => i.inBottomTab);
  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-paper/95 backdrop-blur border-t border-warm-100"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0)" }}
      aria-label="주요 메뉴"
    >
      <ul className="grid grid-cols-5">
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex flex-col items-center justify-center gap-1 py-2.5 transition-colors ${
                  active ? ACCENT_TEXT[item.accent] : "text-ink-muted"
                }`}
              >
                <Icon name={item.icon} size={22} strokeWidth={active ? 1.9 : 1.6} />
                <span className={`text-[10.5px] ${active ? "font-semibold" : "font-medium"}`}>
                  {item.shortLabel ?? item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
