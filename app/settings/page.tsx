"use client";

import { useEffect, useState } from "react";
import {
  type AISettings,
  loadSettings,
  saveSettings,
  clearSettings,
  DEFAULT_MODELS,
  MODEL_CHOICES,
  type ProviderId,
} from "../lib/settings";
import { PROVIDER_LABELS } from "../lib/providers/types";
import { DataSection } from "../components/DataSection";
import { Icon } from "../components/Icon";

const PROVIDER_DOCS: Record<
  ProviderId,
  {
    signupUrl: string;
    keyHint: string;
    walkthrough: string[];
    pricing: string;
  }
> = {
  claude: {
    signupUrl: "https://console.anthropic.com/settings/keys",
    keyHint: "sk-ant-... 로 시작하는 키",
    walkthrough: [
      "아래 '키 발급 페이지 열기' 버튼을 누르면 Anthropic 콘솔이 열려요.",
      "구글 계정 또는 이메일로 가입(또는 로그인)하세요.",
      "왼쪽 메뉴에서 'API Keys'를 누르고 'Create Key' 버튼을 눌러요.",
      "키 이름은 자유롭게 ('오늘알림장' 등) — 만들어진 키를 한 번에 복사해서 아래에 붙여넣으세요.",
      "주의: 키는 만든 직후 한 번만 보여요. 다른 곳에 저장하지 말고 바로 붙여넣으세요.",
    ],
    pricing:
      "처음 가입 시 약간의 무료 크레딧이 제공돼요. 이후엔 사용한 만큼만 결제 — 한 반(20명) 알림장 매일 작성해도 보통 한 달 1,000~3,000원 수준이에요.",
  },
  openai: {
    signupUrl: "https://platform.openai.com/api-keys",
    keyHint: "sk-... 로 시작하는 키",
    walkthrough: [
      "아래 '키 발급 페이지 열기' 버튼을 누르면 OpenAI 플랫폼이 열려요.",
      "구글 계정 또는 이메일로 가입(또는 로그인)하세요.",
      "오른쪽 위 'Create new secret key' 버튼을 누르고, 키 이름을 자유롭게 입력해요.",
      "만들어진 키를 한 번에 복사해서 아래에 붙여넣으세요.",
      "주의: 키는 만든 직후 한 번만 보여요. 결제 정보 등록 후 사용 가능해요.",
    ],
    pricing:
      "사용한 만큼만 결제. 한 반(20명) 알림장 매일 작성 기준 한 달 2,000~5,000원 수준이에요. 모델에 따라 비용이 달라져요.",
  },
  gemini: {
    signupUrl: "https://aistudio.google.com/apikey",
    keyHint: "AIza... 로 시작하는 키",
    walkthrough: [
      "아래 '키 발급 페이지 열기' 버튼을 누르면 Google AI Studio가 열려요.",
      "구글 계정으로 로그인하세요.",
      "'Create API key' 버튼을 누르면 키가 바로 만들어져요.",
      "키를 복사해서 아래에 붙여넣으세요.",
      "Gemini는 무료 티어가 가장 넉넉해요. 일정 사용량까지는 무료로 사용 가능합니다.",
    ],
    pricing:
      "구글 Gemini는 무료 티어가 가장 넉넉해요. 일반적인 교사 사용량은 거의 무료 안에서 해결되는 편입니다.",
  },
};

