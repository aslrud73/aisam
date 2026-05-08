"use client";

import { useState } from "react";
import { getAuthHeaders, loadSettings } from "../lib/settings";
import { SetupBanner } from "../components/SetupBanner";
import { PageHeader } from "../components/PageHeader";
import { Card, StepHeader } from "../components/Card";
import { ParentIllust, DoneIllust } from "../components/illustrations";
import { saveParentReply, todayISO } from "../lib/db";

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

  async function generate() {
    if (!parentMessage.trim()) {
      setError("학부모님이 보내신 메시지를 먼저 입력해 주세요.");
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
        throw new Error(body.error ?? `요청 실패 (${res.status})`);
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
      }).catch(() => {});
    } catch (e) {
      setError(e instanceof Error ? e.message : "알 수 없는 오류");
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
    <main className="pb-28 lg:pb-12">
      <div className="max-w-3xl mx-auto px-4 md:px-6 lg:px-8 pt-5 md:pt-7 space-y-5 md:space-y-6">
        <SetupBanner />
        <PageHeader
          title="학부모 답변 도우미"
          description="학부모님 메시지에 어떻게 답할지 막막할 때, 공감·객관 상황·다음 행동까지 갖춘 답변 초안을 만들어 드려요."
          accent="mustard"
          illustration={<ParentIllust />}
        />

        <Card>
          <StepHeader
            step={1}
            title="학부모님이 보내신 메시지"
            accent="mustard"
          />
          <textarea
            value={parentMessage}
            onChange={(e) => setParentMessage(e.target.value)}
            placeholder="예: 우리 아이가 어제부터 어린이집 가기 싫다고 자꾸 우는데, 혹시 친구랑 무슨 일 있었나요? 선생님이 잘 살펴봐 주시는 건지 걱정이 됩니다."
            rows={5}
            className="w-full px-3 py-2.5 rounded-lg border border-line-medium focus:border-mustard focus:outline-none focus:ring-3 focus:ring-mustard-bg text-sm leading-relaxed"
          />
        </Card>

        <Card>
          <StepHeader step={2} title="어떤 상황인가요?" accent="mustard" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {SITUATIONS.map((s) => {
              const active = situation === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setSituation(s.id)}
                  className={`px-3 py-2.5 rounded-xl border-2 text-left transition-all duration-150 ${
                    active
                      ? "bg-mustard text-white border-mustard shadow-sm"
                      : "bg-white text-ink border-line-light hover:border-line-medium"
                  }`}
                >
                  <div className="text-sm font-bold">{s.label}</div>
                  <div
                    className={`text-[11px] mt-0.5 ${
                      active ? "text-white/80" : "text-ink-tertiary"
                    }`}
                  >
                    {s.hint}
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        <Card>
          <StepHeader step={3} title="참고 정보 (선택)" accent="mustard" />
          <div className="space-y-3">
            <div>
              <label className="text-xs text-ink-tertiary mb-1 block font-semibold">
                아이 이름
              </label>
              <input
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                placeholder="예: 지우"
                className="w-full px-3 py-2 rounded-lg border border-line-medium focus:border-mustard focus:outline-none focus:ring-3 focus:ring-mustard-bg text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-ink-tertiary mb-1 block font-semibold">
                교사가 본 상황 / 답변에 꼭 담을 내용
              </label>
              <textarea
                value={extraContext}
                onChange={(e) => setExtraContext(e.target.value)}
                placeholder="예: 어제 점심 후 인형놀이 중 또래와 차례 다툼이 있었음. 교사가 중재하여 잘 마무리됨. 콧물도 살짝 있어 컨디션이 평소보다 떨어진 것으로 보임."
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-line-medium focus:border-mustard focus:outline-none focus:ring-3 focus:ring-mustard-bg text-sm"
              />
            </div>
          </div>
        </Card>

        <Card>
          <StepHeader step={4} title="어떤 톤으로?" accent="mustard" />
          <div className="flex flex-wrap gap-2">
            {TONES.map((t) => {
              const active = tone === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTone(t.id)}
                  className={`px-3 py-1.5 rounded-full border text-sm transition-all duration-150 font-medium ${
                    active
                      ? "bg-mustard text-white border-mustard"
                      : "bg-white text-ink-secondary border-line-medium hover:border-line-strong"
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </Card>

        <Card>
          <button
            onClick={generate}
            disabled={generating}
            className="w-full sm:w-auto px-6 py-3 bg-mustard text-white rounded-xl font-extrabold text-base hover:bg-mustard-light hover:-translate-y-px disabled:bg-line-medium disabled:cursor-not-allowed transition-all duration-150 shadow-card"
          >
            {generating ? "AI가 답변을 다듬고 있어요..." : "답변 초안 만들기"}
          </button>
          <p className="mt-3 text-xs text-ink-tertiary leading-relaxed">
            ※ AI가 작성한 초안입니다. 학부모님께 보내기 전에 반드시 선생님이
            상황과 어조를 검토·수정해 주세요. 진단·평가적 표현, 다른 아이 이름은
            자동으로 걸러지지만 100% 보장되지 않습니다.
          </p>
          {error && (
            <p className="mt-3 text-sm text-coral bg-coral-bg px-3 py-2 rounded-lg">
              {error}
            </p>
          )}
        </Card>

        {draft && (
          <Card className="bg-mustard-bg/40 border-mustard-light/40">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-extrabold text-[1.125rem] text-ink tracking-[-0.02em] flex items-center gap-2">
                <DoneIllust size={28} />
                완성된 답변 초안
              </h2>
              <button
                onClick={copyDraft}
                className="text-sm px-3 py-1.5 bg-ink text-white rounded-lg hover:bg-ink-secondary font-bold transition-all duration-150"
              >
                {copied ? "✓ 복사됨" : "복사"}
              </button>
            </div>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={Math.max(8, draft.split("\n").length + 2)}
              className="w-full text-sm leading-relaxed bg-white border border-mustard-light/30 rounded-xl p-4 resize-none focus:outline-none focus:ring-2 focus:ring-mustard-bg text-ink"
            />
            <p className="text-xs text-ink-tertiary mt-3">
              내용은 직접 수정할 수 있어요. 복사 후 키즈노트·카카오톡·문자에
              붙여넣으세요.
            </p>
          </Card>
        )}
      </div>
    </main>
  );
}
