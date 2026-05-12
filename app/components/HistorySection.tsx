"use client";

import { useEffect, useState } from "react";
import { Icon } from "./Icon";

export interface HistoryItem {
  id: number;
  createdAt: number;
  /** small chips shown on the row, in order */
  meta: string[];
  /** plain-text title shown bold on the row */
  title: string;
  /** one-line preview shown in muted color */
  preview?: string;
  /** full text shown when expanded; can be multi-section */
  detail: { label?: string; text: string }[];
  /** optional thumbnail images shown above detail when expanded */
  images?: string[];
}

const SITUATION_LABELS: Record<string, string> = {
  general: "일반 문의",
  conflict: "친구 갈등",
  injury: "안전·다침",
  health: "식사·건강",
  development: "발달 우려",
  appreciation: "칭찬·감사",
  absence: "결석·등하원",
};

export function situationLabel(id: string): string {
  return SITUATION_LABELS[id] ?? id;
}

function formatDate(timestamp: number): string {
  const d = new Date(timestamp);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${y}.${m}.${day} ${hh}:${mm}`;
}

export function HistorySection({
  title,
  emptyMessage,
  load,
  onDelete,
  headerRight,
}: {
  title: string;
  emptyMessage: string;
  load: () => Promise<HistoryItem[]>;
  onDelete: (id: number) => Promise<void>;
  headerRight?: React.ReactNode;
}) {
  const [items, setItems] = useState<HistoryItem[] | null>(null);
  const [openId, setOpenId] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  async function refresh() {
    setItems(await load());
  }

  useEffect(() => {
    refresh().catch(() => setItems([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function copyDetail(item: HistoryItem) {
    const text = item.detail
      .map((s) => (s.label ? `[${s.label}]\n${s.text}` : s.text))
      .join("\n\n");
    await navigator.clipboard.writeText(text);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId((p) => (p === item.id ? null : p)), 1500);
  }

  async function handleDelete(id: number) {
    if (!confirm("이 기록을 삭제할까요? 되돌릴 수 없어요.")) return;
    await onDelete(id);
    if (openId === id) setOpenId(null);
    await refresh();
  }

  return (
    <section className="bg-paper rounded-2xl p-6 shadow-card">
      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <h2 className="text-base sm:text-lg font-semibold text-ink inline-flex items-center gap-2">
          <span className="text-[var(--page-accent-500)]">
            <Icon name="note" size={18} strokeWidth={1.7} />
          </span>
          {title}
        </h2>
        <div className="flex items-center gap-3">
          {headerRight}
          {items && items.length > 0 && (
            <span className="text-xs text-ink-muted tabular-nums">
              최근 {items.length}건
            </span>
          )}
        </div>
      </div>

      {items === null ? (
        <p className="text-sm text-ink-muted text-center py-6">불러오는 중...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-ink-muted text-center py-8 leading-relaxed">
          {emptyMessage}
        </p>
      ) : (
        <ul className="divide-y divide-warm-100">
          {items.map((item) => {
            const open = openId === item.id;
            return (
              <li key={item.id} className="py-2">
                <button
                  onClick={() => setOpenId(open ? null : item.id)}
                  className="w-full flex items-start justify-between gap-3 py-2 text-left rounded-xl hover:bg-warm-50 transition px-2"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-muted mb-0.5">
                      <span className="tabular-nums">
                        {formatDate(item.createdAt)}
                      </span>
                      {item.meta.map((m, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center px-2 py-0.5 rounded-full bg-[var(--page-accent-50)] text-ink-soft"
                        >
                          {m}
                        </span>
                      ))}
                    </div>
                    <div className="font-semibold text-sm text-ink truncate">
                      {item.title}
                    </div>
                    {item.preview && (
                      <div className="text-xs text-ink-muted truncate mt-0.5">
                        {item.preview}
                      </div>
                    )}
                  </div>
                  <span
                    className={`text-ink-faint transition shrink-0 mt-1 ${
                      open ? "rotate-180" : ""
                    }`}
                  >
                    ▾
                  </span>
                </button>

                {open && (
                  <div className="px-2 pb-3 pt-1 space-y-3">
                    {item.images && item.images.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {item.images.map((src, i) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            key={i}
                            src={src}
                            alt={`사진 ${i + 1}`}
                            className="w-20 h-20 object-cover rounded-lg border border-warm-200"
                          />
                        ))}
                      </div>
                    )}
                    {item.detail.map((s, i) => (
                      <div key={i}>
                        {s.label && (
                          <div className="text-[11px] font-semibold text-[var(--page-accent-700)] mb-1 tracking-wide">
                            {s.label}
                          </div>
                        )}
                        <p className="text-sm leading-relaxed text-ink-soft whitespace-pre-wrap bg-[var(--page-accent-50)] border-l-2 border-[var(--page-accent-200)] rounded-xl px-3 py-2">
                          {s.text}
                        </p>
                      </div>
                    ))}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copyDetail(item)}
                        className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-[var(--page-accent-100)] hover:bg-[var(--page-accent-200)] text-[var(--page-accent-700)] rounded-xl font-medium"
                      >
                        <Icon name="copy" size={12} strokeWidth={1.8} />
                        {copiedId === item.id ? "복사됨" : "전체 복사"}
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-xs text-ink-muted hover:text-red-600 px-2 py-1"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
