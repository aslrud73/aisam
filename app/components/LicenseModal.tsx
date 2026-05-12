"use client";

import { useEffect, useState } from "react";
import { verifyAndRegister } from "../lib/license";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function LicenseModal({ open, onClose, onSuccess }: Props) {
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      setCode("");
      setError("");
      setSubmitting(false);
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;
    setError("");
    setSubmitting(true);
    const result = await verifyAndRegister(trimmed);
    setSubmitting(false);
    if (result.ok) {
      onSuccess();
    } else {
      setError(result.message ?? "확인에 실패했어요.");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm flex items-center justify-center px-4 py-8"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-paper rounded-3xl shadow-card w-full max-w-md p-6 space-y-4">
        <div className="space-y-1.5">
          <h2 className="text-xl font-semibold text-ink tracking-tight">
            쌤노트를 시작하기 전에
          </h2>
          <p className="text-sm text-ink-soft leading-relaxed">
            현재 베타 기간입니다. 아래 코드로 자유롭게 사용하실 수 있어요.
          </p>
        </div>

        <div className="rounded-2xl bg-coral-50 border border-coral-200 px-4 py-3 space-y-1">
          <p className="text-xs text-ink-muted">베타 코드</p>
          <p className="text-lg font-bold text-coral-700 tracking-wide select-all">
            BETA2026
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block">
            <span className="text-sm font-semibold text-ink">코드 입력</span>
            <input
              type="text"
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="베타 코드 또는 발급받은 코드"
              className="mt-1.5 w-full px-4 py-3 rounded-xl border border-warm-200 bg-cream-50 focus:outline-none focus:ring-2 focus:ring-coral-300 text-sm font-mono tracking-wide"
              spellCheck={false}
              autoCapitalize="characters"
            />
          </label>
          {error && (
            <p className="text-sm text-coral-600 leading-relaxed">{error}</p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-2xl bg-cream-50 border border-warm-200 text-ink-soft text-sm font-semibold hover:bg-warm-50 transition"
            >
              나중에
            </button>
            <button
              type="submit"
              disabled={submitting || !code.trim()}
              className="flex-[2] px-4 py-3 rounded-2xl bg-coral-500 hover:bg-coral-600 text-white font-semibold disabled:opacity-50 transition text-sm"
            >
              {submitting ? "확인 중..." : "시작하기"}
            </button>
          </div>
        </form>

        <p className="text-xs text-ink-muted leading-relaxed pt-2 border-t border-warm-100">
          정식 출시 후엔 1인당 2기기 제한 코드가 발급됩니다. 베타 사용자에겐
          특별 혜택을 준비 중이에요.
        </p>
      </div>
    </div>
  );
}
