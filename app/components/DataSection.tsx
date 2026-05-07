"use client";

import { useEffect, useRef, useState } from "react";
import {
  exportAll,
  importAll,
  downloadBundle,
  getCounts,
  clearAllData,
  type CountSummary,
} from "../lib/db";

export function DataSection() {
  const [counts, setCounts] = useState<CountSummary | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [includePhotos, setIncludePhotos] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function refresh() {
    try {
      setCounts(await getCounts());
    } catch {
      setCounts({ dailyEntries: 0, parentReplies: 0, playJournals: 0 });
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  function flash(kind: "ok" | "err", text: string) {
    if (kind === "ok") {
      setMessage(text);
      setError(null);
      setTimeout(() => setMessage(null), 3000);
    } else {
      setError(text);
      setMessage(null);
    }
  }

  async function doExport() {
    setBusy(true);
    setError(null);
    try {
      const bundle = await exportAll({ includePhotos });
      downloadBundle(bundle);
      flash("ok", "백업 파일이 다운로드되었어요.");
    } catch (e) {
      flash("err", e instanceof Error ? e.message : "내보내기 실패");
    } finally {
      setBusy(false);
    }
  }

  async function doImport(file: File, mode: "replace" | "merge") {
    setBusy(true);
    setError(null);
    try {
      const text = await file.text();
      const bundle = JSON.parse(text);
      const result = await importAll(bundle, mode);
      await refresh();
      flash(
        "ok",
        `${mode === "replace" ? "덮어쓰기" : "병합"} 완료 — 알림장 ${result.imported.dailyEntries}건, 학부모 답변 ${result.imported.parentReplies}건, 놀이기록 ${result.imported.playJournals}건 가져옴`,
      );
    } catch (e) {
      flash("err", e instanceof Error ? e.message : "가져오기 실패");
    } finally {
      setBusy(false);
    }
  }

  function pickAndImport(mode: "replace" | "merge") {
    if (mode === "replace") {
      const ok = confirm(
        "현재 기기의 모든 누적 기록(알림장·관찰일지·학부모 답변·놀이기록)을 백업 파일로 덮어쓸까요? 되돌릴 수 없어요.",
      );
      if (!ok) return;
    }
    const input = fileInputRef.current;
    if (!input) return;
    input.dataset.mode = mode;
    input.click();
  }

  async function clearAll() {
    const ok = confirm(
      "이 기기에 저장된 모든 누적 기록을 삭제할까요? 명단·설정은 유지됩니다. 되돌릴 수 없어요.",
    );
    if (!ok) return;
    setBusy(true);
    try {
      await clearAllData();
      await refresh();
      flash("ok", "모든 누적 기록이 삭제되었어요.");
    } catch (e) {
      flash("err", e instanceof Error ? e.message : "삭제 실패");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
      <div>
        <h2 className="font-display text-lg text-stone-800">데이터 관리</h2>
        <p className="text-sm text-stone-500 mt-1 leading-relaxed">
          모든 기록은 이 기기의 IndexedDB에만 저장됩니다. 다른 기기에서 쓰려면
          내보낸 백업 파일을 옮긴 뒤 가져오세요.
        </p>
      </div>

      {counts && (
        <div className="grid grid-cols-3 gap-2 text-center bg-cream/40 rounded-xl p-3">
          <div>
            <div className="text-xl font-display text-stone-800">
              {counts.dailyEntries}
            </div>
            <div className="text-xs text-stone-500">알림장·관찰일지</div>
          </div>
          <div>
            <div className="text-xl font-display text-stone-800">
              {counts.parentReplies}
            </div>
            <div className="text-xs text-stone-500">학부모 답변</div>
          </div>
          <div>
            <div className="text-xl font-display text-stone-800">
              {counts.playJournals}
            </div>
            <div className="text-xs text-stone-500">놀이기록</div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="include-photos"
            checked={includePhotos}
            onChange={(e) => setIncludePhotos(e.target.checked)}
            className="accent-terracotta"
          />
          <label htmlFor="include-photos" className="text-sm text-stone-600">
            놀이기록의 사진 썸네일도 함께 내보내기 (파일이 커집니다)
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={doExport}
            disabled={busy}
            className="px-4 py-2 bg-stone-800 text-white rounded-lg text-sm hover:bg-stone-700 disabled:bg-stone-300"
          >
            전체 내보내기 (.json)
          </button>
          <button
            onClick={() => pickAndImport("merge")}
            disabled={busy}
            className="px-4 py-2 bg-white border border-stone-300 text-stone-700 rounded-lg text-sm hover:bg-stone-50 disabled:opacity-50"
          >
            가져와서 병합
          </button>
          <button
            onClick={() => pickAndImport("replace")}
            disabled={busy}
            className="px-4 py-2 bg-white border border-stone-300 text-stone-700 rounded-lg text-sm hover:bg-stone-50 disabled:opacity-50"
          >
            가져와서 덮어쓰기
          </button>
          <button
            onClick={clearAll}
            disabled={busy}
            className="px-4 py-2 text-sm text-stone-600 hover:text-red-600 disabled:opacity-50"
          >
            누적 기록 모두 삭제
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            const mode = (fileInputRef.current?.dataset.mode ?? "merge") as
              | "replace"
              | "merge";
            if (file) doImport(file, mode);
            e.target.value = "";
          }}
        />

        {message && (
          <p className="text-sm text-sage bg-sage/10 px-3 py-2 rounded-lg">
            {message}
          </p>
        )}
        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
            {error}
          </p>
        )}
      </div>
    </section>
  );
}
