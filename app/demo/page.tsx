"use client";

import { useState } from "react";
import { Icon, type IconName } from "../components/Icon";
import { DemoProvider } from "../lib/demoContext";
import HomePage from "../page";
import ParentPage from "../parent/page";
import PlayPage from "../play/page";
import ReportsPage from "../reports/page";

type TabId = "home" | "parent" | "play" | "report";
type Accent = "coral" | "mustard" | "lavender" | "navy";

const ACCENT_ACTIVE: Record<Accent, string> = {
  coral: "bg-coral-500 text-white border-coral-500 shadow-sm",
  mustard: "bg-mustard-500 text-white border-mustard-500 shadow-sm",
  lavender: "bg-lavender-500 text-white border-lavender-500 shadow-sm",
  navy: "bg-navy-500 text-white border-navy-500 shadow-sm",
};

const TABS: { id: TabId; label: string; icon: IconName; accent: Accent }[] = [
  { id: "home", label: "오늘 기록", icon: "note", accent: "coral" },
  { id: "parent", label: "학부모 답변", icon: "chat", accent: "mustard" },
  { id: "play", label: "놀이기록", icon: "camera", accent: "lavender" },
  { id: "report", label: "성장 리포트", icon: "chart", accent: "navy" },
];

export default function DemoPage() {
  const [tab, setTab] = useState<TabId>("home");

  return (
    <DemoProvider active>
      <div className="max-w-4xl mx-auto px-5 pt-5">
        <div className="rounded-2xl border border-mustard-300 bg-mustard-50 px-4 py-3 text-sm text-mustard-800 leading-relaxed">
          <strong>체험판입니다.</strong> 입력은 잠겨 있고{" "}
          <strong>‘생성하기’ 버튼만 동작</strong>해요. 문체를 바꿔가며 눌러보세요.
          이곳에서 만든 결과는 저장되지 않아요.
        </div>
        <div className="flex gap-2 overflow-x-auto py-3 -mx-1 px-1">
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl text-sm font-semibold border transition ${
                  active
                    ? ACCENT_ACTIVE[t.accent]
                    : "bg-paper text-ink-soft border-warm-200 hover:bg-warm-50"
                }`}
              >
                <Icon name={t.icon} size={14} strokeWidth={1.8} />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {tab === "home" && <HomePage key="demo-home" />}
      {tab === "parent" && <ParentPage key="demo-parent" />}
      {tab === "play" && <PlayPage key="demo-play" />}
      {tab === "report" && <ReportsPage key="demo-report" />}
    </DemoProvider>
  );
}
