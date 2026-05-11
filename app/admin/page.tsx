"use client";

import { useEffect, useState } from "react";

const ADMIN_KEY = "ssaem-admin-secret-v1";

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const saved =
      typeof window !== "undefined" ? localStorage.getItem(ADMIN_KEY) : null;
    if (!saved) {
      setChecking(false);
      return;
    }
    (async () => {
      try {
        const res = await fetch("/api/admin/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: saved }),
        });
        if (res.ok) {
          setAuthed(true);
        } else {
          localStorage.removeItem(ADMIN_KEY);
        }
      } catch {
        /* 네트워크 에러 시 로그인 화면 표시 */
      } finally {
        setChecking(false);
      }
    })();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        localStorage.setItem(ADMIN_KEY, password);
        setAuthed(true);
        setPassword("");
      } else if (res.status === 500) {
        setError(
          "서버에 관리자 비밀번호가 설정되어 있지 않아요. Vercel에서 ADMIN_SECRET 환경변수를 먼저 등록해주세요.",
        );
      } else {
        setError("비밀번호가 맞지 않아요.");
      }
    } catch {
      setError("연결에 문제가 있어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  const logout = () => {
    localStorage.removeItem(ADMIN_KEY);
    setAuthed(false);
    setPassword("");
  };

  if (checking) {
    return (
      <main className="max-w-md mx-auto px-5 py-16 text-center text-sm text-ink-soft">
        확인 중...
      </main>
    );
  }

  if (!authed) {
    return (
      <main className="max-w-md mx-auto px-5 py-12">
        <div className="bg-paper rounded-2xl shadow-card p-6 space-y-4">
          <h1 className="text-xl font-semibold text-ink">관리자 로그인</h1>
          <p className="text-sm text-ink-soft">
            관리자 비밀번호를 입력해주세요.
          </p>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-warm-200 bg-cream-50 focus:outline-none focus:ring-2 focus:ring-coral-300"
              placeholder="비밀번호"
            />
            {error && (
              <p className="text-sm text-coral-600 leading-relaxed">{error}</p>
            )}
            <button
              type="submit"
              disabled={submitting || !password}
              className="w-full px-4 py-3 rounded-2xl bg-coral-500 hover:bg-coral-600 text-white font-semibold disabled:opacity-50 transition"
            >
              {submitting ? "확인 중..." : "로그인"}
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-5 py-8 space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink tracking-tight">
            관리자 페이지
          </h1>
          <p className="text-sm text-ink-soft mt-1">
            라이선스 코드 발급 및 관리
          </p>
        </div>
        <button
          type="button"
          onClick={logout}
          className="text-xs text-ink-muted hover:text-ink underline underline-offset-2 shrink-0"
        >
          로그아웃
        </button>
      </div>

      <section className="bg-paper rounded-2xl shadow-card p-6 space-y-2">
        <h2 className="text-base font-semibold text-ink">곧 추가될 기능</h2>
        <ul className="text-sm text-ink-soft list-disc pl-5 space-y-1">
          <li>송금자명 입력 → 라이선스 코드 자동 생성</li>
          <li>발급된 코드 목록 (송금자명, 코드, 사용 기기 수, 발급일)</li>
          <li>코드별 강제 reset (분실 시)</li>
        </ul>
      </section>
    </main>
  );
}
