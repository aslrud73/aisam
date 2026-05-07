"use client";

import { useEffect, useState } from "react";
import { getAuthHeaders, loadSettings } from "./lib/settings";
import { SetupBanner } from "./components/SetupBanner";
import { saveDailyEntries, todayISO, type DailyEntryRecord } from "./lib/db";

type MealStatus = "잘먹음" | "보통" | "안먹음" | "";
type MoodStatus = "좋음" | "보통" | "안좋음" | "";
type NapStatus = "푹잠" | "뒤척임" | "안잠" | "";

interface Child {
  id: string;
  name: string;
}

interface DailyEntry {
  childId: string;
  meal: MealStatus;
  mood: MoodStatus;
  nap: NapStatus;
  memo: string;
}

interface GeneratedNote {
  childId: string;
  text: string;
}

const STORAGE_KEY = "oneul-notification-state-v2";

type DocType = "alrim" | "gwanchal";
type ToneStyle = "warm" | "concise" | "detailed";

interface PersistedState {
  className: string;
  children: Child[];
  todayActivity: string;
  entries: Record<string, DailyEntry>;
  tone: ToneStyle;
  docType: DocType;
}

const DOC_LABELS: Record<DocType, { name: string; sub: string }> = {
  alrim: {
    name: "알림장",
    sub: "매일 학부모님께 보내는 일일 기록",
  },
  gwanchal: {
    name: "관찰일지",
    sub: "누리과정 영역과 연계된 전문 기록",
  },
};

const TONE_LABELS: Record<DocType, Record<ToneStyle, string>> = {
  alrim: {
    warm: "따뜻하고 정성스럽게",
    concise: "간결하고 깔끔하게",
    detailed: "자세하고 풍부하게",
  },
  gwanchal: {
    warm: "전문적이되 따뜻하게",
    concise: "객관적이고 간결하게",
    detailed: "상세하고 풍부하게",
  },
};

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function emptyEntry(childId: string): DailyEntry {
  return { childId, meal: "", mood: "", nap: "", memo: "" };
}

