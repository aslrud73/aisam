"use client";

import { useRef, useState } from "react";
import { getAuthHeaders, loadSettings } from "../lib/settings";
import { fetchErrorMessage, friendlyError } from "../lib/errorMessage";
import { SetupBanner } from "../components/SetupBanner";
import { Icon, type IconName } from "../components/Icon";
import { ParentIllust } from "../components/illustrations";
import LicenseModal from "../components/LicenseModal";
import { isLicensed } from "../lib/license";
import {
  saveParentReply,
  listParentReplies,
  deleteParentReply,
  todayISO,
} from "../lib/db";
import {
  HistorySection,
  situationLabel,
  type HistoryItem,
} from "../components/HistorySection";

type Situation =
  | "general"
  | "conflict"
  | "injury"
  | "health"
  | "development"
  | "appreciation"
  | "absence";

const SITUATIONS: { id: Situation; label: string; hint: string }[] = [
  { id: "general", label: "일반 문의", hint: "기타 질문·요청" },
  { id: "conflict", label: "친구 갈등", hint: "또래 관계 우려" },
  { id: "injury", label: "안전·다침", hint: "사고·상처 관련" },
  { id: "health", label: "식사·건강", hint: "컨디션·건강 관련" },
  { id: "development", label: "발달 우려", hint: "성장·발달 질문" },
  { id: "appreciation", label: "칭찬·감사", hint: "감사 인사" },
  { id: "absence", label: "결석·등하원", hint: "출결·시간 안내" },
];

type Tone = "warm" | "careful" | "concise";

const TONES: { id: Tone; label: string }[] = [
  { id: "warm", label: "따뜻하고 공감 가득" },
  { id: "careful", label: "신중하고 정중하게" },
  { id: "concise", label: "간결하게 핵심만" },
];

