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
      setCounts({
        dailyEntries: 0,
        parentReplies: 0,
        playJournals: 0,
        growthReports: 0,
      });
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
        `${mode === "replace" ? "덮어쓰기" : "병합"} 완료 — 알림장 ${result.imported.dailyEntries}건, 학부모 답변 ${result.imported.parentReplies}건, 놀이기록 ${result.imported.playJournals}건, 성장 리포트 ${result.imported.growthReports}건 가져옴`,
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
    <section className="bg-paper rounded-2xl p-6 space-y-5 shadow-card">
      <div>
        <h2 className="text-lg font-semibold text-ink">데이터 관리</h2>
        <p className="text-sm text-ink-soft mt-1 leading-relaxed">
          모든 기록은 이 기기의 브라우저 안에만 저장됩니다. 다른 기기에서 쓰시려면
          내보낸 백업 파일을 옮긴 뒤 가져오세요.
        </p>
      </div>

      <div className="bg-terracotta-50 border-l-4 border-terracotta-300 rounded-r-xl p-3.5 text-sm text-ink-soft leading-relaxed">
        <p className="font-semibold text-terracotta-700 mb-1">
          ⚠️ 주기적 백업을 권장드려요
        </p>
        <p>
          데이터가 이 기기 브라우저에만 저장돼요. 브라우저 캐시를 지우거나
          기기에 문제가 생기면 누적 기록이 한 번에 사라질 수 있어요.{" "}
          <strong>한 달에 한 번 정도</strong> 아래{" "}
          <strong>전체 내보내기 (.json)</strong>로 백업 파일을 만들어 두면
          안심돼요. 새 기기로 옮길 때도 이 파일이 필요해요.
        </p>
      </div>

      {counts && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center bg-cream-100 rounded-2xl p-4 ">
          <div>
            <div className="text-2xl font-semibold text-ink tabular-nums">
              {counts.dailyEntries}
            </div>
            <div className="text-xs text-ink-muted mt-1">알림장·관찰일지</div>
          </div>
          <div>
            <div className="text-2xl font-semibold text-ink tabular-nums">
              {counts.parentReplies}
            </div>
            <div className="text-xs text-ink-muted mt-1">학부모 답변</div>
          </div>
          <div>
            <div className="text-2xl font-semibold text-ink tabular-nums">
              {counts.playJournals}
            </div>
            <div className="text-xs text-ink-muted mt-1">놀이기록</div>
          </div>
          <div>
            <div className="text-2xl font-semibold text-ink tabular-nums">
              {counts.growthReports}
            </div>
            <div className="text-xs text-ink-muted mt-1">성장 리포트</div>
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
            className="accent-terracotta-500 w-4 h-4"
          />
          <label htmlFor="include-photos" className="text-sm text-ink-soft">
            놀이기록의 사진 썸네일도 함께 내보내기 (파일이 커집니다)
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={doExport}
            disabled={busy}
            className="px-4 py-2.5 bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-xl text-sm font-medium shadow-sm disabled:bg-warm-200 disabled:cursor-not-allowed disabled:shadow-none"
          >
            전체 내보내기 (.json)
          </button>
          <button
            onClick={() => pickAndImport("merge")}
            disabled={busy}
            className="px-4 py-2.5 bg-paper border border-warm-200 text-ink-soft rounded-xl text-sm font-medium hover:bg-warm-50 hover:border-warm-300 disabled:opacity-50"
          >
            가져와서 병합
          </button>
          <button
            onClick={() => pickAndImport("replace")}
            disabled={busy}
            className="px-4 py-2.5 bg-paper border border-warm-200 text-ink-soft rounded-xl text-sm font-medium hover:bg-warm-50 hover:border-warm-300 disabled:opacity-50"
          >
            가져와서 덮어쓰기
          </button>
          <button
            onClick={clearAll}
            disabled={busy}
            className="px-4 py-2.5 text-sm text-ink-muted hover:text-red-600 disabled:opacity-50"
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
          <p className="text-sm text-sage-600 bg-sage-50 border border-sage-100 px-3 py-2 rounded-xl">
            {message}
          </p>
        )}
        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-xl">
            {error}
          </p>
        )}
      </div>
    </section>
  );
}
