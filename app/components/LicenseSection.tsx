"use client";

import { useEffect, useState } from "react";
import {
  loadLicense,
  releaseThisDevice,
  verifyAndRegister,
  type StoredLicense,
} from "../lib/license";
import { getDeviceId } from "../lib/deviceId";
import { Icon } from "./Icon";

export function LicenseSection() {
  const [license, setLicense] = useState<StoredLicense | null>(null);
  const [deviceId, setDeviceId] = useState("");
  const [hydrated, setHydrated] = useState(false);

  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [releasing, setReleasing] = useState(false);

  useEffect(() => {
    setLicense(loadLicense());
    setDeviceId(getDeviceId());
    setHydrated(true);
  }, []);

  if (!hydrated) {
    return (
      <section className="bg-paper rounded-2xl shadow-card p-6">
        <h2 className="text-base font-semibold text-ink">라이선스</h2>
      </section>
    );
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;
    setSubmitting(true);
    setError("");
    const result = await verifyAndRegister(trimmed);
    setSubmitting(false);
    if (result.ok && result.license) {
      setLicense(result.license);
      setCode("");
    } else {
      setError(result.message ?? "확인에 실패했어요.");
    }
  };

  const handleRelease = async () => {
    if (
      !confirm(
        "이 기기에서 코드를 해제할까요?\n다른 기기 등록 한도를 비워줄 수 있어요.\n다시 사용하려면 코드를 다시 입력해야 해요.",
      )
    ) {
      return;
    }
    setReleasing(true);
    const result = await releaseThisDevice();
    setReleasing(false);
    if (result.ok) {
      setLicense(null);
    } else {
      alert(result.error ?? "해제 실패");
    }
  };

  if (!license) {
    return (
      <section className="bg-paper rounded-2xl shadow-card p-6 space-y-3">
        <h2 className="text-base font-semibold text-ink inline-flex items-center gap-2">
          <span className="text-coral-500">
            <Icon name="key" size={16} strokeWidth={1.8} />
          </span>
          라이선스 코드
        </h2>
        <p className="text-sm text-ink-soft leading-relaxed">
          현재 베타 기간입니다. 베타 코드{" "}
          <code className="font-bold text-coral-700 bg-coral-50 px-1.5 py-0.5 rounded">
            BETA2026
          </code>
          으로 자유롭게 사용하실 수 있어요.
        </p>
        <form onSubmit={handleVerify} className="flex gap-2">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="코드 입력"
            className="flex-1 px-4 py-3 rounded-xl border border-warm-200 bg-cream-50 focus:outline-none focus:ring-2 focus:ring-coral-300 text-sm font-mono tracking-wide"
            spellCheck={false}
            autoCapitalize="characters"
          />
          <button
            type="submit"
            disabled={submitting || !code.trim()}
            className="px-5 py-3 rounded-2xl bg-coral-500 hover:bg-coral-600 text-white font-semibold disabled:opacity-50 transition text-sm whitespace-nowrap"
          >
            {submitting ? "확인 중..." : "등록"}
          </button>
        </form>
        {error && (
          <p className="text-sm text-coral-600 leading-relaxed">{error}</p>
        )}
      </section>
    );
  }

  const isBeta = license.kind === "beta";
  const limitText =
    license.deviceLimit === null
      ? "무제한"
      : `${license.devices.length}/${license.deviceLimit}`;

  return (
    <section className="bg-paper rounded-2xl shadow-card p-6 space-y-3">
      <h2 className="text-base font-semibold text-ink inline-flex items-center gap-2">
        <span className="text-sage-500">
          <Icon name="check" size={16} strokeWidth={1.8} />
        </span>
        라이선스 등록됨
      </h2>
      <div className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <code className="text-sm font-bold text-coral-700 bg-coral-50 px-2.5 py-1 rounded-lg select-all">
            {license.code}
          </code>
          {isBeta && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-mustard-100 text-mustard-700">
              BETA
            </span>
          )}
        </div>
        <p className="text-xs text-ink-muted">
          등록된 기기: {limitText}
          {!isBeta && " (PC + 폰 등 2대까지 사용 가능)"}
        </p>
      </div>
      <div className="pt-2 border-t border-warm-100 space-y-2">
        <p className="text-xs text-ink-muted">
          이 기기 ID:{" "}
          <code className="bg-warm-50 px-1.5 py-0.5 rounded text-[10px]">
            {deviceId.slice(0, 12)}…
          </code>
        </p>
        <button
          type="button"
          onClick={handleRelease}
          disabled={releasing}
          className="text-xs font-semibold bg-warm-100 hover:bg-warm-200 text-ink-soft rounded-lg px-3 py-1.5 disabled:opacity-50"
        >
          {releasing ? "해제 중..." : "이 기기에서 코드 해제"}
        </button>
        <p className="text-[11px] text-ink-muted leading-relaxed">
          기기 변경 시 옛 기기에서 먼저 해제해주세요. 정식 출시 후엔 1코드당
          2기기까지 사용 가능합니다.
        </p>
      </div>
    </section>
  );
}
