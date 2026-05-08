"use client";

import { useEffect, useMemo, useState } from "react";
import { getAuthHeaders } from "../lib/settings";
import { SetupBanner } from "../components/SetupBanner";
import { Icon, type IconName } from "../components/Icon";
import {
  listKidsWithEntries,
  getEntriesInRange,
  type KidSummary,
  type DailyEntryRecord,
} from "../lib/db";

interface Report {
  intro: string;
  interests: string;
  peerRelations: string;
  language: string;
  bodyAndEmotion: string;
  teacherSupport: string;
  homeConnection: string;
}

const SECTIONS: Array<{ key: keyof Report; label: string }> = [
  { key: "intro", label: "인사말" },
  { key: "interests", label: "관심 놀이" },
  { key: "peerRelations", label: "또래 관계의 변화" },
  { key: "language", label: "언어 표현 특징" },
  { key: "bodyAndEmotion", label: "신체 활동과 정서 표현" },
  { key: "teacherSupport", label: "교사의 지원 내용" },
  { key: "homeConnection", label: "가정 연계 제안" },
];

type PresetId = "thisMonth" | "lastMonth" | "sem1" | "sem2" | "year" | "custom";

interface Preset {
  id: PresetId;
  label: string;
}

const PRESETS: Preset[] = [
  { id: "thisMonth", label: "이번 달" },
  { id: "lastMonth", label: "지난 달" },
  { id: "sem1", label: "1학기 (3~8월)" },
  { id: "sem2", label: "2학기 (9~2월)" },
  { id: "year", label: "올해 전체" },
  { id: "custom", label: "직접 선택" },
];

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Korean kindergarten academic year runs March → February of the next year.
 * If the current month is Jan or Feb, "this academic year" started last March.
 */
function academicYearStart(now = new Date()): number {
  const month = now.getMonth() + 1;
  return month >= 3 ? now.getFullYear() : now.getFullYear() - 1;
}

interface Range {
  from: string;
  to: string;
  label: string;
}

function rangeForPreset(id: PresetId, custom: { from: string; to: string }): Range | null {
  const now = new Date();
  switch (id) {
    case "thisMonth": {
      const y = now.getFullYear();
      const m = now.getMonth() + 1;
      const last = new Date(y, m, 0).getDate();
      return {
        from: `${y}-${pad(m)}-01`,
        to: `${y}-${pad(m)}-${pad(last)}`,
        label: `${y}년 ${m}월`,
      };
    }
    case "lastMonth": {
      const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      const last = new Date(y, m, 0).getDate();
      return {
        from: `${y}-${pad(m)}-01`,
        to: `${y}-${pad(m)}-${pad(last)}`,
        label: `${y}년 ${m}월`,
      };
    }
    case "sem1": {
      const y = academicYearStart(now);
      return {
        from: `${y}-03-01`,
        to: `${y}-08-31`,
        label: `${y}학년도 1학기`,
      };
    }
    case "sem2": {
      const y = academicYearStart(now);
      return {
        from: `${y}-09-01`,
        to: `${y + 1}-02-${pad(new Date(y + 1, 2, 0).getDate())}`,
        label: `${y}학년도 2학기`,
      };
    }
    case "year": {
      const y = academicYearStart(now);
      return {
        from: `${y}-03-01`,
        to: `${y + 1}-02-${pad(new Date(y + 1, 2, 0).getDate())}`,
        label: `${y}학년도 전체`,
      };
    }
    case "custom": {
      if (!custom.from || !custom.to) return null;
      if (custom.from > custom.to) return null;
      return {
        from: custom.from,
        to: custom.to,
        label: `${custom.from} ~ ${custom.to}`,
      };
    }
  }
}

