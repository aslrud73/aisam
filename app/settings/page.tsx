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

const PROVIDER_DOCS: Record<ProviderId, { signupUrl: string; keyHint: string }> = {
  claude: {
    signupUrl: "https://console.anthropic.com/settings/keys",
    keyHint: "sk-ant-... 로 시작하는 키",
  },
  openai: {
    signupUrl: "https://platform.openai.com/api-keys",
    keyHint: "sk-... 로 시작하는 키",
  },
  gemini: {
    signupUrl: "https://aistudio.google.com/apikey",
    keyHint: "AIza... 로 시작하는 키",
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
    <main className="max-w-3xl mx-auto px-5 py-8 pb-24 space-y-6">
      <div>
        <h1 className="font-display text-2xl text-stone-800">설정</h1>
        <p className="text-sm text-stone-500 mt-1 leading-relaxed">
          어떤 AI를 쓸지 선택하고, 본인의 API 키를 등록해 주세요. 키는 이 기기의
          브라우저에만 저장되며, AI 호출 시에만 사용됩니다 — 저희 서버에는
          저장되지 않아요.
        </p>
      </div>

      {/* 프로바이더 선택 */}
      <section className="bg-white rounded-2xl border border-stone-200 p-6">
        <label className="font-display text-lg text-stone-800 mb-3 block">
          <span className="text-terracotta mr-2">1</span>AI 프로바이더
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {(Object.keys(PROVIDER_LABELS) as ProviderId[]).map((p) => {
            const active = provider === p;
            return (
              <button
                key={p}
                onClick={() => changeProvider(p)}
                className={`px-4 py-3 rounded-xl border text-left transition ${
                  active
                    ? "bg-terracotta text-white border-terracotta"
                    : "bg-white text-stone-700 border-stone-300 hover:border-stone-400"
                }`}
              >
                <div className="font-display text-base">{PROVIDER_LABELS[p]}</div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 모델 선택 */}
      <section className="bg-white rounded-2xl border border-stone-200 p-6">
        <label className="font-display text-lg text-stone-800 mb-3 block">
          <span className="text-terracotta mr-2">2</span>모델
        </label>
        <div className="space-y-2">
          {choices.map((c) => {
            const active = model === c.id;
            return (
              <label
                key={c.id}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition ${
                  active
                    ? "border-terracotta bg-cream/50"
                    : "border-stone-200 hover:border-stone-400"
                }`}
              >
                <input
                  type="radio"
                  name="model"
                  value={c.id}
                  checked={active}
                  onChange={() => setModel(c.id)}
                  className="accent-terracotta"
                />
                <div className="flex-1">
                  <div className="font-medium text-sm text-stone-800">{c.label}</div>
                  <div className="text-xs text-stone-500">
                    {c.id} {c.note && `· ${c.note}`}
                  </div>
                </div>
              </label>
            );
          })}
        </div>
        <details className="mt-3 text-sm">
          <summary className="text-stone-500 cursor-pointer hover:text-stone-700">
            직접 모델 ID 입력
          </summary>
          <input
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder={DEFAULT_MODELS[provider]}
            className="mt-2 w-full px-3 py-2 text-sm rounded-lg border border-stone-300 focus:border-terracotta focus:outline-none font-mono"
          />
          <p className="text-xs text-stone-500 mt-1">
            새로운 모델이 출시되었을 때 직접 입력해서 사용할 수 있어요.
          </p>
        </details>
      </section>

      {/* API 키 */}
      <section className="bg-white rounded-2xl border border-stone-200 p-6">
        <label className="font-display text-lg text-stone-800 mb-3 block">
          <span className="text-terracotta mr-2">3</span>API 키
        </label>
        <p className="text-sm text-stone-600 mb-3">
          {PROVIDER_LABELS[provider]}에서 발급받은 키를 붙여넣으세요 (
          {docs.keyHint}).
        </p>
        <div className="flex gap-2">
          <input
            type={showKey ? "text" : "password"}
            value={showKey ? apiKey : masked}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={docs.keyHint}
            className="flex-1 px-3 py-2 rounded-lg border border-stone-300 focus:border-terracotta focus:outline-none font-mono text-sm"
            autoComplete="off"
          />
          <button
            onClick={() => setShowKey((v) => !v)}
            className="px-3 py-2 text-sm border border-stone-300 rounded-lg hover:bg-stone-50"
          >
            {showKey ? "숨기기" : "보기"}
          </button>
        </div>
        <a
          href={docs.signupUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-block text-sm text-terracotta hover:underline"
        >
          → {PROVIDER_LABELS[provider]} 키 발급 페이지 열기
        </a>
      </section>

      {/* 저장 / 초기화 */}
      <section className="bg-white rounded-2xl border border-stone-200 p-6 flex flex-wrap gap-3 items-center">
        <button
          onClick={save}
          disabled={!apiKey.trim()}
          className="px-6 py-3 bg-terracotta text-white rounded-xl font-medium hover:bg-terracotta/90 disabled:bg-stone-300 disabled:cursor-not-allowed transition"
        >
          저장
        </button>
        <button
          onClick={clear}
          className="px-4 py-3 text-sm text-stone-600 hover:text-red-600"
        >
          모두 초기화
        </button>
        {savedAt && (
          <span className="text-sm text-sage">✓ 저장됨 ({savedAt})</span>
        )}
      </section>

      {/* 데이터 관리 */}
      <DataSection />

      {/* 개인정보 안내 */}
      <section className="bg-cream/60 rounded-2xl border border-stone-200 p-6 text-sm text-stone-600 leading-relaxed space-y-2">
        <h3 className="font-display text-base text-stone-800 mb-1">
          개인정보 보호 안내
        </h3>
        <ul className="space-y-1.5 list-disc pl-5">
          <li>
            API 키는 <strong>이 기기의 브라우저</strong>에만 저장됩니다 (
            <code className="bg-white px-1.5 py-0.5 rounded text-xs">
              localStorage
            </code>
            ). 저희 서버나 다른 기기에는 전송·저장되지 않아요.
          </li>
          <li>
            AI 호출 시에만 키가 서버를 거쳐 해당 AI 회사로 전달됩니다 (서버는
            단순 중계 역할만 수행).
          </li>
          <li>
            아이 이름·관찰 기록·사진 등 모든 데이터는 이 기기에만 저장됩니다.
            기기 변경 시에는 "오늘 기록" 페이지의 내보내기/가져오기 기능을
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