export default function SettingsPage() {
  const [provider, setProvider] = useState<ProviderId>("claude");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState(DEFAULT_MODELS.claude);
  const [showKey, setShowKey] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const s = loadSettings();
    if (s) {
      setProvider(s.provider);
      setApiKey(s.apiKey);
      setModel(s.model);
    }
    setHydrated(true);
  }, []);

  function changeProvider(p: ProviderId) {
    setProvider(p);
    // If switching providers, the previous model may not exist for the new one.
    if (!MODEL_CHOICES[p].some((m) => m.id === model)) {
      setModel(DEFAULT_MODELS[p]);
    }
    // Clear API key on provider switch — the key is provider-specific.
    setApiKey("");
  }

  function save() {
    const s: AISettings = {
      provider,
      apiKey: apiKey.trim(),
      model: model.trim() || DEFAULT_MODELS[provider],
    };
    saveSettings(s);
    setSavedAt(new Date().toLocaleTimeString("ko-KR"));
    setTimeout(() => setSavedAt(null), 3000);
  }

  function clear() {
    if (!confirm("API 키와 설정을 모두 지울까요? (다시 입력해야 사용할 수 있어요)")) return;
    clearSettings();
    setApiKey("");
    setProvider("claude");
    setModel(DEFAULT_MODELS.claude);
  }

  const docs = PROVIDER_DOCS[provider];
  const choices = MODEL_CHOICES[provider];
  const masked =
    apiKey && !showKey
      ? apiKey.slice(0, 4) + "•".repeat(Math.max(0, apiKey.length - 8)) + apiKey.slice(-4)
      : apiKey;

  if (!hydrated) return null;

  return (
    <main className="max-w-3xl mx-auto px-5 py-8 pb-24 space-y-5">
      <div className="flex items-start gap-3">
        <span className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-terracotta-50 text-terracotta-600 shrink-0">
          <Icon name="settings" size={20} strokeWidth={1.7} />
        </span>
        <div>
          <h1 className="text-2xl font-semibold text-ink tracking-tight">설정</h1>
          <p className="text-sm text-ink-soft mt-1 leading-relaxed">
            어떤 AI를 쓸지 선택하고, 본인의 API 키를 등록해 주세요. 키는 이 기기의
            브라우저에만 저장되고, AI 호출 시에만 사용돼요.
          </p>
        </div>
      </div>

      {/* API 처음 사용 안내 */}
      <details className="bg-cream-100 border border-warm-100 rounded-2xl shadow-card group">
        <summary className="cursor-pointer list-none px-5 py-4 flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2.5">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-paper text-terracotta-600">
              <Icon name="info" size={18} strokeWidth={1.7} />
            </span>
            <span className="font-semibold text-ink">
              API가 뭐예요? 처음이라면 꼭 한 번 읽어주세요
            </span>
          </span>
          <span className="text-xs text-ink-muted shrink-0 group-open:rotate-180 transition">
            ▾
          </span>
        </summary>
        <div className="px-5 pb-5 pt-1 text-sm text-ink-soft leading-relaxed space-y-3">
          <div>
            <p className="font-medium text-ink mb-1">한 줄 요약</p>
            <p>
              API 키는 <strong>AI 회사에서 발급받는 비밀번호</strong>예요. 이 키가
              있어야 선생님 본인의 AI 사용량으로 알림장을 만들 수 있어요.
            </p>
          </div>
          <div>
            <p className="font-medium text-ink mb-1">왜 직접 등록해야 하나요?</p>
            <p>
              저희가 키를 가지고 있다면 사용량을 통제할 수 없고 비용을 받아야
              해요. 선생님이 직접 등록하면 <strong>본인 키만 사용</strong>되니까
              안전하고, 다른 선생님과 분리되어 누가 어떤 알림장을 썼는지도
              들여다볼 수 없어요.
            </p>
          </div>
          <div>
            <p className="font-medium text-ink mb-1">비용은 얼마나 나오나요?</p>
            <p>
              AI 회사에서는 <strong>실제 사용한 만큼만</strong> 청구해요.
              선생님 한 분이 한 반(20명) 알림장을 매일 만들어도 한 달
              1,000~5,000원 정도예요. 구글 Gemini는 무료 티어가 넉넉해서 그 범위
              안이라면 거의 무료로 쓸 수 있어요.
            </p>
          </div>
          <div>
            <p className="font-medium text-ink mb-1">키는 안전한가요?</p>
            <p>
              키는 이 기기의 브라우저에만 저장되고, 저희 서버에는 절대
              저장되지 않아요. AI 호출 시에만 키가 잠깐 서버를 거쳐 해당 AI
              회사로 전달되고, 즉시 폐기돼요. 키가 노출됐다 싶으면 AI 회사
              사이트에서 한 번에 지우고 새로 만들 수 있어요.
            </p>
          </div>
        </div>
      </details>

      {/* 프로바이더 선택 */}
      <Step icon="sparkle" step={1} title="AI 프로바이더 선택">
        <p className="text-sm text-ink-soft mb-3 leading-relaxed">
          어느 회사의 AI를 사용할지 골라 주세요. 처음이시라면{" "}
          <strong className="text-ink">Gemini (Google)</strong>가 무료 티어가
          넉넉해서 추천드려요.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {(Object.keys(PROVIDER_LABELS) as ProviderId[]).map((p) => {
            const active = provider === p;
            return (
              <button
                key={p}
                onClick={() => changeProvider(p)}
                className={`px-4 py-3 rounded-xl border text-left transition ${
                  active
                    ? "bg-terracotta-500 text-white border-terracotta-500 shadow-sm"
                    : "bg-paper text-ink-soft border-warm-200 hover:border-warm-300 hover:bg-warm-50"
                }`}
              >
                <div className="text-base font-semibold">{PROVIDER_LABELS[p]}</div>
              </button>
            );
          })}
        </div>
      </Step>

      {/* 모델 선택 */}
      <Step icon="sparkle" step={2} title="모델 선택">
        <p className="text-sm text-ink-soft mb-3 leading-relaxed">
          모델은 AI의 종류예요. 좋은 모델일수록 자연스러운 문장을 쓰지만 비용이
          조금 더 나와요. 추천 모델로 시작하시면 충분합니다.
        </p>
        <div className="space-y-2">
          {choices.map((c) => {
            const active = model === c.id;
            return (
              <label
                key={c.id}
                className={`flex items-center gap-3 px-3.5 py-3 rounded-xl border cursor-pointer transition ${
                  active
                    ? "border-terracotta-300 bg-cream-100"
                    : "border-warm-200 hover:border-warm-300 hover:bg-warm-50"
                }`}
              >
                <input
                  type="radio"
                  name="model"
                  value={c.id}
                  checked={active}
                  onChange={() => setModel(c.id)}
                  className="accent-terracotta-500 w-4 h-4"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-ink">{c.label}</div>
                  <div className="text-xs text-ink-muted truncate">
                    {c.id}
                    {c.note && ` · ${c.note}`}
                  </div>
                </div>
              </label>
            );
          })}
        </div>
        <details className="mt-3 text-sm">
          <summary className="text-ink-muted cursor-pointer hover:text-ink-soft select-none">
            직접 모델 ID 입력 (고급)
          </summary>
          <input
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder={DEFAULT_MODELS[provider]}
            className="mt-2 w-full px-3.5 py-2.5 text-sm rounded-xl border border-warm-200 bg-paper focus:border-terracotta-400 focus:ring-2 focus:ring-terracotta-100 focus:outline-none font-mono"
          />
          <p className="text-xs text-ink-muted mt-1.5">
            새로운 모델이 출시되었을 때 직접 입력해서 사용할 수 있어요.
          </p>
        </details>
      </Step>

      {/* API 키 + 발급 가이드 */}
      <Step icon="key" step={3} title="API 키 등록">
        <div className="bg-cream-100 rounded-2xl p-4 mb-4 border border-warm-100">
          <p className="text-sm font-semibold text-ink mb-2 inline-flex items-center gap-1.5">
            <span className="text-terracotta-600">
              <Icon name="info" size={14} strokeWidth={1.8} />
            </span>
            {PROVIDER_LABELS[provider]} 키 받는 법
          </p>
          <ol className="text-sm text-ink-soft leading-relaxed space-y-1.5 list-decimal pl-5">
            {docs.walkthrough.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
          <p className="text-xs text-ink-muted mt-3 leading-relaxed">
            <strong className="text-ink-soft">비용 안내</strong> · {docs.pricing}
          </p>
          <a
            href={docs.signupUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-terracotta-700 hover:text-terracotta-800"
          >
            <Icon name="link" size={14} strokeWidth={2} />
            {PROVIDER_LABELS[provider]} 키 발급 페이지 열기
          </a>
        </div>

        <div className="flex gap-2">
          <input
            type={showKey ? "text" : "password"}
            value={showKey ? apiKey : masked}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={docs.keyHint}
            className="flex-1 px-3.5 py-2.5 rounded-xl border border-warm-200 bg-paper text-sm font-mono focus:border-terracotta-400 focus:ring-2 focus:ring-terracotta-100 focus:outline-none"
            autoComplete="off"
          />
          <button
            onClick={() => setShowKey((v) => !v)}
            className="px-3 py-2.5 text-sm border border-warm-200 rounded-xl hover:bg-warm-50 text-ink-soft"
          >
            {showKey ? "숨기기" : "보기"}
          </button>
        </div>
      </Step>

      <section className="bg-paper rounded-2xl border border-warm-100 p-6 shadow-card flex flex-wrap gap-3 items-center">
        <button
          onClick={save}
          disabled={!apiKey.trim()}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-2xl font-semibold disabled:bg-warm-200 disabled:text-ink-faint disabled:cursor-not-allowed shadow-sm hover:shadow-md"
        >
          <Icon name="check" size={16} strokeWidth={2} />
          저장
        </button>
        <button
          onClick={clear}
          className="px-4 py-3 text-sm text-ink-muted hover:text-red-600"
        >
          모두 초기화
        </button>
        {savedAt && (
          <span className="text-sm text-sage-600 inline-flex items-center gap-1">
            <Icon name="check" size={14} strokeWidth={2} />
            저장됨 ({savedAt})
          </span>
        )}
      </section>

      <DataSection />

      <section className="bg-cream-100 rounded-2xl border border-warm-100 p-6 text-sm text-ink-soft leading-relaxed space-y-2 shadow-card">
        <h3 className="text-base font-semibold text-ink mb-2 inline-flex items-center gap-2">
          <span className="text-sage-500">
            <Icon name="shield" size={16} strokeWidth={1.8} />
          </span>
          개인정보 보호 안내
        </h3>
        <ul className="space-y-1.5 list-disc pl-5">
          <li>
            API 키는 <strong>이 기기의 브라우저</strong>에만 저장돼요 (
            <code className="bg-paper px-1.5 py-0.5 rounded text-xs border border-warm-100">
              localStorage
            </code>
            ). 저희 서버나 다른 기기에는 전송·저장되지 않아요.
          </li>
          <li>
            AI 호출 시에만 키가 서버를 거쳐 해당 AI 회사로 전달돼요 (서버는
            단순 중계 역할만 수행).
          </li>
          <li>
            아이 이름·관찰 기록·사진 등 모든 데이터는 이 기기에만 저장돼요.
            기기 변경 시에는 위 데이터 관리에서 내보내기/가져오기를
            사용해 주세요.
          </li>
          <li>
            공용 PC에서는 작업 후 반드시 "모두 초기화"로 키를 지워주세요.
          </li>
        </ul>
      </section>
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
  icon: React.ComponentProps<typeof Icon>["name"];
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
