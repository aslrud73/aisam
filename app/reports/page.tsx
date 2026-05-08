"use client";

import { useEffect, useMemo, useState } from "react";
import { getAuthHeaders } from "../lib/settings";
import { SetupBanner } from "../components/SetupBanner";
import { PageHeader } from "../components/PageHeader";
import { Card, StepHeader } from "../components/Card";
import { ReportIllust, EmptyIllust, DoneIllust } from "../components/illustrations";
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

const AVATAR_PALETTE = [
  "bg-coral-bg text-coral",
  "bg-sage-bg text-sage",
  "bg-mustard-bg text-mustard",
  "bg-lavender-bg text-lavender",
  "bg-navy-bg text-navy",
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
    <main className="pb-28 lg:pb-12">
      <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 pt-5 md:pt-7 space-y-5 md:space-y-6">
        <SetupBanner />
        <PageHeader
          title="월간 성장 리포트"
          description="한 달치 누적 알림장·관찰일지를 종합해서, 학부모님께 전달할 7-섹션 월간 성장 리포트를 만들어 드려요."
          accent="navy"
          illustration={<ReportIllust />}
        />

        {loading ? (
          <div className="text-center text-ink-tertiary py-16">불러오는 중...</div>
        ) : kids.length === 0 ? (
          <Card className="text-center py-12">
            <div className="flex flex-col items-center gap-3">
              <EmptyIllust size={88} />
              <p className="text-sm text-ink-secondary leading-relaxed max-w-sm">
                아직 누적된 기록이 없어요.
                <br />
                <strong className="text-ink">오늘 기록</strong>에서 알림장이나
                관찰일지를 한 번 이상 만들어야 월간 리포트를 만들 수 있어요.
              </p>
            </div>
          </Card>
        ) : (
          <>
            <Card>
              <StepHeader step={1} title="아이 선택" accent="navy" />
              <div className="flex flex-wrap gap-2">
                {kids.map((k, idx) => {
                  const active = selectedKidId === k.kidId;
                  const palette = AVATAR_PALETTE[idx % AVATAR_PALETTE.length];
                  return (
                    <button
                      key={k.kidId}
                      onClick={() => setSelectedKidId(k.kidId)}
                      className={`flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full border-2 transition-all duration-150 ${
                        active
                          ? "border-navy bg-navy text-white shadow-sm"
                          : "border-line-light bg-white text-ink hover:border-line-medium"
                      }`}
                    >
                      <span
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold ${
                          active ? "bg-white text-navy" : palette
                        }`}
                      >
                        {k.kidName.slice(0, 1)}
                      </span>
                      <span className="text-sm font-bold">{k.kidName}</span>
                      <span
                        className={`text-[11px] ${
                          active ? "text-white/80" : "text-ink-tertiary"
                        }`}
                      >
                        {k.entryCount}건
                      </span>
                    </button>
                  );
                })}
              </div>
            </Card>

            <Card>
              <StepHeader step={2} title="리포트 기간" accent="navy" />
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="month"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-line-medium focus:border-navy focus:outline-none focus:ring-3 focus:ring-navy-bg text-sm font-medium"
                />
                <span className="text-sm text-ink-secondary">
                  {range.label} · 이 기간 누적 기록{" "}
                  <strong className="text-ink">{entries.length}건</strong>
                </span>
              </div>
              {entries.length === 0 && (
                <p className="text-xs text-mustard mt-2 bg-mustard-bg px-3 py-2 rounded-lg">
                  선택한 기간에 이 아이의 기록이 없어요. 다른 월을 선택해 주세요.
                </p>
              )}
            </Card>

            <Card>
              <button
                onClick={generate}
                disabled={generating || entries.length === 0}
                className="w-full sm:w-auto px-6 py-3 bg-navy text-white rounded-xl font-extrabold text-base hover:opacity-90 hover:-translate-y-px disabled:bg-line-medium disabled:cursor-not-allowed transition-all duration-150 shadow-card"
              >
                {generating
                  ? "AI가 한 달치 기록을 종합하고 있어요..."
                  : `${selectedKid?.kidName ?? ""} ${range.label} 리포트 만들기`}
              </button>
              <p className="mt-3 text-xs text-ink-tertiary leading-relaxed">
                ※ 누적 기록을 종합한 초안입니다. 학부모님께 전달하기 전에 반드시
                선생님이 검토·수정해 주세요. 다른 아이 이름·진단 표현은 자동으로
                걸러지지만 100% 보장되지 않습니다.
              </p>
              {error && (
                <p className="mt-3 text-sm text-coral bg-coral-bg px-3 py-2 rounded-lg">
                  {error}
                </p>
              )}
            </Card>

            {report && (
              <Card className="bg-navy-bg/40 border-navy/20">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-extrabold text-[1.125rem] text-ink tracking-[-0.02em] flex items-center gap-2">
                    <DoneIllust size={28} />
                    {selectedKid?.kidName} · {range.label} 성장 리포트
                  </h2>
                  <button
                    onClick={copyAll}
                    className="text-sm px-3 py-1.5 bg-ink text-white rounded-lg hover:bg-ink-secondary font-bold transition-all duration-150"
                  >
                    {copied ? "✓ 전체 복사됨" : "전체 복사"}
                  </button>
                </div>
                <div className="space-y-4">
                  {SECTIONS.map(({ key, label }) => (
                    <div key={key}>
                      <h3 className="font-bold text-sm text-navy mb-1.5 tracking-[-0.01em]">
                        {label}
                      </h3>
                      <textarea
                        value={report[key]}
                        onChange={(e) => updateSection(key, e.target.value)}
                        rows={Math.max(2, report[key].split("\n").length + 1)}
                        className="w-full text-sm leading-relaxed bg-white border border-navy/15 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-navy-bg text-ink"
                      />
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </main>
  );
}
