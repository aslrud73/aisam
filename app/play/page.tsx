"use client";

import { useState, useRef } from "react";
import { getAuthHeaders, loadSettings } from "../lib/settings";
import { fetchErrorMessage, friendlyError } from "../lib/errorMessage";
import { SetupBanner } from "../components/SetupBanner";
import { Icon, type IconName } from "../components/Icon";
import { PlayIllust } from "../components/illustrations";
import LicenseModal from "../components/LicenseModal";
import { isLicensed } from "../lib/license";
import { SampleBanner, TrySampleButton } from "../components/SampleBanner";
import {
  SAMPLE_PLAY_INPUT,
  SAMPLE_PLAY_JOURNAL,
} from "../lib/samples";
import {
  savePlayJournal,
  listPlayJournals,
  deletePlayJournal,
  todayISO,
} from "../lib/db";
import { HistorySection, type HistoryItem } from "../components/HistorySection";

const AGE_LABELS: Record<string, string> = {
  "0-1": "만 0~1세",
  "2": "만 2세",
  "3": "만 3세",
  "4": "만 4세",
  "5": "만 5세",
  mixed: "혼합연령",
};

const AGE_OPTIONS = [
  { id: "0-1", label: "만 0~1세" },
  { id: "2", label: "만 2세" },
  { id: "3", label: "만 3세" },
  { id: "4", label: "만 4세" },
  { id: "5", label: "만 5세" },
  { id: "mixed", label: "혼합연령" },
];

const MAX_IMAGES = 5;
const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB raw — compressed before upload
const MAX_LONG_EDGE = 1280;
const JPEG_QUALITY = 0.85;

interface UploadedImage {
  id: string;
  dataUrl: string;
  name: string;
  size: number;
}

interface PlayJournal {
  theme: string;
  flow: string;
  reactions: string;
  learning: string;
  support: string;
  extension: string;
  homeConnection: string;
}

const SECTION_LABELS: Array<{ key: keyof PlayJournal; label: string }> = [
  { key: "theme", label: "놀이 주제" },
  { key: "flow", label: "놀이 흐름" },
  { key: "reactions", label: "유아의 반응" },
  { key: "learning", label: "배움 요소 (누리과정 연결)" },
  { key: "support", label: "교사 지원" },
  { key: "extension", label: "확장 놀이" },
  { key: "homeConnection", label: "가정 연계 문구" },
];

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

async function compressImage(file: File): Promise<{
  dataUrl: string;
  size: number;
}> {
  const bitmap = await createImageBitmap(file);
  const longEdge = Math.max(bitmap.width, bitmap.height);
  const scale = longEdge > MAX_LONG_EDGE ? MAX_LONG_EDGE / longEdge : 1;
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas context unavailable");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
  // Estimate bytes from base64 length
  const base64 = dataUrl.split(",")[1] ?? "";
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  const size = Math.floor((base64.length * 3) / 4) - padding;
  return { dataUrl, size };
}

