"use client";

import { useEffect, useState } from "react";
import { getAuthHeaders, loadSettings } from "./lib/settings";
import { SetupBanner } from "./components/SetupBanner";
import { PageHeader } from "./components/PageHeader";
import { Card, StepHeader } from "./components/Card";
import { AlrimIllust, GwanchalIllust, DoneIllust, ClassIllust } from "./components/illustrations";
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
  present: boolean;
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

const DOC_LABELS: Record<DocType, { name: string; sub: string; emoji: string }> = {
  alrim: {
    name: "알림장",
    sub: "매일 학부모님께 보내는 일일 기록",
    emoji: "📝",
  },
  gwanchal: {
    name: "관찰일지",
    sub: "누리과정 영역과 연계된 전문 기록",
    emoji: "📋",
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

const AVATAR_PALETTE = [
  "bg-coral-bg text-coral",
  "bg-sage-bg text-sage",
  "bg-mustard-bg text-mustard",
  "bg-lavender-bg text-lavender",
  "bg-navy-bg text-navy",
];

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function emptyEntry(childId: string): DailyEntry {
  return { childId, meal: "", mood: "", nap: "", memo: "", present: true };
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
        // backfill present field for older saves
        const restored: Record<string, DailyEntry> = {};
        for (const [k, v] of Object.entries(parsed.entries ?? {})) {
          restored[k] = { ...emptyEntry(k), ...v, present: v.present ?? true };
        }
        setEntries(restored);
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

  function togglePresent(id: string) {
    setEntries((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] ?? emptyEntry(id)),
        present: !(prev[id]?.present ?? true),
      },
    }));
  }

  function setAllPresent(present: boolean) {
    setEntries((prev) => {
      const next = { ...prev };
      for (const c of children) {
        next[c.id] = { ...(next[c.id] ?? emptyEntry(c.id)), present };
      }
      return next;
    });
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
    const presentChildren = children.filter(
      (c) => entries[c.id]?.present ?? true,
    );
    if (presentChildren.length === 0) {
      setError("출석한 아이가 한 명도 없어요. 출석을 먼저 체크해 주세요.");
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
          children: presentChildren.map((c) => ({
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
      saveDailyEntries(records).catch(() => {});
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

  const presentCount = children.filter((c) => entries[c.id]?.present ?? true).length;
  const accent = docType === "alrim" ? "coral" : "sage";

  return (
    <main className="pb-28 lg:pb-12">
      <div className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8 pt-5 md:pt-7 space-y-5 md:space-y-6">
        <SetupBanner />

        <PageHeader
          title="오늘 기록"
          description="아이별 식사·기분·낮잠·메모만 빠르게 입력하면 알림장과 관찰일지를 한 번에 만들어드려요."
          accent={accent}
          illustration={
            docType === "alrim" ? <AlrimIllust /> : <GwanchalIllust />
          }
        />

        {/* 모드 탭 */}
        <div className="grid grid-cols-2 gap-2 md:gap-3">
          {(Object.keys(DOC_LABELS) as DocType[]).map((d) => {
            const active = docType === d;
            const info = DOC_LABELS[d];
            const isAlrim = d === "alrim";
            return (
              <button
                key={d}
                onClick={() => setDocType(d)}
                className={`text-left p-4 md:p-5 rounded-2xl border-2 transition-all duration-150 ${
                  active
                    ? isAlrim
                      ? "bg-coral text-white border-coral shadow-coral"
                      : "bg-sage text-white border-sage shadow-sage"
                    : "bg-white text-ink border-line-light hover:border-line-medium"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{info.emoji}</span>
                  <span className="font-extrabold text-base md:text-lg tracking-[-0.02em]">
                    {info.name}
                  </span>
                </div>
                <div
                  className={`text-xs md:text-sm mt-1 leading-relaxed ${
                    active ? "text-white/85" : "text-ink-secondary"
                  }`}
                >
                  {info.sub}
                </div>
              </button>
            );
          })}
        </div>

        {/* 반 이름 */}
        <Card>
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold tracking-wider text-ink-tertiary uppercase">
                반 이름
              </div>
              <input
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                className="mt-1 px-3 py-2 rounded-lg border border-line-medium bg-white w-32 focus:border-coral focus:outline-none focus:ring-3 focus:ring-coral-bg font-bold"
              />
            </div>
            <div className="text-right">
              <div className="text-xs font-semibold tracking-wider text-ink-tertiary uppercase">
                오늘 출석
              </div>
              <div className="font-extrabold text-2xl text-coral mt-1 tracking-[-0.02em]">
                {presentCount}
                <span className="text-base text-ink-tertiary font-bold">
                  {" "}/ {children.length}명
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Step 1: 우리 반 아이들 */}
        <Card>
          <StepHeader
            step={1}
            title="우리 반 아이들"
            accent="coral"
            hint="한 번 등록하면 매일 다시 입력할 필요가 없어요."
            right={
              children.length > 0 ? (
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setAllPresent(true)}
                    className="text-xs px-2.5 py-1.5 rounded-full bg-sage-bg text-sage hover:bg-sage hover:text-white transition-colors duration-150 font-bold"
                  >
                    전체 출석
                  </button>
                  <button
                    onClick={() => setAllPresent(false)}
                    className="text-xs px-2.5 py-1.5 rounded-full bg-warm text-ink-secondary hover:bg-line-medium transition-colors duration-150 font-bold"
                  >
                    전체 해제
                  </button>
                </div>
              ) : null
            }
          />

          {children.length === 0 ? (
            <div className="flex flex-col items-center text-center py-8 gap-2">
              <ClassIllust size={88} />
              <p className="text-sm text-ink-secondary mt-2 leading-relaxed">
                아래에서 아이 이름을 추가해 주세요.
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 mb-4">
              {children.map((c, idx) => {
                const present = entries[c.id]?.present ?? true;
                const palette = AVATAR_PALETTE[idx % AVATAR_PALETTE.length];
                return (
                  <button
                    key={c.id}
                    onClick={() => togglePresent(c.id)}
                    className={`group inline-flex items-center gap-2 pl-1.5 pr-1 py-1 rounded-full border-2 transition-all duration-150 active:scale-95 ${
                      present
                        ? "border-sage bg-sage text-white shadow-sm"
                        : "border-line-medium bg-warm text-ink-tertiary line-through"
                    }`}
                  >
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold ${
                        present ? "bg-white text-sage" : palette
                      }`}
                    >
                      {c.name.slice(0, 1)}
                    </span>
                    <span className="text-sm font-bold">{c.name}</span>
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        removeChild(c.id);
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          removeChild(c.id);
                        }
                      }}
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                        present
                          ? "text-white/70 hover:text-white hover:bg-white/20"
                          : "text-ink-tertiary hover:text-coral"
                      }`}
                      aria-label={`${c.name} 명단에서 삭제`}
                    >
                      ✕
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2.5">
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
              className="flex-1 px-3 py-2.5 rounded-lg border border-line-medium focus:border-coral focus:outline-none focus:ring-3 focus:ring-coral-bg text-sm"
            />
            <button
              onClick={() => {
                addChild(newName);
                setNewName("");
              }}
              className="px-5 py-2.5 bg-ink text-white rounded-lg hover:bg-ink-secondary text-sm font-bold transition-all duration-150 hover:-translate-y-px"
            >
              추가
            </button>
          </div>

          <details className="mt-3 text-sm">
            <summary className="text-ink-secondary cursor-pointer hover:text-coral font-medium">
              여러 명 한 번에 등록
            </summary>
            <div className="mt-2 flex gap-2">
              <textarea
                value={bulkInput}
                onChange={(e) => setBulkInput(e.target.value)}
                placeholder="이름들을 줄바꿈 또는 쉼표로 구분"
                rows={3}
                className="flex-1 px-3 py-2 rounded-lg border border-line-medium focus:border-coral focus:outline-none focus:ring-3 focus:ring-coral-bg text-sm"
              />
              <button
                onClick={addBulk}
                className="px-4 py-2 bg-warm text-ink rounded-lg hover:bg-line-medium text-sm self-start font-bold"
              >
                일괄 추가
              </button>
            </div>
          </details>
        </Card>

        {/* Step 2: 오늘의 활동 */}
        <Card>
          <StepHeader
            step={2}
            title="오늘의 활동"
            accent="coral"
            hint="한 번 입력하면 모든 아이의 기록에 자연스럽게 반영돼요."
          />
          <textarea
            value={todayActivity}
            onChange={(e) => setTodayActivity(e.target.value)}
            placeholder="예: 봄꽃 그리기 미술활동을 했고, 바깥놀이로 모래놀이를 했어요. 점심은 닭볶음탕."
            rows={3}
            className="w-full px-3 py-2.5 rounded-lg border border-line-medium focus:border-coral focus:outline-none focus:ring-3 focus:ring-coral-bg text-sm leading-relaxed"
          />
        </Card>

        {/* Step 3: 아이별 빠른 입력 */}
        {children.length > 0 && (
          <Card>
            <StepHeader
              step={3}
              title="아이별 오늘 모습"
              accent="coral"
              hint={
                docType === "gwanchal"
                  ? "각 아이의 관찰된 모습을 짧게 메모해 주세요. 식사·기분·낮잠은 참고만 됩니다."
                  : "빠르게 토글로 선택하고, 특이사항만 짧게 메모해 주세요. 비워두셔도 괜찮아요."
              }
              right={
                hasAnyEntry ? (
                  <button
                    onClick={clearToday}
                    className="text-xs text-ink-tertiary hover:text-coral font-medium"
                  >
                    오늘 입력 지우기
                  </button>
                ) : null
              }
            />
            <div className="space-y-3">
              {children
                .filter((c) => entries[c.id]?.present ?? true)
                .map((c, idx) => (
                  <ChildRow
                    key={c.id}
                    child={c}
                    avatarPalette={AVATAR_PALETTE[idx % AVATAR_PALETTE.length]}
                    entry={entries[c.id] ?? emptyEntry(c.id)}
                    onChange={(patch) => updateEntry(c.id, patch)}
                    docType={docType}
                  />
                ))}
            </div>
            {presentCount === 0 && (
              <div className="text-center text-sm text-ink-tertiary py-6">
                출석한 아이가 없어요. 위 칩에서 출석을 선택해 주세요.
              </div>
            )}
          </Card>
        )}

        {/* Step 4: 생성 */}
        <Card>
          <StepHeader
            step={4}
            title={`${DOC_LABELS[docType].name} 생성`}
            accent={accent}
          />
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-xs font-semibold tracking-wider text-ink-tertiary uppercase mr-1">
              문체
            </span>
            {(Object.keys(TONE_LABELS[docType]) as ToneStyle[]).map((t) => (
              <label
                key={t}
                className={`px-3 py-1.5 rounded-full border text-sm cursor-pointer transition-all duration-150 font-medium ${
                  tone === t
                    ? docType === "alrim"
                      ? "bg-coral text-white border-coral"
                      : "bg-sage text-white border-sage"
                    : "bg-white text-ink-secondary border-line-medium hover:border-line-strong"
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
            className={`w-full sm:w-auto px-6 py-3 text-white rounded-xl font-extrabold text-base transition-all duration-150 disabled:bg-line-medium disabled:cursor-not-allowed ${
              docType === "alrim"
                ? "bg-coral hover:bg-coral-light shadow-coral hover:-translate-y-px"
                : "bg-sage hover:bg-sage-light shadow-sage hover:-translate-y-px"
            }`}
          >
            {generating
              ? `AI가 ${DOC_LABELS[docType].name}을 작성하고 있어요...`
              : `${presentCount}명의 ${DOC_LABELS[docType].name} 한 번에 만들기`}
          </button>
          <p className="mt-3 text-xs text-ink-tertiary leading-relaxed">
            ※ AI가 작성한 초안입니다. 학부모님이나 외부에 전송하기 전에 반드시
            선생님이 검토·수정해 주세요. 진단·평가적 표현, 다른 아이 이름은
            자동으로 걸러지지만 100% 보장되지 않습니다.
          </p>
          {error && (
            <p className="mt-3 text-sm text-coral bg-coral-bg px-3 py-2 rounded-lg">
              {error}
            </p>
          )}
        </Card>

        {/* Step 5: 결과 */}
        {Object.keys(notes).length > 0 && (
          <Card>
            <StepHeader
              step={5}
              title={`완성된 ${DOC_LABELS[docType].name}`}
              accent={accent}
              right={
                <button
                  onClick={copyAll}
                  className="text-sm px-3 py-1.5 bg-ink text-white rounded-lg hover:bg-ink-secondary font-bold transition-all duration-150"
                >
                  {copiedId === "ALL" ? "✓ 전체 복사됨" : "전체 복사"}
                </button>
              }
            />
            <div className="flex items-center gap-2 mb-4 text-sm text-sage bg-sage-bg px-3 py-2 rounded-lg">
              <DoneIllust size={28} />
              <span className="font-bold">
                {Object.keys(notes).length}명의 초안이 완성됐어요. 직접 다듬어
                보내세요.
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {children.map((c, idx) => {
                const text = notes[c.id];
                if (!text) return null;
                const palette = AVATAR_PALETTE[idx % AVATAR_PALETTE.length];
                const cardBg =
                  docType === "alrim"
                    ? "bg-coral-bg/50 border-coral-light/40"
                    : "bg-sage-bg/50 border-sage-light/40";
                return (
                  <div
                    key={c.id}
                    className={`border rounded-2xl p-4 ${cardBg}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-extrabold ${palette}`}
                        >
                          {c.name.slice(0, 1)}
                        </span>
                        <h3 className="font-bold text-ink tracking-[-0.02em]">
                          {c.name}
                        </h3>
                      </div>
                      <button
                        onClick={() => copy(c.id)}
                        className={`text-xs px-2 py-1 font-bold rounded-md transition-colors ${
                          docType === "alrim"
                            ? "text-coral hover:bg-coral hover:text-white"
                            : "text-sage hover:bg-sage hover:text-white"
                        }`}
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
                      className="w-full text-sm leading-relaxed bg-white/70 border border-white rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-current/20 text-ink"
                    />
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-ink-tertiary mt-4">
              내용은 직접 수정할 수 있어요. 복사 후 키즈노트·카카오톡·문자에
              붙여넣으세요.
            </p>
          </Card>
        )}

        <footer className="text-center text-xs text-ink-tertiary pt-6">
          쌤노트 · 선생님의 1시간을 돌려드립니다
        </footer>
      </div>
    </main>
  );
}

function ChildRow({
  child,
  avatarPalette,
  entry,
  onChange,
  docType,
}: {
  child: Child;
  avatarPalette: string;
  entry: DailyEntry;
  onChange: (patch: Partial<DailyEntry>) => void;
  docType: DocType;
}) {
  const isGwanchal = docType === "gwanchal";
  const placeholder = isGwanchal
    ? "오늘 관찰한 모습 (예: 블록으로 긴 다리를 만들고 친구와 함께 놀이 확장, 동화책 보고 질문 많이 함)"
    : "특이사항 (예: 친구랑 블록놀이 즐겁게 함, 콧물 살짝 있음)";
  return (
    <div className="border border-line-light rounded-xl p-3 bg-soft">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span
          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold ${avatarPalette}`}
        >
          {child.name.slice(0, 1)}
        </span>
        <span className="font-bold text-ink min-w-[3.5rem]">{child.name}</span>
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
          className="w-full px-3 py-1.5 text-sm rounded-lg border border-line-light bg-white focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage-bg resize-none"
        />
      ) : (
        <input
          value={entry.memo}
          onChange={(e) => onChange({ memo: e.target.value })}
          placeholder={placeholder}
          className="w-full px-3 py-1.5 text-sm rounded-lg border border-line-light bg-white focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral-bg"
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
      <span className="text-xs text-ink-tertiary mr-1 font-semibold">
        {label}
      </span>
      {options.map((opt) => {
        const active = value === opt;
        return (
          <button
            key={opt}
            onClick={() => onChange(active ? "" : opt)}
            className={`px-2.5 py-1 text-xs rounded-md border transition-all duration-150 active:scale-95 font-medium ${
              active
                ? "bg-sage text-white border-sage"
                : "bg-white text-ink-secondary border-line-light hover:border-line-medium"
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}
