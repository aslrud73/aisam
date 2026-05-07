"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "오늘 기록" },
  { href: "/parent", label: "학부모 답변" },
];

export function TopNav() {
  const pathname = usePathname();
  return (
    <nav className="border-b border-stone-200 bg-cream/90 backdrop-blur sticky top-0 z-20">
      <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="font-display text-xl text-stone-800 group-hover:text-terracotta transition">
            오늘알림장
          </span>
          <span className="text-[10px] text-stone-400 hidden sm:inline">
            · 선생님의 1시간을 돌려드립니다
          </span>
        </Link>
        <div className="flex items-center gap-1">
          {TABS.map((t) => {
            const active =
              t.href === "/"
                ? pathname === "/"
                : pathname.startsWith(t.href);
            return (
              <Link
                key={t.href}
                href={t.href}
                className={`px-3 py-1.5 rounded-lg text-sm transition ${
                  active
                    ? "bg-stone-800 text-white"
                    : "text-stone-600 hover:bg-stone-100"
                }`}
              >
                {t.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
