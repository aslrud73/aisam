"use client";

import { useState } from "react";

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
        headers: { "Content-Type": "application/json" },
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
    <main className="max-w-3xl mx-auto px-5 py-8 pb-24 space-y-6">
      <div>
        <h1 className="font-display text-2xl text-stone-800">학부모 답변 도우미</h1>
        <p className="text-sm text-stone-500 mt-1 leading-relaxed">
          학부모님 메시지에 어떻게 답할지 막막할 때, AI가 공감 + 객관적 상황 +
          교사의 다음 행동까지 갖춘 답변 초안을 만들어 드려요.
        </p>
      </div>

      {/* 1. 학부모 메시지 */}
      <section className="bg-white rounded-2xl border border-stone-200 p-6">
        <label className="font-display text-lg text-stone-800 mb-3 block">
          <span className="text-terracotta mr-2">1</span>학부모님이 보내신 메시지
        </label>
        <textarea
          value={parentMessage}
          onChange={(e) => setParentMessage(e.target.value)}
          placeholder="예: 우리 아이가 어제부터 어린이집 가기 싫다고 자꾸 우는데, 혹시 친구랑 무슨 일 있었나요? 선생님이 잘 살펴봐 주시는 건지 걱정이 됩니다."
          rows={5}
          className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:border-terracotta focus:outline-none text-sm leading-relaxed"
        />
      </section>

      {/* 2. 상황 분류 */}
      <section className="bg-white rounded-2xl border border-stone-200 p-6">
        <label className="font-display text-lg text-stone-800 mb-3 block">
          <span className="text-terracotta mr-2">2</span>어떤 상황인가요?
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {SITUATIONS.map((s) => {
            const active = situation === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setSituation(s.id)}
                className={`px-3 py-2.5 rounded-lg border text-left transition ${
                  active
                    ? "bg-sage text-white border-sage"
                    : "bg-white text-stone-700 border-stone-200 hover:border-stone-400"
                }`}
              >
                <div className="text-sm font-medium">{s.label}</div>
                <div
                  className={`text-[11px] mt-0.5 ${
                    active ? "text-white/80" : "text-stone-500"
                  }`}
                >
                  {s.hint}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. 보충 정보 */}
      <section className="bg-white rounded-2xl border border-stone-200 p-6">
        <label className="font-display text-lg text-stone-800 mb-3 block">
          <span className="text-terracotta mr-2">3</span>참고 정보 (선택)
        </label>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-stone-500 mb-1 block">아이 이름</label>
            <input
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
              placeholder="예: 지우"
              className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:border-terracotta focus:outline-none text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-stone-500 mb-1 block">
              교사가 본 상황 / 답변에 꼭 담을 내용
            </label>
            <textarea
              value={extraContext}
              onChange={(e) => setExtraContext(e.target.value)}
              placeholder="예: 어제 점심 후 인형놀이 중 또래와 차례 다툼이 있었음. 교사가 중재하여 잘 마무리됨. 콧물도 살짝 있어 컨디션이 평소보다 떨어진 것으로 보임."
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:border-terracotta focus:outline-none text-sm"
            />
          </div>
        </div>
      </section>

      {/* 4. 톤 */}
      <section className="bg-white rounded-2xl border border-stone-200 p-6">
        <label className="font-display text-lg text-stone-800 mb-3 block">
          <span className="text-terracotta mr-2">4</span>어떤 톤으로?
        </label>
        <div className="flex flex-wrap gap-2">
          {TONES.map((t) => {
            const active = tone === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTone(t.id)}
                className={`px-3 py-1.5 rounded-full border text-sm transition ${
                  active
                    ? "bg-terracotta text-white border-terracotta"
                    : "bg-white text-stone-700 border-stone-300 hover:border-stone-400"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Generate */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6">
        <button
          onClick={generate}
          disabled={generating}
          className="w-full sm:w-auto px-6 py-3 bg-terracotta text-white rounded-xl font-medium hover:bg-terracotta/90 disabled:bg-stone-300 disabled:cursor-not-allowed transition"
        >
          {generating ? "AI가 답변을 다듬고 있어요..." : "답변 초안 만들기"}
        </button>
        <p className="mt-3 text-xs text-stone-500 leading-relaxed">
          ※ AI가 작성한 초안입니다. 학부모님께 보내기 전에 반드시 선생님이
          상황과 어조를 검토·수정해 주세요. 진단·평가적 표현, 다른 아이 이름은
          자동으로 걸러지지만 100% 보장되지 않습니다.
        </p>
        {error && (
          <p className="mt-3 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
            {error}
          </p>
        )}
      </div>

      {/* Result */}
      {draft && (
        <section className="bg-white rounded-2xl border border-stone-200 p-6">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="font-display text-lg text-stone-800">완성된 답변 초안</h2>
            <button
              onClick={copyDraft}
              className="text-sm px-3 py-1.5 bg-stone-800 text-white rounded-lg hover:bg-stone-700"
            >
              {copied ? "✓ 복사됨" : "복사"}
            </button>
          </div>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={Math.max(8, draft.split("\n").length + 2)}
            className="w-full text-sm leading-relaxed bg-cream/40 border border-stone-200 rounded-xl p-4 resize-none focus:outline-none focus:border-terracotta text-stone-700"
          />
          <p className="text-xs text-stone-500 mt-3">
            내용은 직접 수정할 수 있어요. 복사 후 키즈노트·카카오톡·문자에
            붙여넣으세요.
          </p>
        </section>
      )}
    </main>
  );
}