export default function ParentPage() {
  const [parentMessage, setParentMessage] = useState("");
  const [childName, setChildName] = useState("");
  const [extraContext, setExtraContext] = useState("");
  const [situation, setSituation] = useState<Situation>("general");
  const [tone, setTone] = useState<Tone>("warm");
  const [draft, setDraft] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [historyVersion, setHistoryVersion] = useState(0);
  const [licenseModalOpen, setLicenseModalOpen] = useState(false);
  const pendingAfterLicense = useRef<(() => void) | null>(null);

  async function generate() {
    if (!parentMessage.trim()) {
      setError("학부모님이 보내신 메시지를 먼저 입력해 주세요.");
      return;
    }
    if (!isLicensed()) {
      pendingAfterLicense.current = () => generate();
      setLicenseModalOpen(true);
      return;
    }
    setError(null);
    setGenerating(true);
    setDraft("");
    try {
      const res = await fetch("/api/parent", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          parentMessage,
          childName,
          extraContext,
          situation,
          tone,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? fetchErrorMessage(res.status));
      }
      const data: { draft: string } = await res.json();
      setDraft(data.draft ?? "");

      const settings = loadSettings();
      saveParentReply({
        date: todayISO(),
        childName: childName.trim() || undefined,
        parentMessage: parentMessage.trim(),
        extraContext: extraContext.trim() || undefined,
        situation,
        tone,
        draft: data.draft ?? "",
        provider: settings?.provider ?? "unknown",
        model: settings?.model ?? "unknown",
        createdAt: Date.now(),
      })
        .then(() => setHistoryVersion((v) => v + 1))
        .catch(() => {});
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setGenerating(false);
    }
  }

  async function copyDraft() {
    if (!draft) return;
    await navigator.clipboard.writeText(draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <main data-page="parent" className="max-w-4xl mx-auto px-5 py-8 pb-24 space-y-5">
      <SetupBanner />
      <div className="flex items-start gap-3">
        <span className="shrink-0">
          <ParentIllust size={40} />
        </span>
        <div>
          <h1 className="text-2xl font-semibold text-ink tracking-tight">학부모 답변 도우미</h1>
          <p className="text-sm text-ink-soft mt-1 leading-relaxed">
            학부모님 메시지에 어떻게 답할지 막막할 때, AI가 공감 + 객관적 상황 +
            교사의 다음 행동까지 갖춘 답변 초안을 만들어 드려요.
          </p>
        </div>
      </div>

      <Step icon="chat" step={1} title="학부모님이 보내신 메시지">
        <textarea
          value={parentMessage}
          onChange={(e) => setParentMessage(e.target.value)}
          placeholder="예: 우리 아이가 어제부터 어린이집 가기 싫다고 자꾸 우는데, 혹시 친구랑 무슨 일 있었나요? 선생님이 잘 살펴봐 주시는 건지 걱정이 됩니다."
          rows={5}
          className="w-full px-3.5 py-2.5 rounded-xl border border-warm-200 bg-paper text-sm leading-relaxed focus:border-mustard-400 focus:ring-2 focus:ring-mustard-100 focus:outline-none resize-none"
        />
      </Step>

      <Step icon="info" step={2} title="어떤 상황인가요?">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {SITUATIONS.map((s) => {
            const active = situation === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setSituation(s.id)}
                className={`px-3 py-2.5 rounded-xl border text-left transition ${
                  active
                    ? "bg-mustard-500 text-white border-mustard-500 shadow-sm"
                    : "bg-paper text-ink-soft border-warm-200 hover:border-warm-300 hover:bg-warm-50"
                }`}
              >
                <div className="text-sm font-medium">{s.label}</div>
                <div
                  className={`text-[11px] mt-0.5 ${
                    active ? "text-white/85" : "text-ink-muted"
                  }`}
                >
                  {s.hint}
                </div>
              </button>
            );
          })}
        </div>
      </Step>

      <Step icon="pencil" step={3} title="참고 정보 (선택)">
        <div className="space-y-3">
          <div>
            <label className="text-xs text-ink-muted mb-1 block">아이 이름</label>
            <input
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
              placeholder="예: 지우"
              className="w-full px-3.5 py-2.5 rounded-xl border border-warm-200 bg-paper text-sm focus:border-mustard-400 focus:ring-2 focus:ring-mustard-100 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-ink-muted mb-1 block">
              교사가 본 상황 / 답변에 꼭 담을 내용
            </label>
            <textarea
              value={extraContext}
              onChange={(e) => setExtraContext(e.target.value)}
              placeholder="예: 어제 점심 후 인형놀이 중 또래와 차례 다툼이 있었음. 교사가 중재하여 잘 마무리됨. 콧물도 살짝 있어 컨디션이 평소보다 떨어진 것으로 보임."
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-xl border border-warm-200 bg-paper text-sm focus:border-mustard-400 focus:ring-2 focus:ring-mustard-100 focus:outline-none resize-none"
            />
          </div>
        </div>
      </Step>

      <Step icon="sparkle" step={4} title="어떤 톤으로?">
        <div className="flex flex-wrap gap-2">
          {TONES.map((t) => {
            const active = tone === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTone(t.id)}
                className={`px-3.5 py-1.5 rounded-full border text-sm transition ${
                  active
                    ? "bg-mustard-500 text-white border-mustard-500 shadow-sm"
                    : "bg-paper text-ink-soft border-warm-200 hover:border-warm-300 hover:bg-warm-50"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </Step>

      <div className="bg-paper rounded-2xl p-6 shadow-card">
        <button
          onClick={generate}
          disabled={generating}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-mustard-500 hover:bg-mustard-600 text-white rounded-2xl font-semibold disabled:bg-warm-200 disabled:text-ink-faint disabled:cursor-not-allowed shadow-sm hover:shadow-md"
        >
          {!generating && <Icon name="sparkle" size={16} strokeWidth={2} />}
          {generating ? "AI가 답변을 다듬고 있어요..." : "답변 초안 만들기"}
        </button>
        <div className="mt-4 flex items-start gap-2 text-xs text-ink-muted leading-relaxed">
          <span className="text-warm-400 shrink-0 mt-0.5">
            <Icon name="shield" size={14} strokeWidth={1.6} />
          </span>
          <p>
            AI가 작성한 초안입니다. 학부모님께 보내기 전에 반드시 선생님이 상황과
            어조를 검토·수정해 주세요. 진단·평가적 표현, 다른 아이 이름은 자동으로
            걸러지지만 100% 보장되지 않습니다.
          </p>
        </div>
        {error && (
          <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-xl">
            {error}
          </p>
        )}
      </div>

      {draft && (
        <section className="bg-paper rounded-2xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-ink inline-flex items-center gap-2">
              <span className="text-mustard-500">
                <Icon name="check" size={18} strokeWidth={2} />
              </span>
              완성된 답변 초안
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={copyDraft}
                className="inline-flex items-center gap-1.5 text-sm px-3.5 py-2 bg-[var(--page-accent-100)] hover:bg-[var(--page-accent-200)] text-[var(--page-accent-700)] rounded-xl font-medium"
              >
                <Icon name="copy" size={14} strokeWidth={1.8} />
                {copied ? "복사됨" : "복사"}
              </button>
              <button
                onClick={() => setDraft("")}
                className="inline-flex items-center gap-1.5 text-sm px-3.5 py-2 bg-paper hover:bg-warm-50 text-ink-soft border border-warm-200 rounded-xl font-medium"
                title="결과 영역 닫기 (저장된 답변은 아래 히스토리에서 다시 볼 수 있어요)"
              >
                <Icon name="x" size={14} strokeWidth={2} />
                닫기
              </button>
            </div>
          </div>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={Math.max(8, draft.split("\n").length + 2)}
            className="w-full text-sm leading-relaxed bg-[var(--page-accent-50)] border-l-2 border-mustard-300 rounded-2xl p-4 resize-none focus:outline-none text-ink-soft"
          />
          <p className="text-xs text-ink-muted mt-3">
            내용은 직접 수정할 수 있어요. 복사 후 키즈노트·카카오톡·문자에
            붙여넣으세요.
          </p>
        </section>
      )}

      <HistorySection
        key={`parent-history-${historyVersion}`}
        title="지난 답변 기록"
        emptyMessage="아직 저장된 학부모 답변이 없어요. 답변 초안을 한 번 만들면 이곳에 자동으로 쌓입니다."
        load={async () => {
          const rows = await listParentReplies(50);
          return rows
            .filter((r): r is typeof r & { id: number } => r.id !== undefined)
            .map<HistoryItem>((r) => ({
              id: r.id,
              createdAt: r.createdAt,
              meta: [situationLabel(r.situation), r.childName?.trim() || "이름 미입력"],
              title: r.parentMessage.replace(/\s+/g, " ").slice(0, 60),
              preview: r.draft.replace(/\s+/g, " ").slice(0, 80),
              detail: [
                { label: "학부모님 메시지", text: r.parentMessage },
                ...(r.extraContext ? [{ label: "교사 참고 정보", text: r.extraContext }] : []),
                { label: "답변 초안", text: r.draft },
              ],
            }));
        }}
        onDelete={async (id) => {
          await deleteParentReply(id);
        }}
      />
      <LicenseModal
        open={licenseModalOpen}
        onClose={() => {
          setLicenseModalOpen(false);
          pendingAfterLicense.current = null;
        }}
        onSuccess={() => {
          setLicenseModalOpen(false);
          const next = pendingAfterLicense.current;
          pendingAfterLicense.current = null;
          if (next) next();
        }}
      />
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
    <section className="bg-paper rounded-2xl p-6 shadow-card">
      <div className="flex items-center gap-3 mb-4">
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-mustard-50 text-mustard-700 text-sm font-semibold tabular-nums">
          {step}
        </span>
        <span className="inline-flex items-center gap-2 text-base sm:text-lg font-semibold text-ink">
          {title}
        </span>
      </div>
      {children}
    </section>
  );
}
