"use client";

import { useEffect, useMemo, useState } from "react";
import { getAuthHeaders } from "../lib/settings";
import { SetupBanner } from "../components/SetupBanner";
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
  { key: "interests", label: "이번 달 관심 놀이" },
  { key: "peerRelations", label: "또래 관계의 변화" },
  { key: "language", label: "언어 표현 특징" },
  { key: "bodyAndEmotion", label: "신체 활동과 정서 표현" },
  { key: "teacherSupport", label: "교사의 지원 내용" },
  { key: "homeConnection", label: "가정 연계 제안" },
];

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthRange(monthYM: string): {
  from: string;
  to: string;
  label: string;
} {
  const [yStr, mStr] = monthYM.split("-");
  const y = Number(yStr);
  const m = Number(mStr);
  const from = `${yStr}-${mStr}-01`;
  const lastDay = new Date(y, m, 0).getDate();
  const to = `${yStr}-${mStr}-${String(lastDay).padStart(2, "0")}`;
  return { from, to, label: `${y}년 ${m}월` };
}

export default function ReportsPage() {
  const [kids, setKids] = useState<KidSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedKidId, setSelectedKidId] = useState<string | null>(null);
  const [month, setMonth] = useState(currentMonth());
  const [entries, setEntries] = useState<DailyEntryRecord[]>([]);
  const [report, setReport] = useState<Report | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    listKidsWithEntries()
      .then((rows) => {
        setKids(rows);
        if (rows.length && !selectedKidId) setSelectedKidId(rows[0].kidId);
        setLoading(false);
      })
      .catch(() => setLoading(false));
    // selectedKidId intentionally excluded — only seed on first load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const range = useMemo(() => monthRange(month), [month]);
  const selectedKid = kids.find((k) => k.kidId === selectedKidId) ?? null;

  useEffect(() => {
    if (!selectedKidId) {
      setEntries([]);
      return;
    }
    getEntriesInRange(selectedKidId, range.from, range.to)
      .then((rows) => setEntries(rows.sort((a, b) => a.date.localeCompare(b.date))))
      .catch(() => setEntries([]));
  }, [selectedKidId, range.from, range.to]);

  async function generate() {
    if (!selectedKid || entries.length === 0) return;
    setGenerating(true);
    setError(null);
    setReport(null);
    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          kidName: selectedKid.kidName,
          monthLabel: range.label,
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
    if (!report || !selectedKid) return;
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

  return (
    <main className="max-w-4xl mx-auto px-5 py-8 pb-24 space-y-6">
      <SetupBanner />
      <div>
        <h1 className="font-display text-2xl text-stone-800">월간 성장 리포트</h1>
        <p className="text-sm text-stone-500 mt-1 leading-relaxed">
          한 달치 누적 알림장·관찰일지를 종합해서, 학부모님께 전달할 7-섹션
          월간 성장 리포트를 만들어 드려요.
        </p>
      </div>

      {loading ? (
        <div className="text-center text-stone-400 py-16">불러오는 중...</div>
      ) : kids.length === 0 ? (
        <div className="bg-cream/50 border border-stone-200 rounded-2xl p-8 text-center text-sm text-stone-600 leading-relaxed">
          아직 누적된 기록이 없어요.
          <br />
          "오늘 기록"에서 알림장이나 관찰일지를 한 번 이상 생성해야 월간
          리포트를 만들 수 있어요.
        </div>
      ) : (
        <>
          {/* 1. 아이 선택 */}
          <section className="bg-white rounded-2xl border border-stone-200 p-6">
            <label className="font-display text-lg text-stone-800 mb-3 block">
              <span className="text-terracotta mr-2">1</span>아이 선택
            </label>
            <div className="flex flex-wrap gap-2">
              {kids.map((k) => {
                const active = selectedKidId === k.kidId;
                return (
                  <button
                    key={k.kidId}
                    onClick={() => setSelectedKidId(k.kidId)}
                    className={`px-3 py-2 rounded-lg border text-sm transition ${
                      active
                        ? "bg-sage text-white border-sage"
                        : "bg-white text-stone-700 border-stone-300 hover:border-stone-400"
                    }`}
                  >
                    <div className="font-medium">{k.kidName}</div>
                    <div
                      className={`text-[11px] mt-0.5 ${
                        active ? "text-white/80" : "text-stone-500"
                      }`}
                    >
                      누적 {k.entryCount}건
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* 2. 월 선택 */}
          <section className="bg-white rounded-2xl border border-stone-200 p-6">
            <label className="font-display text-lg text-stone-800 mb-3 block">
              <span className="text-terracotta mr-2">2</span>리포트 기간
            </label>
            <div className="flex items-center gap-3">
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="px-3 py-2 rounded-lg border border-stone-300 focus:border-terracotta focus:outline-none text-sm"
              />
              <span className="text-sm text-stone-500">
                {range.label} · 이 기간 누적 기록 {entries.length}건
              </span>
            </div>
            {entries.length === 0 && (
              <p className="text-xs text-amber-600 mt-2">
                선택한 기간에 이 아이의 기록이 없어요. 다른 월을 선택해 주세요.
              </p>
            )}
          </section>

          {/* 3. 생성 */}
          <section className="bg-white rounded-2xl border border-stone-200 p-6">
            <button
              onClick={generate}
              disabled={generating || entries.length === 0}
              className="w-full sm:w-auto px-6 py-3 bg-terracotta text-white rounded-xl font-medium hover:bg-terracotta/90 disabled:bg-stone-300 disabled:cursor-not-allowed transition"
            >
              {generating
                ? "AI가 한 달치 기록을 종합하고 있어요..."
                : `${selectedKid?.kidName ?? ""} ${range.label} 리포트 생성하기`}
            </button>
            <p className="mt-3 text-xs text-stone-500 leading-relaxed">
              ※ 누적 기록을 종합한 초안입니다. 학부모님께 전달하기 전에 반드시
              선생님이 검토·수정해 주세요. 다른 아이 이름·진단 표현은 자동으로
              걸러지지만 100% 보장되지 않습니다.
            </p>
            {error && (
              <p className="mt-3 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}
          </section>

          {/* 4. 결과 */}
          {report && (
            <section className="bg-white rounded-2xl border border-stone-200 p-6">
              <div className="flex items-baseline justify-between mb-4">
                <h2 className="font-display text-lg text-stone-800">
                  {selectedKid?.kidName} · {range.label} 성장 리포트
                </h2>
                <button
                  onClick={copyAll}
                  className="text-sm px-3 py-1.5 bg-stone-800 text-white rounded-lg hover:bg-stone-700"
                >
                  {copied ? "✓ 전체 복사됨" : "전체 복사"}
                </button>
              </div>
              <div className="space-y-4">
                {SECTIONS.map(({ key, label }) => (
                  <div key={key}>
                    <h3 className="font-display text-sm text-terracotta mb-1.5">
                      {label}
                    </h3>
                    <textarea
                      value={report[key]}
                      onChange={(e) => updateSection(key, e.target.value)}
                      rows={Math.max(2, report[key].split("\n").length + 1)}
                      className="w-full text-sm leading-relaxed bg-cream/40 border border-stone-200 rounded-lg p-3 resize-none focus:outline-none focus:border-terracotta text-stone-700"
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