export default function Page() {
  const [className, setClassName] = useState("햇살반");
  const [children, setChildren] = useState<Child[]>([]);
  const [todayActivity, setTodayActivity] = useState("");
  const [entries, setEntries] = useState<Record<string, DailyEntry>>({});
  const [tone, setTone] = useState<ToneStyle>("warm");
  const [docType, setDocType] = useState<DocType>("alrim");
  const [newName, setNewName] = useState("");
  const [bulkInput, setBulkInput] = useState("");
  const [generating, setGenerating] = useState(false);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: PersistedState = JSON.parse(raw);
        setClassName(parsed.className ?? "햇살반");
        setChildren(parsed.children ?? []);
        setTodayActivity(parsed.todayActivity ?? "");
        setEntries(parsed.entries ?? {});
        setTone(parsed.tone ?? "warm");
        setDocType(parsed.docType ?? "alrim");
      }
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const state: PersistedState = {
      className,
      children,
      todayActivity,
      entries,
      tone,
      docType,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [hydrated, className, children, todayActivity, entries, tone, docType]);

  function addChild(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    const id = uid();
    setChildren((prev) => [...prev, { id, name: trimmed }]);
    setEntries((prev) => ({ ...prev, [id]: emptyEntry(id) }));
  }

  function addBulk() {
    const names = bulkInput
      .split(/[\n,]/)
      .map((n) => n.trim())
      .filter(Boolean);
    if (names.length === 0) return;
    const newChildren: Child[] = names.map((name) => ({ id: uid(), name }));
    setChildren((prev) => [...prev, ...newChildren]);
    setEntries((prev) => {
      const next = { ...prev };
      for (const c of newChildren) next[c.id] = emptyEntry(c.id);
      return next;
    });
    setBulkInput("");
  }

  function removeChild(id: string) {
    setChildren((prev) => prev.filter((c) => c.id !== id));
    setEntries((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setNotes((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  function updateEntry(id: string, patch: Partial<DailyEntry>) {
    setEntries((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? emptyEntry(id)), ...patch },
    }));
  }

  function clearToday() {
    if (!confirm("오늘 입력한 모든 내용을 지울까요? (아이 명단은 유지됩니다)"))
      return;
    setTodayActivity("");
    const fresh: Record<string, DailyEntry> = {};
    for (const c of children) fresh[c.id] = emptyEntry(c.id);
    setEntries(fresh);
    setNotes({});
  }

  async function generate() {
    if (children.length === 0) {
      setError("먼저 아이들을 등록해 주세요.");
      return;
    }
    setError(null);
    setGenerating(true);
    setNotes({});
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          className,
          todayActivity,
          tone,
          docType,
          children: children.map((c) => ({
            id: c.id,
            name: c.name,
            entry: entries[c.id] ?? emptyEntry(c.id),
          })),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `요청 실패 (${res.status})`);
      }
      const data: { notes: GeneratedNote[] } = await res.json();
      const map: Record<string, string> = {};
      for (const n of data.notes) map[n.childId] = n.text;
      setNotes(map);

      // Persist to IndexedDB so monthly reports / export have the history
      const settings = loadSettings();
      const date = todayISO();
      const records: DailyEntryRecord[] = [];
      for (const n of data.notes) {
        const child = children.find((c) => c.id === n.childId);
        if (!child) continue;
        const e = entries[child.id];
        records.push({
          kidId: child.id,
          kidName: child.name,
          className,
          date,
          todayActivity,
          meal: e?.meal || undefined,
          mood: e?.mood || undefined,
          nap: e?.nap || undefined,
          memo: e?.memo || undefined,
          docType,
          text: n.text,
          provider: settings?.provider ?? "unknown",
          model: settings?.model ?? "unknown",
          createdAt: Date.now(),
        });
      }
      saveDailyEntries(records).catch(() => {
        // Don't surface DB errors — generation already succeeded.
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "알 수 없는 오류");
    } finally {
      setGenerating(false);
    }
  }

  async function copy(childId: string) {
    const text = notes[childId];
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopiedId(childId);
    setTimeout(() => setCopiedId((prev) => (prev === childId ? null : prev)), 1500);
  }

  async function copyAll() {
    if (children.length === 0) return;
    const lines = children
      .filter((c) => notes[c.id])
      .map((c) => `[${c.name}]\n${notes[c.id]}`)
      .join("\n\n―――\n\n");
    if (!lines) return;
    await navigator.clipboard.writeText(lines);
    setCopiedId("ALL");
    setTimeout(() => setCopiedId((prev) => (prev === "ALL" ? null : prev)), 1500);
  }

  const hasAnyEntry = children.some((c) => {
    const e = entries[c.id];
    return e && (e.meal || e.mood || e.nap || e.memo);
  });

  return (
    <main className="min-h-screen pb-24">
      <div className="max-w-5xl mx-auto px-5 pt-6 space-y-4">
        <SetupBanner />
        {/* Class name */}
        <div className="flex items-center justify-between">
          <h1 className="font-display text-xl text-stone-800">오늘 기록</h1>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-stone-500">반 이름</span>
            <input
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-stone-300 bg-white w-28 focus:border-terracotta focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-5 pt-6 space-y-8">
        {/* Mode switcher */}
        <div className="bg-white rounded-2xl border border-stone-200 p-2 grid grid-cols-2 gap-2">
          {(Object.keys(DOC_LABELS) as DocType[]).map((d) => {
            const active = docType === d;
            const info = DOC_LABELS[d];
            return (
              <button
                key={d}
                onClick={() => setDocType(d)}
                className={`text-left px-4 py-3 rounded-xl transition ${
                  active
                    ? "bg-terracotta text-white"
                    : "bg-transparent text-stone-700 hover:bg-stone-50"
                }`}
              >
                <div className="font-display text-base">{info.name}</div>
                <div
                  className={`text-xs mt-0.5 ${
                    active ? "text-white/80" : "text-stone-500"
                  }`}
                >
                  {info.sub}
                </div>
              </button>
            );
          })}
        </div>

        {/* Step 1: 아이 명단 */}
        <section className="bg-white rounded-2xl border border-stone-200 p-6">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="font-display text-lg text-stone-800">
              <span className="text-terracotta mr-2">1</span>우리 반 아이들
            </h2>
            <span className="text-sm text-stone-500">
              {children.length}명 등록됨
            </span>
          </div>

          {children.length === 0 ? (
            <div className="text-center py-8 text-stone-400 text-sm">
              아래에서 아이 이름을 추가해 주세요. 한 번 등록하면 매일 다시
              입력할 필요가 없어요.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 mb-4">
              {children.map((c) => (
                <span
                  key={c.id}
                  className="group inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 rounded-full text-sm"
                >
                  {c.name}
                  <button
                    onClick={() => removeChild(c.id)}
                    className="text-stone-400 hover:text-red-500 text-xs"
                    aria-label={`${c.name} 삭제`}
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex gap-2 flex-1">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    addChild(newName);
                    setNewName("");
                  }
                }}
                placeholder="이름 입력 후 Enter"
                className="flex-1 px-3 py-2 rounded-lg border border-stone-300 focus:border-terracotta focus:outline-none"
              />
              <button
                onClick={() => {
                  addChild(newName);
                  setNewName("");
                }}
                className="px-4 py-2 bg-stone-800 text-white rounded-lg hover:bg-stone-700 text-sm whitespace-nowrap"
              >
                추가
              </button>
            </div>
          </div>
          <details className="mt-3 text-sm">
            <summary className="text-stone-500 cursor-pointer hover:text-stone-700">
              여러 명 한 번에 등록
            </summary>
            <div className="mt-2 flex gap-2">
              <textarea
                value={bulkInput}
                onChange={(e) => setBulkInput(e.target.value)}
                placeholder="이름들을 줄바꿈 또는 쉼표로 구분"
                rows={3}
                className="flex-1 px-3 py-2 rounded-lg border border-stone-300 focus:border-terracotta focus:outline-none text-sm"
              />
              <button
                onClick={addBulk}
                className="px-4 py-2 bg-stone-200 text-stone-800 rounded-lg hover:bg-stone-300 text-sm self-start"
              >
                일괄 추가
              </button>
            </div>
          </details>
        </section>

        {/* Step 2: 오늘의 활동 */}
        <section className="bg-white rounded-2xl border border-stone-200 p-6">
          <h2 className="font-display text-lg text-stone-800 mb-4">
            <span className="text-terracotta mr-2">2</span>오늘의 활동
          </h2>
          <textarea
            value={todayActivity}
            onChange={(e) => setTodayActivity(e.target.value)}
            placeholder="예: 봄꽃 그리기 미술활동을 했고, 바깥놀이로 모래놀이를 했어요. 점심은 닭볶음탕."
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:border-terracotta focus:outline-none"
          />
          <p className="text-xs text-stone-500 mt-2">
            한 번 입력하면 모든 아이의 알림장에 자연스럽게 반영돼요.
          </p>
        </section>

        {/* Step 3: 아이별 빠른 입력 */}
        {children.length > 0 && (
          <section className="bg-white rounded-2xl border border-stone-200 p-6">
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="font-display text-lg text-stone-800">
                <span className="text-terracotta mr-2">3</span>아이별 오늘 모습
              </h2>
              {hasAnyEntry && (
                <button
                  onClick={clearToday}
                  className="text-xs text-stone-500 hover:text-red-500"
                >
                  오늘 입력 모두 지우기
                </button>
              )}
            </div>
            <p className="text-sm text-stone-500 mb-4">
              {docType === "gwanchal"
                ? "각 아이의 관찰된 모습을 짧게 메모해 주세요. 식사·기분·낮잠은 참고만 됩니다."
                : "빠르게 토글로 선택하고, 특이사항만 짧게 메모해 주세요. 비워두셔도 괜찮아요."}
            </p>
            <div className="space-y-3">
              {children.map((c) => (
                <ChildRow
                  key={c.id}
                  child={c}
                  entry={entries[c.id] ?? emptyEntry(c.id)}
                  onChange={(patch) => updateEntry(c.id, patch)}
                  docType={docType}
                />
              ))}
            </div>
          </section>
        )}

        {/* Step 4: 생성 */}
        <section className="bg-white rounded-2xl border border-stone-200 p-6">
          <h2 className="font-display text-lg text-stone-800 mb-4">
            <span className="text-terracotta mr-2">4</span>
            {DOC_LABELS[docType].name} 생성
          </h2>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="text-sm text-stone-600">문체</span>
            {(Object.keys(TONE_LABELS[docType]) as ToneStyle[]).map((t) => (
              <label
                key={t}
                className={`px-3 py-1.5 rounded-full border text-sm cursor-pointer transition ${
                  tone === t
                    ? "bg-terracotta text-white border-terracotta"
                    : "bg-white text-stone-700 border-stone-300 hover:border-stone-400"
                }`}
              >
                <input
                  type="radio"
                  name="tone"
                  value={t}
                  checked={tone === t}
                  onChange={() => setTone(t)}
                  className="hidden"
                />
                {TONE_LABELS[docType][t]}
              </label>
            ))}
          </div>
          <button
            onClick={generate}
            disabled={generating || children.length === 0}
            className="w-full sm:w-auto px-6 py-3 bg-terracotta text-white rounded-xl font-medium hover:bg-terracotta/90 disabled:bg-stone-300 disabled:cursor-not-allowed transition"
          >
            {generating
              ? `AI가 ${DOC_LABELS[docType].name}을 작성하고 있어요...`
              : `${children.length}명의 ${DOC_LABELS[docType].name} 한 번에 생성하기`}
          </button>
          <p className="mt-3 text-xs text-stone-500 leading-relaxed">
            ※ AI가 작성한 초안입니다. 학부모님이나 외부에 전송하기 전에 반드시
            선생님이 검토·수정해 주세요. 진단·평가적 표현, 다른 아이 이름은
            자동으로 걸러지지만 100% 보장되지 않습니다.
          </p>
          {error && (
            <p className="mt-3 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}
        </section>

        {/* Step 5: 결과 */}
        {Object.keys(notes).length > 0 && (
          <section className="bg-white rounded-2xl border border-stone-200 p-6">
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="font-display text-lg text-stone-800">
                <span className="text-terracotta mr-2">5</span>완성된{" "}
                {DOC_LABELS[docType].name}
              </h2>
              <button
                onClick={copyAll}
                className="text-sm px-3 py-1.5 bg-stone-800 text-white rounded-lg hover:bg-stone-700"
              >
                {copiedId === "ALL" ? "✓ 전체 복사됨" : "전체 복사"}
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {children.map((c) => {
                const text = notes[c.id];
                if (!text) return null;
                return (
                  <div
                    key={c.id}
                    className="border border-stone-200 rounded-xl p-4 bg-cream/40"
                  >
                    <div className="flex items-baseline justify-between mb-2">
                      <h3 className="font-display text-stone-800">{c.name}</h3>
                      <button
                        onClick={() => copy(c.id)}
                        className="text-xs px-2 py-1 text-stone-600 hover:text-terracotta"
                      >
                        {copiedId === c.id ? "✓ 복사됨" : "복사"}
                      </button>
                    </div>
                    <textarea
                      value={text}
                      onChange={(e) =>
                        setNotes((prev) => ({ ...prev, [c.id]: e.target.value }))
                      }
                      rows={docType === "gwanchal" ? 12 : 6}
                      className="w-full text-sm leading-relaxed bg-transparent resize-none focus:outline-none text-stone-700"
                    />
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-stone-500 mt-4">
              내용은 직접 수정할 수 있어요. 복사 후 키즈노트·카카오톡·문자에
              붙여넣으세요.
            </p>
          </section>
        )}
      </div>

      <footer className="max-w-5xl mx-auto px-5 mt-16 text-center text-xs text-stone-400">
        오늘알림장 · 선생님의 1시간을 돌려드립니다
      </footer>
    </main>
  );
}

function ChildRow({
  child,
  entry,
  onChange,
  docType,
}: {
  child: Child;
  entry: DailyEntry;
  onChange: (patch: Partial<DailyEntry>) => void;
  docType: DocType;
}) {
  const isGwanchal = docType === "gwanchal";
  const placeholder = isGwanchal
    ? "오늘 관찰한 모습 (예: 블록으로 긴 다리를 만들고 친구와 함께 놀이 확장, 동화책 보고 질문 많이 함)"
    : "특이사항 (예: 친구랑 블록놀이 즐겁게 함, 콧물 살짝 있음)";
  return (
    <div className="border border-stone-200 rounded-xl p-3 bg-cream/30">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className="font-display text-stone-800 min-w-[3.5rem]">
          {child.name}
        </span>
        {!isGwanchal && (
          <>
            <ToggleGroup
              label="식사"
              options={["잘먹음", "보통", "안먹음"] as const}
              value={entry.meal}
              onChange={(v) => onChange({ meal: v as MealStatus })}
            />
            <ToggleGroup
              label="기분"
              options={["좋음", "보통", "안좋음"] as const}
              value={entry.mood}
              onChange={(v) => onChange({ mood: v as MoodStatus })}
            />
            <ToggleGroup
              label="낮잠"
              options={["푹잠", "뒤척임", "안잠"] as const}
              value={entry.nap}
              onChange={(v) => onChange({ nap: v as NapStatus })}
            />
          </>
        )}
      </div>
      {isGwanchal ? (
        <textarea
          value={entry.memo}
          onChange={(e) => onChange({ memo: e.target.value })}
          placeholder={placeholder}
          rows={2}
          className="w-full px-3 py-1.5 text-sm rounded-lg border border-stone-200 bg-white focus:border-terracotta focus:outline-none resize-none"
        />
      ) : (
        <input
          value={entry.memo}
          onChange={(e) => onChange({ memo: e.target.value })}
          placeholder={placeholder}
          className="w-full px-3 py-1.5 text-sm rounded-lg border border-stone-200 bg-white focus:border-terracotta focus:outline-none"
        />
      )}
    </div>
  );
}

function ToggleGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly T[];
  value: string;
  onChange: (v: T | "") => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-stone-500 mr-1">{label}</span>
      {options.map((opt) => {
        const active = value === opt;
        return (
          <button
            key={opt}
            onClick={() => onChange(active ? "" : opt)}
            className={`px-2.5 py-1 text-xs rounded-md border transition ${
              active
                ? "bg-sage text-white border-sage"
                : "bg-white text-stone-600 border-stone-200 hover:border-stone-400"
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}
