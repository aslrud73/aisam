"use client";

import { useEffect, useState } from "react";
import { getAuthHeaders, loadSettings } from "./lib/settings";
import { SetupBanner } from "./components/SetupBanner";
import { Icon, type IconName } from "./components/Icon";
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
      <div className="max-w-5xl mx-auto px-5 pt-6 space-y-5">
        <SetupBanner />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-ink tracking-tight">오늘 기록</h1>
            <p className="text-sm text-ink-muted mt-0.5">
              아이별 알림장과 관찰일지를 한 번에 작성해요
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <span className="text-ink-muted">반 이름</span>
            <input
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              className="px-3 py-2 rounded-xl border border-warm-200 bg-paper w-28 text-sm focus:border-terracotta-400 focus:ring-2 focus:ring-terracotta-100 focus:outline-none"
            />
          </label>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-5 pt-6 space-y-6">
        <div className="bg-paper rounded-2xl border border-warm-100 p-1.5 grid grid-cols-2 gap-1 shadow-card">
          {(Object.keys(DOC_LABELS) as DocType[]).map((d) => {
            const active = docType === d;
            const info = DOC_LABELS[d];
            return (
              <button
                key={d}
                onClick={() => setDocType(d)}
                className={`text-left px-4 py-3 rounded-xl transition ${
                  active
                    ? "bg-terracotta-500 text-white shadow-sm"
                    : "bg-transparent text-ink-soft hover:bg-warm-50"
                }`}
              >
                <div className="text-base font-semibold">{info.name}</div>
                <div
                  className={`text-xs mt-0.5 ${
                    active ? "text-white/85" : "text-ink-muted"
                  }`}
                >
                  {info.sub}
                </div>
              </button>
            );
          })}
        </div>

        <section className="bg-paper rounded-2xl border border-warm-100 p-6 shadow-card">
          <StepHeader
            step={1}
            icon="users"
            title="우리 반 아이들"
            right={
              <span className="text-sm text-ink-muted tabular-nums">
                {children.length}명 등록됨
              </span>
            }
          />

          {children.length === 0 ? (
            <div className="text-center py-10 text-ink-muted text-sm">
              <p className="font-display text-base text-ink-soft mb-1">
                먼저 아이 이름을 추가해 주세요
              </p>
              <p>한 번 등록하면 매일 다시 입력할 필요가 없어요.</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 mb-4">
              {children.map((c) => (
                <span
                  key={c.id}
                  className="group inline-flex items-center gap-1.5 px-3 py-1.5 bg-cream-100 border border-warm-100 rounded-full text-sm text-ink-soft"
                >
                  {c.name}
                  <button
                    onClick={() => removeChild(c.id)}
                    className="text-ink-faint hover:text-red-500 inline-flex items-center"
                    aria-label={`${c.name} 삭제`}
                  >
                    <Icon name="x" size={12} strokeWidth={2.2} />
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
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-warm-200 bg-paper text-sm focus:border-terracotta-400 focus:ring-2 focus:ring-terracotta-100 focus:outline-none"
              />
              <button
                onClick={() => {
                  addChild(newName);
                  setNewName("");
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-xl text-sm font-medium whitespace-nowrap shadow-sm"
              >
                <Icon name="plus" size={14} strokeWidth={2.2} />
                추가
              </button>
            </div>
          </div>
          <details className="mt-4 text-sm">
            <summary className="text-ink-muted cursor-pointer hover:text-ink-soft select-none">
              여러 명 한 번에 등록
            </summary>
            <div className="mt-3 flex gap-2">
              <textarea
                value={bulkInput}
                onChange={(e) => setBulkInput(e.target.value)}
                placeholder="이름들을 줄바꿈 또는 쉼표로 구분"
                rows={3}
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-warm-200 bg-paper text-sm focus:border-terracotta-400 focus:ring-2 focus:ring-terracotta-100 focus:outline-none"
              />
              <button
                onClick={addBulk}
                className="px-4 py-2.5 bg-warm-100 text-ink-soft hover:bg-warm-200 rounded-xl text-sm font-medium self-start"
              >
                일괄 추가
              </button>
            </div>
          </details>
        </section>

        <section className="bg-paper rounded-2xl border border-warm-100 p-6 shadow-card">
          <StepHeader step={2} icon="sun" title="오늘의 활동" />
          <textarea
            value={todayActivity}
            onChange={(e) => setTodayActivity(e.target.value)}
            placeholder="예: 봄꽃 그리기 미술활동을 했고, 바깥놀이로 모래놀이를 했어요. 점심은 닭볶음탕."
            rows={3}
            className="w-full px-3.5 py-2.5 rounded-xl border border-warm-200 bg-paper text-sm leading-relaxed focus:border-terracotta-400 focus:ring-2 focus:ring-terracotta-100 focus:outline-none resize-none"
          />
          <p className="text-xs text-ink-muted mt-2.5">
            한 번 입력하면 모든 아이의 알림장에 자연스럽게 반영돼요.
          </p>
        </section>

        {children.length > 0 && (
          <section className="bg-paper rounded-2xl border border-warm-100 p-6 shadow-card">
            <StepHeader
              step={3}
              icon="pencil"
              title="아이별 오늘 모습"
              right={
                hasAnyEntry && (
                  <button
                    onClick={clearToday}
                    className="text-xs text-ink-muted hover:text-red-500"
                  >
                    오늘 입력 모두 지우기
                  </button>
                )
              }
            />
            <p className="text-sm text-ink-soft mb-4 leading-relaxed">
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

        <section className="bg-paper rounded-2xl border border-warm-100 p-6 shadow-card">
          <StepHeader step={4} icon="sparkle" title={`${DOC_LABELS[docType].name} 생성`} />
          <div className="flex flex-wrap items-center gap-2 mb-5">
            <span className="text-sm text-ink-muted mr-1">문체</span>
            {(Object.keys(TONE_LABELS[docType]) as ToneStyle[]).map((t) => (
              <label
                key={t}
                className={`px-3.5 py-1.5 rounded-full border text-sm cursor-pointer transition ${
                  tone === t
                    ? "bg-sage-500 text-white border-sage-500 shadow-sm"
                    : "bg-paper text-ink-soft border-warm-200 hover:border-warm-300 hover:bg-warm-50"
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
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-2xl font-semibold disabled:bg-warm-200 disabled:text-ink-faint disabled:cursor-not-allowed shadow-sm hover:shadow-md"
          >
            {!generating && <Icon name="sparkle" size={16} strokeWidth={2} />}
            {generating
              ? `AI가 ${DOC_LABELS[docType].name}을 작성하고 있어요...`
              : `${children.length}명의 ${DOC_LABELS[docType].name} 한 번에 생성하기`}
          </button>
          <div className="mt-4 flex items-start gap-2 text-xs text-ink-muted leading-relaxed">
            <span className="text-warm-400 shrink-0 mt-0.5">
              <Icon name="shield" size={14} strokeWidth={1.6} />
            </span>
            <p>
              AI가 작성한 초안입니다. 학부모님이나 외부에 전송하기 전에 반드시
              선생님이 검토·수정해 주세요. 진단·평가적 표현, 다른 아이 이름은
              자동으로 걸러지지만 100% 보장되지 않습니다.
            </p>
          </div>
          {error && (
            <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-xl">
              {error}
            </p>
          )}
        </section>

        {Object.keys(notes).length > 0 && (
          <section className="bg-paper rounded-2xl border border-warm-100 p-6 shadow-card">
            <StepHeader
              step={5}
              icon="check"
              title={`완성된 ${DOC_LABELS[docType].name}`}
              right={
                <button
                  onClick={copyAll}
                  className="inline-flex items-center gap-1.5 text-sm px-3.5 py-2 bg-ink hover:bg-ink-soft text-cream rounded-xl font-medium"
                >
                  <Icon name="copy" size={14} strokeWidth={1.8} />
                  {copiedId === "ALL" ? "전체 복사됨" : "전체 복사"}
                </button>
              }
            />
            <div className="grid gap-4 sm:grid-cols-2">
              {children.map((c) => {
                const text = notes[c.id];
                if (!text) return null;
                return (
                  <div
                    key={c.id}
                    className="rounded-2xl p-4 bg-cream-100 border-l-2 border-terracotta-300"
                  >
                    <div className="flex items-baseline justify-between mb-2">
                      <h3 className="font-semibold text-ink">{c.name}</h3>
                      <button
                        onClick={() => copy(c.id)}
                        className="inline-flex items-center gap-1 text-xs px-2 py-1 text-ink-muted hover:text-terracotta-600"
                      >
                        <Icon name="copy" size={12} strokeWidth={1.8} />
                        {copiedId === c.id ? "복사됨" : "복사"}
                      </button>
                    </div>
                    <textarea
                      value={text}
                      onChange={(e) =>
                        setNotes((prev) => ({ ...prev, [c.id]: e.target.value }))
                      }
                      rows={docType === "gwanchal" ? 12 : 6}
                      className="w-full text-sm leading-relaxed bg-transparent resize-none focus:outline-none text-ink-soft"
                    />
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-ink-muted mt-4">
              내용은 직접 수정할 수 있어요. 복사 후 키즈노트·카카오톡·문자에
              붙여넣으세요.
            </p>
          </section>
        )}
      </div>
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
    <div className="border border-warm-100 rounded-2xl p-3.5 bg-cream-50">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-2.5">
        <span className="font-semibold text-ink min-w-[3.5rem]">{child.name}</span>
        {!isGwanchal && (
          <>
            <ToggleGroup
              label="식사"
              icon="bowl"
              options={["잘먹음", "보통", "안먹음"] as const}
              value={entry.meal}
              onChange={(v) => onChange({ meal: v as MealStatus })}
            />
            <ToggleGroup
              label="기분"
              icon="smile"
              options={["좋음", "보통", "안좋음"] as const}
              value={entry.mood}
              onChange={(v) => onChange({ mood: v as MoodStatus })}
            />
            <ToggleGroup
              label="낮잠"
              icon="moon"
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
          className="w-full px-3 py-2 text-sm rounded-xl border border-warm-200 bg-paper focus:border-terracotta-400 focus:ring-2 focus:ring-terracotta-100 focus:outline-none resize-none"
        />
      ) : (
        <input
          value={entry.memo}
          onChange={(e) => onChange({ memo: e.target.value })}
          placeholder={placeholder}
          className="w-full px-3 py-2 text-sm rounded-xl border border-warm-200 bg-paper focus:border-terracotta-400 focus:ring-2 focus:ring-terracotta-100 focus:outline-none"
        />
      )}
    </div>
  );
}

function StepHeader({
  step,
  icon,
  title,
  right,
}: {
  step: number;
  icon: IconName;
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-terracotta-50 text-terracotta-700 text-sm font-semibold tabular-nums">
          {step}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-terracotta-500">
            <Icon name={icon} size={18} strokeWidth={1.7} />
          </span>
          <h2 className="text-base sm:text-lg font-semibold text-ink">{title}</h2>
        </div>
      </div>
      {right}
    </div>
  );
}

function ToggleGroup<T extends string>({
  label,
  icon,
  options,
  value,
  onChange,
}: {
  label: string;
  icon: IconName;
  options: readonly T[];
  value: string;
  onChange: (v: T | "") => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="inline-flex items-center gap-1 text-xs text-ink-muted mr-0.5">
        <Icon name={icon} size={13} strokeWidth={1.6} />
        {label}
      </span>
      {options.map((opt) => {
        const active = value === opt;
        return (
          <button
            key={opt}
            onClick={() => onChange(active ? "" : opt)}
            className={`px-2.5 py-1 text-xs rounded-lg border transition ${
              active
                ? "bg-sage-500 text-white border-sage-500 shadow-sm"
                : "bg-paper text-ink-soft border-warm-200 hover:border-warm-300"
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}