function formatDate(date: string): string {
  const d = new Date(date + "T00:00:00");
  if (Number.isNaN(d.getTime())) return date;
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

export default function ReportsPage() {
  const [kids, setKids] = useState<KidSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedKidId, setSelectedKidId] = useState<string | null>(null);
  const [presetId, setPresetId] = useState<PresetId>("thisMonth");
  const [customRange, setCustomRange] = useState({
    from: isoDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1)),
    to: isoDate(new Date()),
  });
  const [entries, setEntries] = useState<DailyEntryRecord[]>([]);
  const [report, setReport] = useState<Report | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [openEntryId, setOpenEntryId] = useState<number | null>(null);

  useEffect(() => {
    listKidsWithEntries()
      .then((rows) => {
        setKids(rows);
        if (rows.length && !selectedKidId) setSelectedKidId(rows[0].kidId);
        setLoading(false);
      })
      .catch(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const range = useMemo(
    () => rangeForPreset(presetId, customRange),
    [presetId, customRange],
  );
  const selectedKid = kids.find((k) => k.kidId === selectedKidId) ?? null;

  useEffect(() => {
    if (!selectedKidId || !range) {
      setEntries([]);
      return;
    }
    getEntriesInRange(selectedKidId, range.from, range.to)
      .then((rows) => setEntries(rows.sort((a, b) => a.date.localeCompare(b.date))))
      .catch(() => setEntries([]));
  }, [selectedKidId, range?.from, range?.to]);

  async function generate() {
    if (!selectedKid || !range || entries.length === 0) return;
    setGenerating(true);
    setError(null);
    setReport(null);
    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          kidName: selectedKid.kidName,
          periodLabel: range.label,
          entries: entries.map((e) => ({
            date: e.date,
            docType: e.docType,
            meal: e.meal,
            mood: e.mood,
            nap: e.nap,
            memo: e.memo,
            todayActivity: e.todayActivity,
            text: e.text,
          })),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `요청 실패 (${res.status})`);
      }
      const data: { report: Report } = await res.json();
      setReport(data.report);
    } catch (e) {
      setError(e instanceof Error ? e.message : "알 수 없는 오류");
    } finally {
      setGenerating(false);
    }
  }

  async function copyAll() {
    if (!report || !selectedKid || !range) return;
    const text =
      `${selectedKid.kidName} · ${range.label} 성장 리포트\n\n` +
      SECTIONS.map(({ key, label }) => `[${label}]\n${report[key]}`).join("\n\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function updateSection(key: keyof Report, value: string) {
    if (!report) return;
    setReport({ ...report, [key]: value });
  }

  const byMonth = useMemo(() => {
    const map = new Map<string, DailyEntryRecord[]>();
    for (const e of entries) {
      const ym = e.date.slice(0, 7);
      const arr = map.get(ym) ?? [];
      arr.push(e);
      map.set(ym, arr);
    }
    return Array.from(map.entries()).sort(([a], [b]) => b.localeCompare(a));
  }, [entries]);

  return (
    <main className="max-w-4xl mx-auto px-5 py-8 pb-24 space-y-5">
      <SetupBanner />
      <div className="flex items-start gap-3">
        <span className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-terracotta-50 text-terracotta-600 shrink-0">
          <Icon name="chart" size={20} strokeWidth={1.7} />
        </span>
        <div>
          <h1 className="text-2xl font-semibold text-ink tracking-tight">성장 리포트</h1>
          <p className="text-sm text-ink-soft mt-1 leading-relaxed">
            누적된 알림장·관찰일지를 한 달, 한 학기, 한 해 등 원하는 기간으로
            종합해서 학부모님께 전달할 7-섹션 성장 리포트를 만들어 드려요.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-ink-faint py-16">불러오는 중...</div>
      ) : kids.length === 0 ? (
        <div className="bg-cream-100 border border-warm-100 rounded-2xl p-10 text-center text-sm text-ink-soft leading-relaxed shadow-card">
          <p className="font-display text-base text-ink mb-2">아직 누적된 기록이 없어요</p>
          <p>
            "오늘 기록"에서 알림장이나 관찰일지를 한 번 이상 생성하면<br />
            성장 리포트를 만들 수 있어요.
          </p>
        </div>
      ) : (
        <>
          <Step icon="users" step={1} title="아이 선택">
            <div className="flex flex-wrap gap-2">
              {kids.map((k) => {
                const active = selectedKidId === k.kidId;
                return (
                  <button
                    key={k.kidId}
                    onClick={() => setSelectedKidId(k.kidId)}
                    className={`px-3.5 py-2 rounded-xl border text-sm transition ${
                      active
                        ? "bg-sage-500 text-white border-sage-500 shadow-sm"
                        : "bg-paper text-ink-soft border-warm-200 hover:border-warm-300 hover:bg-warm-50"
                    }`}
                  >
                    <div className="font-medium">{k.kidName}</div>
                    <div
                      className={`text-[11px] mt-0.5 tabular-nums ${
                        active ? "text-white/85" : "text-ink-muted"
                      }`}
                    >
                      누적 {k.entryCount}건
                    </div>
                  </button>
                );
              })}
            </div>
          </Step>

          <Step icon="chart" step={2} title="리포트 기간">
            <div className="flex flex-wrap gap-2 mb-3">
              {PRESETS.map((p) => {
                const active = presetId === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setPresetId(p.id)}
                    className={`px-3.5 py-1.5 rounded-full border text-sm transition ${
                      active
                        ? "bg-terracotta-500 text-white border-terracotta-500 shadow-sm"
                        : "bg-paper text-ink-soft border-warm-200 hover:border-warm-300 hover:bg-warm-50"
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>

            {presetId === "custom" && (
              <div className="flex flex-wrap items-center gap-2 mb-3 bg-cream-100 border border-warm-100 rounded-xl px-3 py-2.5">
                <span className="text-xs text-ink-muted">기간:</span>
                <input
                  type="date"
                  value={customRange.from}
                  onChange={(e) =>
                    setCustomRange((p) => ({ ...p, from: e.target.value }))
                  }
                  className="px-3 py-1.5 rounded-lg border border-warm-200 bg-paper text-sm focus:border-terracotta-400 focus:ring-2 focus:ring-terracotta-100 focus:outline-none"
                />
                <span className="text-ink-muted">~</span>
                <input
                  type="date"
                  value={customRange.to}
                  onChange={(e) =>
                    setCustomRange((p) => ({ ...p, to: e.target.value }))
                  }
                  className="px-3 py-1.5 rounded-lg border border-warm-200 bg-paper text-sm focus:border-terracotta-400 focus:ring-2 focus:ring-terracotta-100 focus:outline-none"
                />
              </div>
            )}

            <div className="text-sm text-ink-muted tabular-nums">
              {range
                ? `${range.label} · ${range.from} ~ ${range.to} · 누적 ${entries.length}건`
                : "기간을 다시 확인해 주세요."}
            </div>
            {range && entries.length === 0 && (
              <p className="text-xs text-terracotta-700 bg-terracotta-50 border border-terracotta-100 px-3 py-2 rounded-xl mt-3">
                선택한 기간에 이 아이의 기록이 없어요. 다른 기간을 선택해 주세요.
              </p>
            )}
          </Step>

          {entries.length > 0 && (
            <details className="bg-paper rounded-2xl border border-warm-100 shadow-card group">
              <summary className="cursor-pointer list-none px-6 py-4 flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2.5">
                  <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-terracotta-50 text-terracotta-600 shrink-0">
                    <Icon name="note" size={18} strokeWidth={1.7} />
                  </span>
                  <span className="font-semibold text-ink">
                    이 기간 누적 기록 {entries.length}건 펼쳐보기
                  </span>
                </span>
                <span className="text-xs text-ink-muted shrink-0 group-open:rotate-180 transition">
                  ▾
                </span>
              </summary>
              <div className="px-6 pb-6 pt-0 space-y-4">
                {byMonth.map(([ym, rows]) => (
                  <div key={ym}>
                    <h3 className="text-xs font-semibold text-ink-muted mb-2 tracking-wide tabular-nums">
                      {ym} · {rows.length}건
                    </h3>
                    <ul className="divide-y divide-warm-100 border border-warm-100 rounded-xl">
                      {rows.map((e) => {
                        const open = openEntryId === e.id;
                        return (
                          <li key={e.id ?? `${e.date}-${e.kidId}`}>
                            <button
                              onClick={() =>
                                setOpenEntryId(open ? null : e.id ?? null)
                              }
                              className="w-full flex items-start justify-between gap-3 px-3 py-2.5 text-left hover:bg-warm-50 transition rounded-xl"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-muted mb-0.5 tabular-nums">
                                  <span>{formatDate(e.date)}</span>
                                  <span
                                    className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10.5px] ${
                                      e.docType === "gwanchal"
                                        ? "bg-sage-50 border-sage-100 text-sage-600"
                                        : "bg-terracotta-50 border-terracotta-100 text-terracotta-700"
                                    }`}
                                  >
                                    {e.docType === "gwanchal" ? "관찰일지" : "알림장"}
                                  </span>
                                  {e.todayActivity && (
                                    <span className="text-ink-muted truncate max-w-[16em]">
                                      {e.todayActivity}
                                    </span>
                                  )}
                                </div>
                                <div className="text-sm text-ink-soft truncate">
                                  {e.text.replace(/\s+/g, " ").slice(0, 80)}
                                </div>
                              </div>
                              <span
                                className={`text-ink-faint shrink-0 mt-1 transition ${
                                  open ? "rotate-180" : ""
                                }`}
                              >
                                ▾
                              </span>
                            </button>
                            {open && (
                              <div className="px-3 pb-3 pt-1 space-y-2">
                                {(e.meal || e.mood || e.nap || e.memo) && (
                                  <div className="flex flex-wrap gap-1.5 text-[11px] text-ink-muted">
                                    {e.meal && (
                                      <span className="px-2 py-0.5 rounded-full bg-cream-100 border border-warm-100">
                                        식사 · {e.meal}
                                      </span>
                                    )}
                                    {e.mood && (
                                      <span className="px-2 py-0.5 rounded-full bg-cream-100 border border-warm-100">
                                        기분 · {e.mood}
                                      </span>
                                    )}
                                    {e.nap && (
                                      <span className="px-2 py-0.5 rounded-full bg-cream-100 border border-warm-100">
                                        낮잠 · {e.nap}
                                      </span>
                                    )}
                                    {e.memo && (
                                      <span className="px-2 py-0.5 rounded-full bg-cream-100 border border-warm-100">
                                        메모 · {e.memo}
                                      </span>
                                    )}
                                  </div>
                                )}
                                <p className="text-sm leading-relaxed text-ink-soft whitespace-pre-wrap bg-cream-100 border-l-2 border-terracotta-200 rounded-xl px-3 py-2">
                                  {e.text}
                                </p>
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            </details>
          )}

          <section className="bg-paper rounded-2xl border border-warm-100 p-6 shadow-card">
            <button
              onClick={generate}
              disabled={generating || entries.length === 0 || !range}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-2xl font-semibold disabled:bg-warm-200 disabled:text-ink-faint disabled:cursor-not-allowed shadow-sm hover:shadow-md"
            >
              {!generating && <Icon name="sparkle" size={16} strokeWidth={2} />}
              {generating
                ? "AI가 누적 기록을 종합하고 있어요..."
                : `${selectedKid?.kidName ?? ""} ${range?.label ?? ""} 리포트 생성하기`}
            </button>
            <div className="mt-4 flex items-start gap-2 text-xs text-ink-muted leading-relaxed">
              <span className="text-warm-400 shrink-0 mt-0.5">
                <Icon name="shield" size={14} strokeWidth={1.6} />
              </span>
              <p>
                누적 기록을 종합한 초안입니다. 학부모님께 전달하기 전에 반드시
                선생님이 검토·수정해 주세요. 다른 아이 이름·진단 표현은 자동으로
                걸러지지만 100% 보장되지 않습니다.
              </p>
            </div>
            {error && (
              <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-xl">
                {error}
              </p>
            )}
          </section>

          {report && (
            <section className="bg-paper rounded-2xl border border-warm-100 p-6 shadow-card">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <h2 className="text-lg font-semibold text-ink inline-flex items-center gap-2">
                  <span className="text-terracotta-500">
                    <Icon name="check" size={18} strokeWidth={2} />
                  </span>
                  {selectedKid?.kidName} · {range?.label} 성장 리포트
                </h2>
                <button
                  onClick={copyAll}
                  className="inline-flex items-center gap-1.5 text-sm px-3.5 py-2 bg-ink hover:bg-ink-soft text-cream rounded-xl font-medium"
                >
                  <Icon name="copy" size={14} strokeWidth={1.8} />
                  {copied ? "전체 복사됨" : "전체 복사"}
                </button>
              </div>
              <div className="space-y-4">
                {SECTIONS.map(({ key, label }) => (
                  <div key={key}>
                    <h3 className="text-xs font-semibold text-terracotta-700 mb-1.5 tracking-wide">
                      {label}
                    </h3>
                    <textarea
                      value={report[key]}
                      onChange={(e) => updateSection(key, e.target.value)}
                      rows={Math.max(2, report[key].split("\n").length + 1)}
                      className="w-full text-sm leading-relaxed bg-cream-100 border-l-2 border-terracotta-300 rounded-2xl p-3.5 resize-none focus:outline-none text-ink-soft"
                    />
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </main>
  );
}

function Step({
  step,
  icon,
  title,
  children,
}: {
  step: number;
  icon: IconName;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-paper rounded-2xl border border-warm-100 p-6 shadow-card">
      <div className="flex items-center gap-3 mb-4">
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-terracotta-50 text-terracotta-700 text-sm font-semibold tabular-nums">
          {step}
        </span>
        <span className="inline-flex items-center gap-2 text-base sm:text-lg font-semibold text-ink">
          <span className="text-terracotta-500">
            <Icon name={icon} size={18} strokeWidth={1.7} />
          </span>
          {title}
        </span>
      </div>
      {children}
    </section>
  );
}