export default function PlayPage() {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [note, setNote] = useState("");
  const [age, setAge] = useState("3");
  const [activityName, setActivityName] = useState("");
  const [generating, setGenerating] = useState(false);
  const [journal, setJournal] = useState<PlayJournal | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [historyVersion, setHistoryVersion] = useState(0);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [licenseModalOpen, setLicenseModalOpen] = useState(false);
  const pendingAfterLicense = useRef<(() => void) | null>(null);
  const [sampleMode, setSampleMode] = useState(false);

  function loadSample() {
    setImages([]);
    setNote(SAMPLE_PLAY_INPUT.note);
    setAge(SAMPLE_PLAY_INPUT.age);
    setActivityName(SAMPLE_PLAY_INPUT.activityName);
    setJournal(SAMPLE_PLAY_JOURNAL);
    setError(null);
    setSampleMode(true);
  }

  function clearSample() {
    setImages([]);
    setNote("");
    setAge("3");
    setActivityName("");
    setJournal(null);
    setError(null);
    setSampleMode(false);
  }

  async function handleFiles(files: FileList | null) {
    if (!files) return;
    setError(null);
    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) {
      setError(`사진은 최대 ${MAX_IMAGES}장까지 첨부할 수 있어요.`);
      return;
    }
    const accepted = Array.from(files).slice(0, remaining);
    const newImages: UploadedImage[] = [];
    for (const f of accepted) {
      if (!f.type.startsWith("image/")) {
        setError(`이미지 파일만 첨부할 수 있어요: ${f.name}`);
        continue;
      }
      if (f.size > MAX_FILE_SIZE) {
        setError(`사진 한 장은 15MB 이하여야 해요: ${f.name}`);
        continue;
      }
      try {
        const { dataUrl, size } = await compressImage(f);
        newImages.push({
          id: uid(),
          dataUrl,
          name: f.name,
          size,
        });
      } catch {
        setError(`사진을 처리하지 못했어요: ${f.name}`);
      }
    }
    if (newImages.length) setImages((prev) => [...prev, ...newImages]);
  }

  function removeImage(id: string) {
    setImages((prev) => prev.filter((i) => i.id !== id));
  }

  async function generate() {
    if (images.length === 0 && !note.trim()) {
      setError("사진을 첨부하거나 메모를 입력해 주세요.");
      return;
    }
    if (!isLicensed()) {
      pendingAfterLicense.current = () => generate();
      setLicenseModalOpen(true);
      return;
    }
    setError(null);
    setGenerating(true);
    setJournal(null);
    try {
      const res = await fetch("/api/play", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          images: images.map((i) => i.dataUrl),
          note,
          age,
          activityName,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? fetchErrorMessage(res.status));
      }
      const data: { journal: PlayJournal } = await res.json();
      setJournal(data.journal);

      const settings = loadSettings();
      savePlayJournal({
        date: todayISO(),
        activityName: activityName.trim() || undefined,
        ageBand: age,
        note: note.trim() || undefined,
        ...data.journal,
        photoThumbs: images.map((i) => i.dataUrl),
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

  function updateSection(key: keyof PlayJournal, value: string) {
    if (!journal) return;
    setJournal({ ...journal, [key]: value });
  }

  async function copyAll() {
    if (!journal) return;
    const text = SECTION_LABELS.map(
      ({ key, label }) => `[${label}]\n${journal[key]}`,
    ).join("\n\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <main data-page="play" className="max-w-4xl mx-auto px-5 py-8 pb-24 space-y-5">
      {sampleMode && <SampleBanner onClear={clearSample} />}
      <SetupBanner />
      <div className="flex items-start gap-3">
        <span className="shrink-0">
          <PlayIllust size={40} />
        </span>
        <div>
          <h1 className="text-2xl font-semibold text-ink tracking-tight">놀이기록 도우미</h1>
          <p className="text-sm text-ink-soft mt-1 leading-relaxed">
            놀이 사진과 짧은 메모만 올리면, AI가 누리과정 영역과 연결된 전문
            놀이기록을 자동으로 만들어 드려요.
          </p>
        </div>
      </div>
      {!sampleMode && !journal && images.length === 0 && !note && (
        <div className="flex justify-end">
          <TrySampleButton
            onClick={loadSample}
            label="체험해보기 (샘플 놀이기록)"
          />
        </div>
      )}

      <Step
        icon="camera"
        step={1}
        title="놀이 사진"
        hint={`최대 ${MAX_IMAGES}장, 자동으로 1280px·JPEG로 압축됩니다`}
      >
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFiles(e.dataTransfer.files);
          }}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-warm-200 hover:border-lavender-300 rounded-2xl p-7 text-center cursor-pointer transition bg-[var(--page-accent-50)]"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => {
              handleFiles(e.target.files);
              e.target.value = "";
            }}
            className="hidden"
          />
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-paper text-lavender-500 mb-2">
            <Icon name="camera" size={20} strokeWidth={1.7} />
          </span>
          <p className="text-sm text-ink-soft font-medium">
            클릭하거나 사진을 끌어다 놓으세요
          </p>
          <p className="text-xs text-ink-muted mt-1">
            아이 얼굴이 식별되지 않는 사진을 권장해요 (놀이 장면·작품·활동 위주)
          </p>
        </div>

        {images.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-4">
            {images.map((img) => (
              <div
                key={img.id}
                className="relative group aspect-square rounded-xl overflow-hidden "
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.dataUrl}
                  alt={img.name}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => removeImage(img.id)}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-ink/60 hover:bg-ink/80 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                  aria-label="사진 삭제"
                >
                  <Icon name="x" size={12} strokeWidth={2.4} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Step>

      <Step icon="pencil" step={2} title="놀이 메모 (선택)">
        <input
          value={activityName}
          onChange={(e) => setActivityName(e.target.value)}
          placeholder="활동명 (예: 봄꽃 찍기 미술놀이)"
          className="w-full px-3.5 py-2.5 mb-3 rounded-xl border border-warm-200 bg-paper text-sm focus:border-lavender-400 focus:ring-2 focus:ring-lavender-100 focus:outline-none"
        />
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="예: 물감으로 봄꽃 찍기 놀이. 손가락, 스펀지, 면봉으로 표현. 한 아이가 도구를 바꿔가며 질감 차이를 비교하는 모습 보임."
          rows={4}
          className="w-full px-3.5 py-2.5 rounded-xl border border-warm-200 bg-paper text-sm leading-relaxed focus:border-lavender-400 focus:ring-2 focus:ring-lavender-100 focus:outline-none resize-none"
        />
      </Step>

      <Step icon="users" step={3} title="연령">
        <div className="flex flex-wrap gap-2">
          {AGE_OPTIONS.map((a) => {
            const active = age === a.id;
            return (
              <button
                key={a.id}
                onClick={() => setAge(a.id)}
                className={`px-3.5 py-1.5 rounded-full border text-sm transition ${
                  active
                    ? "bg-lavender-500 text-white border-lavender-500 shadow-sm"
                    : "bg-paper text-ink-soft border-warm-200 hover:border-warm-300 hover:bg-warm-50"
                }`}
              >
                {a.label}
              </button>
            );
          })}
        </div>
      </Step>

      <div className="bg-paper rounded-2xl p-6 shadow-card">
        <button
          onClick={generate}
          disabled={generating}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-lavender-500 hover:bg-lavender-600 text-white rounded-2xl font-semibold disabled:bg-warm-200 disabled:text-ink-faint disabled:cursor-not-allowed shadow-sm hover:shadow-md"
        >
          {!generating && <Icon name="sparkle" size={16} strokeWidth={2} />}
          {generating
            ? "AI가 사진을 보며 놀이기록을 작성하고 있어요..."
            : "놀이기록 생성하기"}
        </button>
        <div className="mt-4 flex items-start gap-2 text-xs text-ink-muted leading-relaxed">
          <span className="text-warm-400 shrink-0 mt-0.5">
            <Icon name="shield" size={14} strokeWidth={1.6} />
          </span>
          <p>
            AI가 사진과 메모를 종합해 작성한 초안입니다. 외부 공유 전 반드시
            선생님이 검토해 주세요. 사진은 서버에 저장되지 않으며 생성 후 즉시
            폐기됩니다.
          </p>
        </div>
        {error && (
          <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-xl">
            {error}
          </p>
        )}
      </div>

      {journal && (
        <section className="bg-paper rounded-2xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-ink inline-flex items-center gap-2">
              <span className="text-lavender-500">
                <Icon name="check" size={18} strokeWidth={2} />
              </span>
              완성된 놀이기록
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={copyAll}
                className="inline-flex items-center gap-1.5 text-sm px-3.5 py-2 bg-[var(--page-accent-100)] hover:bg-[var(--page-accent-200)] text-[var(--page-accent-700)] rounded-xl font-medium"
              >
                <Icon name="copy" size={14} strokeWidth={1.8} />
                {copied ? "전체 복사됨" : "전체 복사"}
              </button>
              <button
                onClick={() => setJournal(null)}
                className="inline-flex items-center gap-1.5 text-sm px-3.5 py-2 bg-paper hover:bg-warm-50 text-ink-soft border border-warm-200 rounded-xl font-medium"
                title="결과 영역 닫기 (저장된 놀이기록은 아래 히스토리에서 다시 볼 수 있어요)"
              >
                <Icon name="x" size={14} strokeWidth={2} />
                닫기
              </button>
            </div>
          </div>
          <div className="space-y-4">
            {SECTION_LABELS.map(({ key, label }) => (
              <div key={key}>
                <h3 className="text-xs font-semibold text-lavender-700 mb-1.5 tracking-wide">
                  {label}
                </h3>
                <textarea
                  value={journal[key]}
                  onChange={(e) => updateSection(key, e.target.value)}
                  rows={Math.max(2, journal[key].split("\n").length + 1)}
                  className="w-full text-sm leading-relaxed bg-[var(--page-accent-50)] border-l-2 border-lavender-300 rounded-2xl p-3.5 resize-none focus:outline-none text-ink-soft"
                />
              </div>
            ))}
          </div>
        </section>
      )}

      <HistorySection
        key={`play-history-${historyVersion}`}
        title="지난 놀이기록"
        emptyMessage="아직 저장된 놀이기록이 없어요. 사진과 메모로 놀이기록을 한 번 만들면 이곳에 자동으로 쌓입니다."
        load={async () => {
          const rows = await listPlayJournals(50);
          return rows
            .filter((r): r is typeof r & { id: number } => r.id !== undefined)
            .map<HistoryItem>((r) => ({
              id: r.id,
              createdAt: r.createdAt,
              meta: [
                AGE_LABELS[r.ageBand] ?? r.ageBand,
                r.activityName?.trim() || "활동명 미입력",
              ],
              title: r.theme.replace(/\s+/g, " ").slice(0, 60),
              preview: r.flow.replace(/\s+/g, " ").slice(0, 80),
              detail: [
                { label: "놀이 주제", text: r.theme },
                { label: "놀이 흐름", text: r.flow },
                { label: "유아의 반응", text: r.reactions },
                { label: "배움 요소 (누리과정)", text: r.learning },
                { label: "교사 지원", text: r.support },
                { label: "확장 놀이", text: r.extension },
                { label: "가정 연계", text: r.homeConnection },
              ],
            }));
        }}
        onDelete={async (id) => {
          await deletePlayJournal(id);
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
  hint,
  children,
}: {
  step: number;
  icon: IconName;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-paper rounded-2xl p-6 shadow-card">
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-lavender-50 text-lavender-700 text-sm font-semibold tabular-nums">
          {step}
        </span>
        <span className="inline-flex items-center gap-2 text-base sm:text-lg font-semibold text-ink">
          {title}
        </span>
        {hint && <span className="text-xs text-ink-muted">{hint}</span>}
      </div>
      {children}
    </section>
  );
}
