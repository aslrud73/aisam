"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { isConfigured } from "../lib/settings";

/**
 * Renders a one-line nudge when the AI provider/key isn't set yet.
 * Returns null once configured so we don't take up space.
 */
export function SetupBanner() {
  const [configured, setConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    setConfigured(isConfigured());
    // Re-check when localStorage changes from another tab
    const onStorage = () => setConfigured(isConfigured());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  if (configured !== false) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
      <div className="text-sm text-stone-700">
        <strong>AI 키가 아직 등록되지 않았어요.</strong>{" "}
        <span className="text-stone-600">
          생성을 시작하려면 본인의 AI API 키가 필요합니다.
        </span>
      </div>
      <Link
        href="/settings"
        className="shrink-0 px-3 py-1.5 bg-stone-800 text-white rounded-lg text-sm hover:bg-stone-700"
      >
        설정 열기
      </Link>
    </div>
  );
}
