"use client";

import { useEffect, useMemo, useState } from "react";
import { getAuthHeaders, loadSettings } from "../lib/settings";
import { SetupBanner } from "../components/SetupBanner";
import { Icon, type IconName } from "../components/Icon";
import {
  listKidsWithEntries,
  getEntriesInRange,
  saveGrowthReport,
  listGrowthReports,
  deleteGrowthReport,
  deleteDailyEntry,
  type KidSummary,
  type DailyEntryRecord,
  type GrowthReportRecord,
} from "../lib/db";
import { HistorySection, type HistoryItem } from "../components/HistorySection";

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
  const [includeAlrim, setIncludeAlrim] = useState(true);
  const [includeGwanchal, setIncludeGwanchal] = useState(true);
  const [excludedEntryIds, setExcludedEntryIds] = useState<Set<number>>(
    new Set(),
  );
  const [report, setReport] = useState<Report | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [openEntryId, setOpenEntryId] = useState<number | null>(null);
  const [historyVersion, setHistoryVersion] = useState(0);
  const [showAllReports, setShowAllReports] = useState(false);

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
    // Reset per-entry exclusions whenever the kid or period changes — those
    // exclusions belonged to a different result set.
    setExcludedEntryIds(new Set());
  }, [selectedKidId, range?.from, range?.to]);

  async function refreshEntries() {
    if (!selectedKidId || !range) return;
    const rows = await getEntriesInRange(selectedKidId, range.from, range.to);
    setEntries(rows.sort((a, b) => a.date.localeCompare(b.date)));
  }

  // Apply doc-type and per-entry filters in order so the user always sees
  // exactly which records will be sent to the AI.
  const visibleEntries = useMemo(() => {
    return entries.filter((e) => {
      if (e.docType === "alrim" && !includeAlrim) return false;
      if (e.docType === "gwanchal" && !includeGwanchal) return false;
      return true;
    });
  }, [entries, includeAlrim, includeGwanchal]);

  const reportEntries = useMemo(() => {
    return visibleEntries.filter(
      (e) => e.id === undefined || !excludedEntryIds.has(e.id),
    );
  }, [visibleEntries, excludedEntryIds]);

  function toggleEntryIncluded(id: number) {
    setExcludedEntryIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleDeleteEntry(id: number, label: string) {
    if (
      !confirm(
        [
          `${label} 기록을 영구 삭제할까요?`,
          "",
          "• 누적 기록과 성장 리포트 기준 데이터에서 모두 제거됩니다.",
          "• 되돌릴 수 없어요.",
        ].join("\n"),
      )
    ) {
      return;
    }
    try {
      await deleteDailyEntry(id);
      // Drop from local exclusion set if present.
      setExcludedEntryIds((prev) => {
        if (!prev.has(id)) return prev;
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setOpenEntryId((curr) => (curr === id ? null : curr));
      await refreshEntries();
    } catch (e) {
      alert(`삭제하지 못했어요: ${e instanceof Error ? e.message : "알 수 없는 오류"}`);
    }
  }

  async function generate() {
    if (!selectedKid || !range || reportEntries.length === 0) return;
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
          entries: reportEntries.map((e) => ({
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

      const settings = loadSettings();
      saveGrowthReport({
        kidId: selectedKid.kidId,
        kidName: selectedKid.kidName,
        periodLabel: range.label,
        periodFrom: range.from,
        periodTo: range.to,
        entryCount: reportEntries.length,
        ...data.report,
        provider: settings?.provider ?? "unknown",
        model: settings?.model ?? "unknown",
        createdAt: Date.now(),
      })
        .then(() => setHistoryVersion((v) => v + 1))
        .catch(() => {
          // Don't surface DB errors — generation already succeeded.
        });
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
    for (const e of visibleEntries) {
      const ym = e.date.slice(0, 7);
      const arr = map.get(ym) ?? [];
      arr.push(e);
      map.set(ym, arr);
    }
    return Array.from(map.entries()).sort(([a], [b]) => b.localeCompare(a));
  }, [visibleEntries]);

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

            {entries.length > 0 && (
              <div className="mt-4 pt-4 border-t border-warm-100">
                <div className="text-xs text-ink-muted mb-2">
                  포함할 기록 종류
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setIncludeAlrim((v) => !v)}
                    aria-pressed={includeAlrim}
                    className={`px-3.5 py-1.5 rounded-full border text-sm transition ${
                      includeAlrim
                        ? "bg-terracotta-50 text-terracotta-700 border-terracotta-200 shadow-sm"
                        : "bg-paper text-ink-muted border-warm-200 hover:border-warm-300"
                    }`}
                  >
                    {includeAlrim ? "✓ 알림장" : "알림장"}
                  </button>
                  <button
                    onClick={() => setIncludeGwanchal((v) => !v)}
                    aria-pressed={includeGwanchal}
                    className={`px-3.5 py-1.5 rounded-full border text-sm transition ${
                      includeGwanchal
                        ? "bg-sage-50 text-sage-600 border-sage-200 shadow-sm"
                        : "bg-paper text-ink-muted border-warm-200 hover:border-warm-300"
                    }`}
                  >
                    {includeGwanchal ? "✓ 관찰일지" : "관찰일지"}
                  </button>
                </div>
                <p className="text-xs text-ink-muted mt-2 leading-relaxed">
                  체크된 종류만 리포트에 반영돼요. 기본은 둘 다 포함입니다.
                </p>
              </div>
            )}
          </Step>

          {visibleEntries.length > 0 && (
            <details className="bg-paper rounded-2xl border border-warm-100 shadow-card group" open>
              <summary className="cursor-pointer list-none px-6 py-4 flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2.5 min-w-0">
                  <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-terracotta-50 text-terracotta-600 shrink-0">
                    <Icon name="note" size={18} strokeWidth={1.7} />
                  </span>
                  <span className="font-semibold text-ink truncate">
                    이 기간 누적 기록 {visibleEntries.length}건 ·{" "}
                    <span className="text-terracotta-600">
                      리포트 반영 {reportEntries.length}건
                    </span>
                  </span>
                </span>
                <span className="text-xs text-ink-muted shrink-0 group-open:rotate-180 transition">
                  ▾
                </span>
              </summary>
              <div className="px-6 pb-6 pt-0 space-y-4">
                <p className="text-xs text-ink-muted leading-relaxed">
                  체크박스를 끄면 해당 기록은 리포트에 반영되지 않아요. 영구
                  삭제는 펼친 후 빨간 삭제 버튼.
                </p>
                {byMonth.map(([ym, rows]) => (
                  <div key={ym}>
                    <h3 className="text-xs font-semibold text-ink-muted mb-2 tracking-wide tabular-nums">
                      {ym} · {rows.length}건
                    </h3>
                    <ul className="divide-y divide-warm-100 border border-warm-100 rounded-xl">
                      {rows.map((e) => {
                        const open = openEntryId === e.id;
                        const id = e.id;
                        const included =
                          id === undefined ? true : !excludedEntryIds.has(id);
                        return (
                          <li
                            key={id ?? `${e.date}-${e.kidId}`}
                            className={included ? "" : "opacity-50"}
                          >
                            <div className="flex items-start gap-2 px-3 py-2.5">
                              <input
                                type="checkbox"
                                checked={included}
                                onChange={() => id !== undefined && toggleEntryIncluded(id)}
                                disabled={id === undefined}
                                className="mt-1.5 accent-terracotta-500 w-4 h-4 shrink-0"
                                aria-label={
                                  included
                                    ? "이 기록 리포트에서 빼기"
                                    : "이 기록 리포트에 다시 포함"
                                }
                                title={
                                  included
                                    ? "이 기록을 리포트에서 빼기"
                                    : "이 기록을 리포트에 다시 포함"
                                }
                              />
                              <button
                                onClick={() =>
                                  setOpenEntryId(open ? null : id ?? null)
                                }
                                className="flex-1 min-w-0 flex items-start justify-between gap-3 text-left hover:bg-warm-50 transition rounded-lg -mx-2 px-2 py-1"
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
                            </div>
                            {open && (
                              <div className="px-3 pb-3 pt-0 space-y-2 ml-7">
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
                                {id !== undefined && (
                                  <div className="flex items-center justify-end pt-1">
                                    <button
                                      onClick={() =>
                                        handleDeleteEntry(
                                          id,
                                          `${formatDate(e.date)} ${e.docType === "gwanchal" ? "관찰일지" : "알림장"}`,
                                        )
                                      }
                                      className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 text-ink-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                      title="이 기록을 영구 삭제"
                                    >
                                      <Icon name="x" size={12} strokeWidth={2} />
                                      이 기록 영구 삭제
                                    </button>
                                  </div>
                                )}
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
              disabled={generating || reportEntries.length === 0 || !range}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-2xl font-semibold disabled:bg-warm-200 disabled:text-ink-faint disabled:cursor-not-allowed shadow-sm hover:shadow-md"
            >
              {!generating && <Icon name="sparkle" size={16} strokeWidth={2} />}
              {generating
                ? "AI가 누적 기록을 종합하고 있어요..."
                : reportEntries.length === 0
                  ? "반영할 기록이 없어요"
                  : `${selectedKid?.kidName ?? ""} ${range?.label ?? ""} 리포트 생성하기 (${reportEntries.length}건 반영)`}
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
                <div className="flex items-center gap-2">
                  <button
                    onClick={copyAll}
                    className="inline-flex items-center gap-1.5 text-sm px-3.5 py-2 bg-ink hover:bg-ink-soft text-cream rounded-xl font-medium"
                  >
                    <Icon name="copy" size={14} strokeWidth={1.8} />
                    {copied ? "전체 복사됨" : "전체 복사"}
                  </button>
                  <button
                    onClick={() => setReport(null)}
                    className="inline-flex items-center gap-1.5 text-sm px-3.5 py-2 bg-paper hover:bg-warm-50 text-ink-soft border border-warm-200 rounded-xl font-medium"
                    title="결과 영역 닫기 (저장된 리포트는 아래 히스토리에서 다시 볼 수 있어요)"
                  >
                    <Icon name="x" size={14} strokeWidth={2} />
                    닫기
                  </button>
                </div>
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

          <HistorySection
            key={`growth-history-${historyVersion}-${showAllReports ? "all" : selectedKidId ?? ""}`}
            title={
              showAllReports
                ? "저장된 성장 리포트 (전체)"
                : `${selectedKid?.kidName ?? "선택된 아이"} · 저장된 성장 리포트`
            }
            emptyMessage={
              showAllReports
                ? "아직 저장된 성장 리포트가 없어요. 위에서 리포트를 한 번 생성하면 이곳에 자동으로 쌓입니다."
                : `${selectedKid?.kidName ?? "이 아이"}의 저장된 리포트가 아직 없어요. 위에서 리포트를 한 번 생성해 보세요. (전체 보기로 다른 아이 리포트를 볼 수 있어요.)`
            }
            headerRight={
              <div className="inline-flex items-center rounded-lg border border-warm-200 bg-paper p-0.5 text-xs">
                <button
                  onClick={() => setShowAllReports(false)}
                  aria-pressed={!showAllReports}
                  className={`px-2.5 py-1 rounded-md transition ${
                    !showAllReports
                      ? "bg-terracotta-50 text-terracotta-700 font-medium"
                      : "text-ink-muted hover:bg-warm-50"
                  }`}
                >
                  이 아이만
                </button>
                <button
                  onClick={() => setShowAllReports(true)}
                  aria-pressed={showAllReports}
                  className={`px-2.5 py-1 rounded-md transition ${
                    showAllReports
                      ? "bg-terracotta-50 text-terracotta-700 font-medium"
                      : "text-ink-muted hover:bg-warm-50"
                  }`}
                >
                  전체
                </button>
              </div>
            }
            load={async () => {
              const rows: GrowthReportRecord[] = await listGrowthReports({
                limit: 50,
                kidId:
                  showAllReports || !selectedKidId ? undefined : selectedKidId,
              });
              return rows
                .filter(
                  (r): r is GrowthReportRecord & { id: number } =>
                    r.id !== undefined,
                )
                .map<HistoryItem>((r) => ({
                  id: r.id,
                  createdAt: r.createdAt,
                  meta: [r.kidName, r.periodLabel, `누적 ${r.entryCount}건`],
                  title: `${r.kidName} · ${r.periodLabel} 성장 리포트`,
                  preview: r.intro.replace(/\s+/g, " ").slice(0, 80),
                  detail: [
                    { label: "인사말", text: r.intro },
                    { label: "관심 놀이", text: r.interests },
                    { label: "또래 관계의 변화", text: r.peerRelations },
                    { label: "언어 표현 특징", text: r.language },
                    { label: "신체 활동과 정서 표현", text: r.bodyAndEmotion },
                    { label: "교사의 지원 내용", text: r.teacherSupport },
                    { label: "가정 연계 제안", text: r.homeConnection },
                  ],
                }));
            }}
            onDelete={async (id) => {
              await deleteGrowthReport(id);
              setHistoryVersion((v) => v + 1);
            }}
          />
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
