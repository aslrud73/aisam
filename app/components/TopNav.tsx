"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "./Icon";

const TABS: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "오늘 기록", icon: "note" },
  { href: "/parent", label: "학부모 답변", icon: "chat" },
  { href: "/play", label: "놀이기록", icon: "camera" },
  { href: "/reports", label: "성장 리포트", icon: "chart" },
  { href: "/settings", label: "설정", icon: "settings" },
  { href: "/help", label: "사용 설명서", icon: "book" },
];

export function TopNav() {
  const pathname = usePathname();
  return (
    <nav className="bg-cream/85 backdrop-blur-md sticky top-0 z-20 shadow-soft">
      <div className="max-w-5xl mx-auto px-5 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5 group shrink-0">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-terracotta-100 text-terracotta-700 group-hover:bg-terracotta-200 transition">
            <Icon name="note" size={18} strokeWidth={1.8} />
          </span>
          <div className="leading-tight">
            <div className="text-[19px] font-extrabold text-ink group-hover:text-terracotta-600 transition tracking-tight">
              쌤노트
            </div>
            <div className="text-[10.5px] text-ink-muted hidden sm:block -mt-0.5">
              선생님의 1시간을 돌려드립니다
            </div>
          </div>
        </Link>
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar -mr-2 pr-2">
          {TABS.map((t) => {
            const active =
              t.href === "/" ? pathname === "/" : pathname.startsWith(t.href);
            return (
              <Link
                key={t.href}
                href={t.href}
                className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition ${
                  active
                    ? "bg-terracotta-50 text-terracotta-700"
                    : "text-ink-soft hover:bg-warm-50 hover:text-ink"
                }`}
              >
                <Icon name={t.icon} size={16} strokeWidth={active ? 1.8 : 1.6} />
                <span className="whitespace-nowrap">{t.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
