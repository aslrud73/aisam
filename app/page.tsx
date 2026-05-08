"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getAuthHeaders, loadSettings } from "./lib/settings";
import { SetupBanner } from "./components/SetupBanner";
import { Icon, type IconName } from "./components/Icon";
import { AlrimIllust, GwanchalIllust } from "./components/illustrations";
import {
  saveDailyEntries,
  countKidEntries,
  renameKid,
  getLastActivityByKid,
  todayISO,
  type DailyEntryRecord,
  type KidLastActivity,
} from "./lib/db";

const ACTIVITY_EXAMPLES = [
  "예: 봄꽃 그리기 미술활동을 했고, 바깥놀이로 모래놀이를 했어요. 점심은 닭볶음탕.",
  "예: 동화책 '구름빵' 듣고 역할극 놀이를 했어요. 바깥놀이는 비가 와서 실내 체육으로 대체. 점심은 카레라이스.",
  "예: 종이접기 활동(개구리 만들기), 음률 활동(봄을 노래해요). 점심은 된장찌개와 잡곡밥.",
  "예: 텃밭에 상추 모종 심기, 물 주기 체험. 자유놀이 시간엔 블록과 인형놀이. 점심은 김밥과 미역국.",
  "예: 신체활동(꽃길 따라 걷기), 미술(꽃잎으로 콜라주). 점심은 비빔밥, 후식 수박.",
  "예: 모래놀이터에서 모래성 쌓기 + 색깔 분류 놀이. 점심은 스파게티와 옥수수수프.",
];

const ALRIM_MEMO_EXAMPLES = [
  "특이사항 (예: 친구랑 블록놀이 즐겁게 함, 콧물 살짝 있음)",
  "특이사항 (예: 새 친구에게 먼저 말 걸어줌, 점심 잘 먹음)",
  "특이사항 (예: 낮잠 시간에 뒤척임, 평소보다 활기참)",
  "특이사항 (예: 미술 시간에 집중도 좋음, 등원 시 살짝 울음)",
  "특이사항 (예: 새로운 노래 흥얼거리며 따라부름, 컨디션 좋음)",
];

const GWANCHAL_MEMO_EXAMPLES = [
  "오늘 관찰한 모습 (예: 블록으로 긴 다리를 만들고 친구와 함께 놀이 확장, 동화책 보고 질문 많이 함)",
  "오늘 관찰한 모습 (예: 색깔별로 분류하기 시도, 친구가 도움 청하자 자발적으로 도와줌)",
  "오늘 관찰한 모습 (예: 가위질이 능숙해짐, 자신의 작품에 이야기를 부여하며 설명)",
  "오늘 관찰한 모습 (예: 또래와 갈등 시 말로 의사 표현 시도, 새로운 활동에 호기심)",
  "오늘 관찰한 모습 (예: 노래 가사를 외워 부르기 시작, 신체 활동에서 균형감각 향상)",
];

function pickOne<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function hasName(list: { name: string }[], name: string): boolean {
  const target = name.trim();
  return list.some((c) => c.name.trim() === target);
}

/**
 * Find the next available "name + number" so duplicates get a clean
 * distinguishing suffix. Skips numbers already in use, e.g. if
 * "민선" and "민선2" both exist, returns "민선3".
 */
function nextSuffixedName(
  baseName: string,
  list: { name: string }[],
): string {
  const base = baseName.trim();
  let n = 2;
  while (hasName(list, `${base}${n}`)) n++;
  return `${base}${n}`;
}

type MealStatus = "잘먹음" | "보통" | "안먹음" | "";
type MoodStatus = "좋음" | "보통" | "안좋음" | "";
type NapStatus = "푹잠" | "뒤척임" | "안잠" | "";

interface Child {
  id: string;
  name: string;
  archived?: boolean;
}

function formatRelativeDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  if (Number.isNaN(d.getTime())) return iso;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const that = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const days = Math.round((today.getTime() - that.getTime()) / 86400000);
  if (days === 0) return "오늘";
  if (days === 1) return "어제";
  if (days < 7) return `${days}일 전`;
  return `${d.getMonth() + 1}/${d.getDate()}`;
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
  selectedIds?: string[];
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
  const [notes, setNotes] = useState<Record<DocType, Record<string, string>>>({
    alrim: {},
    gwanchal: {},
  });
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editMode, setEditMode] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [lastActivity, setLastActivity] = useState<Map<string, KidLastActivity>>(
    new Map(),
  );
  const rosterFileInputRef = useRef<HTMLInputElement>(null);
  const activityPlaceholder = useMemo(() => pickOne(ACTIVITY_EXAMPLES), []);
  const alrimMemoPlaceholder = useMemo(() => pickOne(ALRIM_MEMO_EXAMPLES), []);
  const gwanchalMemoPlaceholder = useMemo(() => pickOne(GWANCHAL_MEMO_EXAMPLES), []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: PersistedState = JSON.parse(raw);
        setClassName(parsed.className ?? "햇살반");
        const loadedChildren = parsed.children ?? [];
        setChildren(loadedChildren);
        setTodayActivity(parsed.todayActivity ?? "");
        setEntries(parsed.entries ?? {});
        setTone(parsed.tone ?? "warm");
        setDocType(parsed.docType ?? "alrim");
        // Default: every registered child is selected for today.
        // Migrating users (no selectedIds in storage) get everyone selected.
        const stored = parsed.selectedIds;
        if (stored && stored.length) {
          // Drop ids that no longer exist.
          const validIds = new Set(loadedChildren.map((c) => c.id));
          setSelectedIds(new Set(stored.filter((id) => validIds.has(id))));
        } else {
          setSelectedIds(new Set(loadedChildren.map((c) => c.id)));
        }
      }
    } catch {}
    setHydrated(true);
    refreshLastActivity();
  }, []);

  async function refreshLastActivity() {
    try {
      const map = await getLastActivityByKid();
      setLastActivity(map);
    } catch {
      // DB unavailable — leave map empty.
    }
  }

  useEffect(() => {
    if (!hydrated) return;
    const state: PersistedState = {
      className,
      children,
      todayActivity,
      entries,
      tone,
      docType,
      selectedIds: Array.from(selectedIds),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [hydrated, className, children, todayActivity, entries, tone, docType, selectedIds]);

  function addChild(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;

    let finalName = trimmed;
    if (hasName(children, trimmed)) {
      const suggested = nextSuffixedName(trimmed, children);
      const ok = confirm(
        [
          `이미 "${trimmed}"라는 아이가 있어요.`,
          "",
          "동일 이름의 아이를 한 명 더 등록하시려면 별도의 분류가 필요해요.",
          `"${suggested}"(으)로 추가됩니다. 계속하시겠어요?`,
        ].join("\n"),
      );
      if (!ok) return;
      finalName = suggested;
    }

    const id = uid();
    setChildren((prev) => [...prev, { id, name: finalName }]);
    setEntries((prev) => ({ ...prev, [id]: emptyEntry(id) }));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }

  function addBulk() {
    const names = bulkInput
      .split(/[\n,]/)
      .map((n) => n.trim())
      .filter(Boolean);
    if (names.length === 0) return;

    // Auto-suffix duplicates against the existing roster *and* against
    // earlier entries in this same bulk batch.
    const renamed: { from: string; to: string }[] = [];
    const newChildren: Child[] = [];
    const running: { name: string }[] = [...children];
    for (const raw of names) {
      let finalName = raw;
      if (hasName(running, raw)) {
        finalName = nextSuffixedName(raw, running);
        renamed.push({ from: raw, to: finalName });
      }
      const child = { id: uid(), name: finalName };
      newChildren.push(child);
      running.push(child);
    }

    setChildren((prev) => [...prev, ...newChildren]);
    setEntries((prev) => {
      const next = { ...prev };
      for (const c of newChildren) next[c.id] = emptyEntry(c.id);
      return next;
    });
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const c of newChildren) next.add(c.id);
      return next;
    });
    setBulkInput("");

    if (renamed.length) {
      const sample = renamed
        .slice(0, 5)
        .map((r) => `${r.from} → ${r.to}`)
        .join("\n");
      const more =
        renamed.length > 5 ? `\n외 ${renamed.length - 5}명 더…` : "";
      alert(
        [
          `이미 같은 이름이 있어 ${renamed.length}명은 자동으로 번호가 붙었어요.`,
          "",
          sample + more,
        ].join("\n"),
      );
    }
  }

  function toggleSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelectedIds(
      new Set(children.filter((c) => !c.archived).map((c) => c.id)),
    );
  }

  function deselectAll() {
    setSelectedIds(new Set());
  }

  async function removeChild(id: string) {
    const child = children.find((c) => c.id === id);
    if (!child) return;

    let entryCount = 0;
    try {
      entryCount = await countKidEntries(id);
    } catch {
      // If DB lookup fails, fall back to a generic message.
    }

    const lines = [
      `${child.name}을(를) 명단에서 빼시겠어요?`,
      "",
      entryCount > 0
        ? `• 누적된 알림장·관찰일지 ${entryCount}건은 성장 리포트에 그대로 보존돼요.`
        : `• 아직 누적된 기록은 없어요.`,
      "• 명단에서만 사라지고, 옛 기록은 성장 리포트에서 계속 볼 수 있어요.",
      "• 같은 이름을 다시 추가하면 이전 기록과 분리된 새 유아로 등록됩니다.",
    ];
    if (!confirm(lines.join("\n"))) return;

    setChildren((prev) => prev.filter((c) => c.id !== id));
    setEntries((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setNotes((prev) => {
      const next = { alrim: { ...prev.alrim }, gwanchal: { ...prev.gwanchal } };
      delete next.alrim[id];
      delete next.gwanchal[id];
      return next;
    });
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  async function renameChild(id: string, rawName: string): Promise<boolean> {
    const child = children.find((c) => c.id === id);
    if (!child) return false;
    const trimmed = rawName.trim();
    if (!trimmed) {
      alert("이름을 비울 수 없어요.");
      return false;
    }
    if (trimmed === child.name) return true;
    if (hasName(children.filter((c) => c.id !== id), trimmed)) {
      alert(`이미 "${trimmed}"라는 아이가 있어요. 다른 이름을 써 주세요.`);
      return false;
    }
    setChildren((prev) =>
      prev.map((c) => (c.id === id ? { ...c, name: trimmed } : c)),
    );
    try {
      await renameKid(id, trimmed);
    } catch {
      // The localStorage rename has already happened; DB sync is best-effort.
    }
    return true;
  }

  function archiveChild(id: string) {
    const child = children.find((c) => c.id === id);
    if (!child) return;
    if (
      !confirm(
        [
          `${child.name}을(를) 졸업/이동 처리할까요?`,
          "",
          "• 명단에서는 빠지지만 누적 기록은 그대로 보존돼요.",
          "• 성장 리포트에서 이 아이의 과거 기록을 계속 볼 수 있어요.",
          "• 하단의 '졸업/이동한 아이들'에서 언제든 복귀시킬 수 있어요.",
        ].join("\n"),
      )
    ) {
      return;
    }
    setChildren((prev) =>
      prev.map((c) => (c.id === id ? { ...c, archived: true } : c)),
    );
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  function unarchiveChild(id: string) {
    setChildren((prev) =>
      prev.map((c) => (c.id === id ? { ...c, archived: false } : c)),
    );
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }

  function exportRoster() {
    const active = children.filter((c) => !c.archived);
    if (active.length === 0) {
      alert("내보낼 아이 명단이 없어요.");
      return;
    }
    const text = active.map((c) => c.name).join("\n") + "\n";
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const today = todayISO();
    a.href = url;
    a.download = `roster-${today}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function importRosterFile(file: File) {
    try {
      const text = await file.text();
      const incoming = text
        .split(/[\n,]/)
        .map((s) => s.trim())
        .filter(Boolean);
      if (!incoming.length) {
        alert("파일에서 이름을 찾을 수 없어요.");
        return;
      }
      const renamed: { from: string; to: string }[] = [];
      const newChildren: Child[] = [];
      const running: { name: string }[] = [...children];
      for (const raw of incoming) {
        let finalName = raw;
        if (hasName(running, raw)) {
          finalName = nextSuffixedName(raw, running);
          renamed.push({ from: raw, to: finalName });
        }
        const child: Child = { id: uid(), name: finalName };
        newChildren.push(child);
        running.push(child);
      }
      setChildren((prev) => [...prev, ...newChildren]);
      setEntries((prev) => {
        const next = { ...prev };
        for (const c of newChildren) next[c.id] = emptyEntry(c.id);
        return next;
      });
      setSelectedIds((prev) => {
        const next = new Set(prev);
        for (const c of newChildren) next.add(c.id);
        return next;
      });
      const lines = [`${newChildren.length}명을 명단에 추가했어요.`];
      if (renamed.length) {
        lines.push(
          "",
          `이미 같은 이름이 있어 ${renamed.length}명은 자동으로 번호가 붙었어요:`,
          ...renamed.slice(0, 5).map((r) => `• ${r.from} → ${r.to}`),
        );
        if (renamed.length > 5) lines.push(`외 ${renamed.length - 5}명 더…`);
      }
      alert(lines.join("\n"));
    } catch (e) {
      alert(`가져오기 실패: ${e instanceof Error ? e.message : "알 수 없는 오류"}`);
    }
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
    setNotes({ alrim: {}, gwanchal: {} });
  }

  async function generate() {
    const activeNow = children.filter((c) => !c.archived);
    if (activeNow.length === 0) {
      setError("먼저 아이들을 등록해 주세요.");
      return;
    }
    const todayChildren = activeNow.filter((c) => selectedIds.has(c.id));
    if (todayChildren.length === 0) {
      setError("오늘 기록할 아이를 한 명 이상 선택해 주세요.");
      return;
    }
    setError(null);
    setGenerating(true);
    setNotes((prev) => ({ ...prev, [docType]: {} }));
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          className,
          todayActivity,
          tone,
          docType,
          children: todayChildren.map((c) => ({
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
      setNotes((prev) => ({ ...prev, [docType]: map }));

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
      saveDailyEntries(records)
        .then(() => refreshLastActivity())
        .catch(() => {
          // Don't surface DB errors — generation already succeeded.
        });
    } catch (e) {
      setError(e instanceof Error ? e.message : "알 수 없는 오류");
    } finally {
      setGenerating(false);
    }
  }

  async function copy(childId: string) {
    const text = notes[docType][childId];
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopiedId(childId);
    setTimeout(() => setCopiedId((prev) => (prev === childId ? null : prev)), 1500);
  }

  async function copyAll() {
    if (children.length === 0) return;
    const current = notes[docType];
    const lines = children
      .filter((c) => current[c.id])
      .map((c) => `[${c.name}]\n${current[c.id]}`)
      .join("\n\n―――\n\n");
    if (!lines) return;
    await navigator.clipboard.writeText(lines);
    setCopiedId("ALL");
    setTimeout(() => setCopiedId((prev) => (prev === "ALL" ? null : prev)), 1500);
  }

  const activeChildren = children.filter((c) => !c.archived);
  const archivedChildren = children.filter((c) => c.archived);
  const todayChildren = activeChildren.filter((c) => selectedIds.has(c.id));
  const hasAnyEntry = todayChildren.some((c) => {
    const e = entries[c.id];
    return e && (e.meal || e.mood || e.nap || e.memo);
  });

  return (
    <main className="min-h-screen pb-24">
      <div className="max-w-4xl mx-auto px-5 pt-6 space-y-5">
        <SetupBanner />
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-3">
            <span className="shrink-0">
              {docType === "alrim" ? (
                <AlrimIllust size={40} />
              ) : (
                <GwanchalIllust size={40} />
              )}
            </span>
            <div>
              <h1 className="text-2xl font-semibold text-ink tracking-tight">오늘 기록</h1>
              <p className="text-sm text-ink-muted mt-0.5">
                아이별 알림장과 관찰일지를 한 번에 작성해요
              </p>
            </div>
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

      <div className="max-w-4xl mx-auto px-5 pt-6 space-y-6">
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
                {activeChildren.length > 0
                  ? `전체 ${activeChildren.length}명 · 오늘 ${selectedIds.size}명`
                  : "0명 등록됨"}
              </span>
            }
          />

          {activeChildren.length === 0 && archivedChildren.length === 0 ? (
            <div className="text-center py-10 text-ink-muted text-sm">
              <p className="font-display text-base text-ink-soft mb-1">
                먼저 아이 이름을 추가해 주세요
              </p>
              <p>한 번 등록하면 매일 다시 입력할 필요가 없어요.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                <p className="text-sm text-ink-soft leading-relaxed">
                  {editMode
                    ? "이름을 수정·졸업 처리·삭제할 수 있어요. 이름을 바꿔도 누적 기록은 그대로 유지돼요."
                    : "기본은 모두 출석 상태예요. 결석한 아이만 한 번 눌러서 해제하시면 돼요."}
                </p>
                <div className="flex items-center gap-2 shrink-0 text-xs flex-wrap">
                  {!editMode && (
                    <>
                      <button
                        onClick={selectAll}
                        className="px-2.5 py-1 rounded-lg text-ink-soft hover:bg-warm-50 border border-warm-200"
                      >
                        전체 출석
                      </button>
                      <button
                        onClick={deselectAll}
                        className="px-2.5 py-1 rounded-lg text-ink-muted hover:bg-warm-50 border border-warm-200"
                      >
                        전체 해제
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setEditMode((v) => !v)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border ${
                      editMode
                        ? "bg-terracotta-500 text-white border-terracotta-500"
                        : "text-ink-soft border-warm-200 hover:bg-warm-50"
                    }`}
                  >
                    <Icon name="pencil" size={12} strokeWidth={2} />
                    {editMode ? "수정 완료" : "명단 수정"}
                  </button>
                </div>
              </div>

              {activeChildren.length > 0 && !editMode && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {activeChildren.map((c) => {
                    const selected = selectedIds.has(c.id);
                    const last = lastActivity.get(c.id);
                    return (
                      <div key={c.id} className="relative group">
                        <button
                          onClick={() => toggleSelected(c.id)}
                          aria-pressed={selected}
                          aria-label={
                            selected ? `${c.name} 결석 처리` : `${c.name} 출석 처리`
                          }
                          className={`px-4 py-2 rounded-xl text-sm font-medium border transition shadow-sm leading-tight ${
                            selected
                              ? "bg-sage-500 text-white border-sage-500 hover:bg-sage-600"
                              : "bg-paper text-ink-muted border-warm-200 hover:bg-warm-50 hover:border-warm-300"
                          }`}
                        >
                          <div>{c.name}</div>
                          {last && (
                            <div
                              className={`text-[10.5px] mt-0.5 tabular-nums ${
                                selected ? "text-white/75" : "text-ink-faint"
                              }`}
                            >
                              최근 {formatRelativeDate(last.lastDate)}
                            </div>
                          )}
                        </button>
                        <button
                          onClick={() => removeChild(c.id)}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-paper border border-warm-200 text-ink-faint hover:text-red-500 hover:border-red-200 inline-flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 transition shadow-sm"
                          aria-label={`${c.name} 명단에서 삭제`}
                        >
                          <Icon name="x" size={10} strokeWidth={2.4} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {activeChildren.length > 0 && editMode && (
                <div className="space-y-2 mb-4 border border-warm-100 rounded-xl divide-y divide-warm-100">
                  {activeChildren.map((c) => (
                    <EditRosterRow
                      key={c.id}
                      child={c}
                      lastActivity={lastActivity.get(c.id)}
                      onRename={(newName) => renameChild(c.id, newName)}
                      onArchive={() => archiveChild(c.id)}
                      onDelete={() => removeChild(c.id)}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {!editMode && (
            <>
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
              <div className="mt-4 pt-4 border-t border-warm-100 flex flex-wrap gap-2 text-xs">
                <button
                  onClick={exportRoster}
                  disabled={activeChildren.length === 0}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-ink-soft border border-warm-200 hover:bg-warm-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Icon name="link" size={12} strokeWidth={2} />
                  명단 내보내기 (.txt)
                </button>
                <button
                  onClick={() => rosterFileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-ink-soft border border-warm-200 hover:bg-warm-50"
                >
                  <Icon name="link" size={12} strokeWidth={2} />
                  명단 가져오기
                </button>
                <input
                  ref={rosterFileInputRef}
                  type="file"
                  accept=".txt,.csv,text/plain,text/csv"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) importRosterFile(file);
                    e.target.value = "";
                  }}
                />
                <span className="text-ink-faint self-center">
                  새 학년 시작·다른 선생님과 공유 시 유용해요.
                </span>
              </div>
            </>
          )}

          {archivedChildren.length > 0 && (
            <details className="mt-4 pt-4 border-t border-warm-100">
              <summary className="cursor-pointer text-sm text-ink-muted hover:text-ink-soft select-none inline-flex items-center gap-1.5">
                <Icon name="users" size={14} strokeWidth={1.7} />
                졸업/이동한 아이들 ({archivedChildren.length}명)
              </summary>
              <div className="mt-3 flex flex-wrap gap-2">
                {archivedChildren.map((c) => {
                  const last = lastActivity.get(c.id);
                  return (
                    <div
                      key={c.id}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-warm-50 border border-warm-100 text-sm text-ink-muted"
                    >
                      <span>{c.name}</span>
                      {last && (
                        <span className="text-[10.5px] text-ink-faint tabular-nums">
                          ({last.count}건)
                        </span>
                      )}
                      <button
                        onClick={() => unarchiveChild(c.id)}
                        className="text-xs px-2 py-0.5 rounded-md bg-paper border border-warm-200 text-ink-soft hover:bg-warm-50"
                      >
                        복귀
                      </button>
                      <button
                        onClick={() => removeChild(c.id)}
                        className="text-ink-faint hover:text-red-500"
                        aria-label={`${c.name} 명단에서 영구 삭제`}
                      >
                        <Icon name="x" size={12} strokeWidth={2.2} />
                      </button>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-ink-faint mt-2 leading-relaxed">
                이 아이들의 누적 기록은 성장 리포트에서 계속 볼 수 있어요.
              </p>
            </details>
          )}
        </section>

        <section className="bg-paper rounded-2xl border border-warm-100 p-6 shadow-card">
          <StepHeader step={2} icon="sun" title="오늘의 활동" />
          <textarea
            value={todayActivity}
            onChange={(e) => setTodayActivity(e.target.value)}
            placeholder={activityPlaceholder}
            rows={3}
            className="w-full px-3.5 py-2.5 rounded-xl border border-warm-200 bg-paper text-sm leading-relaxed focus:border-terracotta-400 focus:ring-2 focus:ring-terracotta-100 focus:outline-none resize-none"
          />
          <p className="text-xs text-ink-muted mt-2.5">
            한 번 입력하면 모든 아이의 알림장에 자연스럽게 반영돼요.
          </p>
        </section>

        {todayChildren.length > 0 && (
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
                ? `오늘 선택한 ${todayChildren.length}명에 대해서만 작성돼요. 각 아이의 관찰된 모습을 짧게 메모해 주세요.`
                : `오늘 선택한 ${todayChildren.length}명에 대해서만 작성돼요. 빠르게 토글로 선택하고, 특이사항만 짧게 메모해 주세요.`}
            </p>
            <div className="space-y-3">
              {todayChildren.map((c) => (
                <ChildRow
                  key={c.id}
                  child={c}
                  entry={entries[c.id] ?? emptyEntry(c.id)}
                  onChange={(patch) => updateEntry(c.id, patch)}
                  docType={docType}
                  memoPlaceholder={
                    docType === "gwanchal"
                      ? gwanchalMemoPlaceholder
                      : alrimMemoPlaceholder
                  }
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
            disabled={generating || todayChildren.length === 0}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-2xl font-semibold disabled:bg-warm-200 disabled:text-ink-faint disabled:cursor-not-allowed shadow-sm hover:shadow-md"
          >
            {!generating && <Icon name="sparkle" size={16} strokeWidth={2} />}
            {generating
              ? `AI가 ${DOC_LABELS[docType].name}을 작성하고 있어요...`
              : todayChildren.length === 0
                ? `오늘 기록할 아이를 먼저 선택해 주세요`
                : `오늘 ${todayChildren.length}명의 ${DOC_LABELS[docType].name} 한 번에 생성하기`}
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

        {Object.keys(notes[docType]).length > 0 && (
          <section className="bg-paper rounded-2xl border border-warm-100 p-6 shadow-card">
            <StepHeader
              step={5}
              icon="check"
              title={`완성된 ${DOC_LABELS[docType].name}`}
              right={
                <div className="flex items-center gap-2">
                  <button
                    onClick={copyAll}
                    className="inline-flex items-center gap-1.5 text-sm px-3.5 py-2 bg-ink hover:bg-ink-soft text-cream rounded-xl font-medium"
                  >
                    <Icon name="copy" size={14} strokeWidth={1.8} />
                    {copiedId === "ALL" ? "전체 복사됨" : "전체 복사"}
                  </button>
                  <button
                    onClick={() =>
                      setNotes((prev) => ({ ...prev, [docType]: {} }))
                    }
                    className="inline-flex items-center gap-1.5 text-sm px-3.5 py-2 bg-paper hover:bg-warm-50 text-ink-soft border border-warm-200 rounded-xl font-medium"
                    title="결과 영역 닫기 (누적 기록은 성장 리포트에 보존돼요)"
                  >
                    <Icon name="x" size={14} strokeWidth={2} />
                    닫기
                  </button>
                </div>
              }
            />
            <div className="grid gap-4 sm:grid-cols-2">
              {children.map((c) => {
                const text = notes[docType][c.id];
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
                        setNotes((prev) => ({
                          ...prev,
                          [docType]: { ...prev[docType], [c.id]: e.target.value },
                        }))
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

function EditRosterRow({
  child,
  lastActivity: last,
  onRename,
  onArchive,
  onDelete,
}: {
  child: Child;
  lastActivity?: KidLastActivity;
  onRename: (newName: string) => Promise<boolean>;
  onArchive: () => void;
  onDelete: () => void;
}) {
  const [draft, setDraft] = useState(child.name);
  const [saving, setSaving] = useState(false);

  // Keep the draft in sync if the underlying name changes from elsewhere.
  useEffect(() => {
    setDraft(child.name);
  }, [child.name]);

  const dirty = draft.trim() !== child.name;

  async function handleSave() {
    if (!dirty) return;
    setSaving(true);
    try {
      const ok = await onRename(draft);
      if (!ok) setDraft(child.name);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 px-3 py-2.5">
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSave();
          else if (e.key === "Escape") setDraft(child.name);
        }}
        className="flex-1 min-w-[8rem] px-3 py-1.5 rounded-lg border border-warm-200 bg-paper text-sm focus:border-terracotta-400 focus:ring-2 focus:ring-terracotta-100 focus:outline-none"
      />
      {last && (
        <span className="text-[11px] text-ink-muted tabular-nums whitespace-nowrap">
          누적 {last.count}건 · 최근 {formatRelativeDate(last.lastDate)}
        </span>
      )}
      <button
        onClick={handleSave}
        disabled={!dirty || saving}
        className="text-xs px-2.5 py-1 rounded-lg bg-sage-500 hover:bg-sage-600 text-white disabled:bg-warm-200 disabled:text-ink-faint disabled:cursor-not-allowed"
      >
        저장
      </button>
      <button
        onClick={onArchive}
        className="text-xs px-2.5 py-1 rounded-lg text-ink-soft border border-warm-200 hover:bg-warm-50"
        title="명단에서 빼되 누적 기록은 보존"
      >
        졸업/이동
      </button>
      <button
        onClick={onDelete}
        className="text-xs px-2.5 py-1 rounded-lg text-ink-muted hover:text-red-600 hover:bg-red-50"
      >
        삭제
      </button>
    </div>
  );
}

function ChildRow({
  child,
  entry,
  onChange,
  docType,
  memoPlaceholder,
}: {
  child: Child;
  entry: DailyEntry;
  onChange: (patch: Partial<DailyEntry>) => void;
  docType: DocType;
  memoPlaceholder: string;
}) {
  const isGwanchal = docType === "gwanchal";
  const placeholder = memoPlaceholder;
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
        <h2 className="text-base sm:text-lg font-semibold text-ink">{title}</h2>
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
