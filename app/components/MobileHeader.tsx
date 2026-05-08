"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";
import { Icon } from "./Icon";
import { NAV_ITEMS, ACCENT_TEXT } from "./navItems";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export function MobileHeader() {
  const pathname = usePathname();
  return (
    <>
      {/* 모바일 (< md): 로고만 */}
      <header className="md:hidden sticky top-0 z-20 bg-cream/90 backdrop-blur-md border-b border-warm-100">
        <div className="px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Logo size={32} />
            <span className="font-extrabold text-[18px] tracking-[-0.04em] text-ink">
              쌤노트
            </span>
          </Link>
          <Link
            href="/help"
            className="text-xs text-ink-muted hover:text-coral inline-flex items-center gap-1"
            aria-label="사용 설명서"
          >
            <Icon name="book" size={16} strokeWidth={1.7} />
            도움말
          </Link>
        </div>
      </header>

      {/* 태블릿 (md~lg): 상단 가로 메뉴 */}
      <header className="hidden md:flex lg:hidden sticky top-0 z-20 bg-cream/90 backdrop-blur-md border-b border-warm-100">
        <div className="w-full px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo size={32} />
            <span className="font-extrabold text-[20px] tracking-[-0.04em] text-ink">
              쌤노트
            </span>
          </Link>
          <nav>
            <ul className="flex items-center gap-1">
              {NAV_ITEMS.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition ${
                        active
                          ? `${ACCENT_TEXT[item.accent]} font-semibold bg-warm-50`
                          : "text-ink-soft hover:bg-warm-50"
                      }`}
                    >
                      <Icon name={item.icon} size={16} strokeWidth={active ? 1.9 : 1.6} />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </header>
    </>
  );
}
