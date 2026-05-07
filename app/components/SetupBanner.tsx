"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { isConfigured } from "../lib/settings";
import { Icon } from "./Icon";

export function SetupBanner() {
  const [configured, setConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    setConfigured(isConfigured());
    const onStorage = () => setConfigured(isConfigured());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  if (configured !== false) return null;

  return (
    <div className="bg-terracotta-50 border border-terracotta-100 rounded-2xl px-4 py-4 sm:px-5 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-card">
      <div className="flex items-start gap-3">
        <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-terracotta-100 text-terracotta-700 shrink-0">
          <Icon name="key" size={18} strokeWidth={1.8} />
        </span>
        <div className="text-sm leading-relaxed">
          <div className="font-semibold text-ink">처음 시작하시나요? 1분이면 준비 끝</div>
          <div className="text-ink-soft mt-0.5">
            AI 사용을 위해 본인의 API 키 등록이 한 번만 필요해요. 설정 페이지에서 차근차근 안내해 드려요.
          </div>
        </div>
      </div>
      <Link
        href="/settings"
        className="shrink-0 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-xl text-sm font-medium shadow-sm hover:shadow"
      >
        설정으로 가기
        <Icon name="link" size={14} strokeWidth={2} />
      </Link>
    </div>
  );
}
