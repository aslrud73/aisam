"use client";

import { useState, useRef } from "react";

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
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setError(null);
    setGenerating(true);
    setJournal(null);
    try {
      const res = await fetch("/api/play", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          images: images.map((i) => i.dataUrl),
          note,
          age,
          activityName,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `요청 실패 (${res.status})`);
      }
      const data: { journal: PlayJournal } = await res.json();
      setJournal(data.journal);
    } catch (e) {
      setError(e instanceof Error ? e.message : "알 수 없는 오류");
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
    <main className="max-w-3xl mx-auto px-5 py-8 pb-24 space-y-6">
      <div>
        <h1 className="font-display text-2xl text-stone-800">놀이기록 도우미</h1>
        <p className="text-sm text-stone-500 mt-1 leading-relaxed">
          놀이 사진과 짧은 메모만 올리면, AI가 누리과정 영역과 연결된 전문
          놀이기록을 자동으로 만들어 드려요.
        </p>
      </div>

      {/* 1. 사진 첨부 */}
      <section className="bg-white rounded-2xl border border-stone-200 p-6">
        <label className="font-display text-lg text-stone-800 mb-3 block">
          <span className="text-terracotta mr-2">1</span>놀이 사진
          <span className="text-xs text-stone-500 font-sans ml-2">
            (최대 {MAX_IMAGES}장, 자동으로 1280px·JPEG로 압축됩니다)
          </span>
        </label>

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFiles(e.dataTransfer.files);
          }}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-stone-300 hover:border-terracotta rounded-xl p-6 text-center cursor-pointer transition bg-cream/30"
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
          <p className="text-sm text-stone-600">
            클릭하거나 사진을 끌어다 놓으세요
          </p>
          <p className="text-xs text-stone-400 mt-1">
            아이 얼굴이 식별되지 않는 사진을 권장해요 (놀이 장면·작품·활동 위주)
          </p>
        </div>

        {images.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-4">
            {images.map((img) => (
              <div
                key={img.id}
                className="relative group aspect-square rounded-lg overflow-hidden border border-stone-200"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.dataUrl}
                  alt={img.name}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => removeImage(img.id)}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                  aria-label="사진 삭제"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 2. 메모 */}
      <section className="bg-white rounded-2xl border border-stone-200 p-6">
        <label className="font-display text-lg text-stone-800 mb-3 block">
          <span className="text-terracotta mr-2">2</span>놀이 메모 (선택)
        </label>
        <input
          value={activityName}
          onChange={(e) => setActivityName(e.target.value)}
          placeholder="활동명 (예: 봄꽃 찍기 미술놀이)"
          className="w-full px-3 py-2 mb-3 rounded-lg border border-stone-300 focus:border-terracotta focus:outline-none text-sm"
        />
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="예: 물감으로 봄꽃 찍기 놀이. 손가락, 스펀지, 면봉으로 표현. 한 아이가 도구를 바꿔가며 질감 차이를 비교하는 모습 보임."
          rows={4}
          className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:border-terracotta focus:outline-none text-sm leading-relaxed"
        />
      </section>

      {/* 3. 연령 */}
      <section className="bg-white rounded-2xl border border-stone-200 p-6">
        <label className="font-display text-lg text-stone-800 mb-3 block">
          <span className="text-terracotta mr-2">3</span>연령
        </label>
        <div className="flex flex-wrap gap-2">
          {AGE_OPTIONS.map((a) => {
            const active = age === a.id;
            return (
              <button
                key={a.id}
                onClick={() => setAge(a.id)}
                className={`px-3 py-1.5 rounded-full border text-sm transition ${
                  active
                    ? "bg-terracotta text-white border-terracotta"
                    : "bg-white text-stone-700 border-stone-300 hover:border-stone-400"
                }`}
              >
                {a.label}
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
          {generating
            ? "AI가 사진을 보며 놀이기록을 작성하고 있어요..."
            : "놀이기록 생성하기"}
        </button>
        <p className="mt-3 text-xs text-stone-500 leading-relaxed">
          ※ AI가 사진과 메모를 종합해 작성한 초안입니다. 외부 공유 전 반드시
          선생님이 검토해 주세요. 사진은 서버에 저장되지 않으며 생성 후 즉시
          폐기됩니다.
        </p>
        {error && (
          <p className="mt-3 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
            {error}
          </p>
        )}
      </div>

      {/* Result */}
      {journal && (
        <section className="bg-white rounded-2xl border border-stone-200 p-6">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="font-display text-lg text-stone-800">완성된 놀이기록</h2>
            <button
              onClick={copyAll}
              className="text-sm px-3 py-1.5 bg-stone-800 text-white rounded-lg hover:bg-stone-700"
            >
              {copied ? "✓ 전체 복사됨" : "전체 복사"}
            </button>
          </div>
          <div className="space-y-4">
            {SECTION_LABELS.map(({ key, label }) => (
              <div key={key}>
                <h3 className="font-display text-sm text-terracotta mb-1.5">
                  {label}
                </h3>
                <textarea
                  value={journal[key]}
                  onChange={(e) => updateSection(key, e.target.value)}
                  rows={Math.max(2, journal[key].split("\n").length + 1)}
                  className="w-full text-sm leading-relaxed bg-cream/40 border border-stone-200 rounded-lg p-3 resize-none focus:outline-none focus:border-terracotta text-stone-700"
                />
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
