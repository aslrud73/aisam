"use client";

import { useCallback, useEffect, useState } from "react";

const ADMIN_KEY = "ssaem-admin-secret-v1";

interface License {
  code: string;
  senderName: string;
  createdAt: string;
  devices: string[];
  status: "active" | "revoked";
  kind?: "personal" | "beta";
  deviceLimit?: number | null;
}

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

  return <AdminDashboard onLogout={logout} />;
}

function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [senderName, setSenderName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [justCreated, setJustCreated] = useState<License | null>(null);
  const [copiedCode, setCopiedCode] = useState("");
  const [betaCode, setBetaCode] = useState("");
  const [betaName, setBetaName] = useState("");
  const [betaCreating, setBetaCreating] = useState(false);
  const [betaError, setBetaError] = useState("");
  const [actionError, setActionError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "revoked" | "beta">(
    "all",
  );

  const filteredLicenses = licenses.filter((l) => {
    if (filter === "active" && (l.status !== "active" || l.kind === "beta"))
      return false;
    if (filter === "revoked" && l.status !== "revoked") return false;
    if (filter === "beta" && l.kind !== "beta") return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      if (
        !l.senderName.toLowerCase().includes(q) &&
        !l.code.toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    return true;
  });

  const counts = {
    all: licenses.length,
    active: licenses.filter((l) => l.status === "active" && l.kind !== "beta")
      .length,
    revoked: licenses.filter((l) => l.status === "revoked").length,
    beta: licenses.filter((l) => l.kind === "beta").length,
  };

  const authHeader = useCallback((): HeadersInit => {
    const pw =
      typeof window !== "undefined" ? localStorage.getItem(ADMIN_KEY) : null;
    return pw
      ? { Authorization: `Bearer ${pw}`, "Content-Type": "application/json" }
      : { "Content-Type": "application/json" };
  }, []);

  const load = useCallback(async () => {
    setLoadError("");
    try {
      const res = await fetch("/api/admin/codes", {
        headers: authHeader(),
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) {
        setLoadError(data?.error ?? "조회 실패");
        setLicenses([]);
      } else {
        setLicenses(data.licenses ?? []);
      }
    } catch {
      setLoadError("연결에 문제가 있어요.");
    } finally {
      setLoading(false);
    }
  }, [authHeader]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = senderName.trim();
    if (!name) return;
    setCreating(true);
    setCreateError("");
    try {
      const res = await fetch("/api/admin/codes", {
        method: "POST",
        headers: authHeader(),
        body: JSON.stringify({ senderName: name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCreateError(data?.error ?? "코드 생성 실패");
      } else {
        setJustCreated(data.license);
        setSenderName("");
        setLicenses((prev) => [data.license, ...prev]);
      }
    } catch {
      setCreateError("연결에 문제가 있어요.");
    } finally {
      setCreating(false);
    }
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(text);
      setTimeout(() => setCopiedCode(""), 1500);
    } catch {
      /* ignore */
    }
  };

  const handleCreateBeta = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = betaCode.trim();
    const name = betaName.trim();
    if (!code || !name) return;
    setBetaCreating(true);
    setBetaError("");
    try {
      const res = await fetch("/api/admin/codes", {
        method: "POST",
        headers: authHeader(),
        body: JSON.stringify({
          senderName: name,
          kind: "beta",
          customCode: code,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setBetaError(data?.error ?? "베타 코드 생성 실패");
      } else {
        setJustCreated(data.license);
        setBetaCode("");
        setBetaName("");
        setLicenses((prev) => [data.license, ...prev]);
      }
    } catch {
      setBetaError("연결에 문제가 있어요.");
    } finally {
      setBetaCreating(false);
    }
  };

  const patchLicense = async (
    code: string,
    action: "revoke" | "reactivate" | "resetDevices",
  ) => {
    setActionError("");
    try {
      const res = await fetch(
        `/api/admin/codes/${encodeURIComponent(code)}`,
        {
          method: "PATCH",
          headers: authHeader(),
          body: JSON.stringify({ action }),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        setActionError(data?.error ?? "작업 실패");
        return;
      }
      setLicenses((prev) =>
        prev.map((l) => (l.code === data.license.code ? data.license : l)),
      );
    } catch {
      setActionError("연결에 문제가 있어요.");
    }
  };

  const deleteLicenseEntry = async (code: string) => {
    setActionError("");
    try {
      const res = await fetch(
        `/api/admin/codes/${encodeURIComponent(code)}`,
        {
          method: "DELETE",
          headers: authHeader(),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setActionError(data?.error ?? "삭제 실패");
        return;
      }
      setLicenses((prev) => prev.filter((l) => l.code !== code));
    } catch {
      setActionError("연결에 문제가 있어요.");
    }
  };

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
          onClick={onLogout}
          className="text-xs text-ink-muted hover:text-ink underline underline-offset-2 shrink-0"
        >
          로그아웃
        </button>
      </div>

      <section className="bg-paper rounded-2xl shadow-card p-6 space-y-3">
        <h2 className="text-base font-semibold text-ink">새 코드 발급</h2>
        <p className="text-xs text-ink-muted">
          송금자명(또는 식별용 메모)을 입력하면 새 라이선스 코드가 만들어져요.
          이 코드를 인스타 DM으로 회신하세요.
        </p>
        <form onSubmit={handleCreate} className="flex gap-2">
          <input
            type="text"
            value={senderName}
            onChange={(e) => setSenderName(e.target.value)}
            placeholder="예: 김선생 / 010-1234-5678 / 인스타닉네임"
            className="flex-1 px-4 py-3 rounded-xl border border-warm-200 bg-cream-50 focus:outline-none focus:ring-2 focus:ring-coral-300 text-sm"
          />
          <button
            type="submit"
            disabled={creating || !senderName.trim()}
            className="px-5 py-3 rounded-2xl bg-coral-500 hover:bg-coral-600 text-white font-semibold disabled:opacity-50 transition text-sm whitespace-nowrap"
          >
            {creating ? "발급 중..." : "코드 생성"}
          </button>
        </form>
        {createError && (
          <p className="text-sm text-coral-600 leading-relaxed">
            {createError}
          </p>
        )}
        {justCreated && (
          <div className="mt-3 p-4 rounded-xl bg-coral-50 border border-coral-200 space-y-2">
            <p className="text-xs text-ink-muted">
              <strong>{justCreated.senderName}</strong>님에게 발급된 코드:
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <code className="text-lg font-bold text-coral-700 bg-paper px-3 py-1.5 rounded-lg select-all">
                {justCreated.code}
              </code>
              <button
                type="button"
                onClick={() => copy(justCreated.code)}
                className="text-xs font-semibold bg-coral-100 hover:bg-coral-200 text-coral-700 rounded-lg px-3 py-1.5"
              >
                {copiedCode === justCreated.code ? "복사됨!" : "복사"}
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="bg-paper rounded-2xl shadow-card p-6 space-y-3">
        <h2 className="text-base font-semibold text-ink">베타 코드 발급</h2>
        <p className="text-xs text-ink-muted">
          베타 코드는 <strong>기기 수 제한이 없어요.</strong> 베타 기간 동안
          누구나 사용 가능. 정식 출시 시 정지 버튼으로 일괄 차단할 수 있어요.
        </p>
        <form onSubmit={handleCreateBeta} className="space-y-2">
          <input
            type="text"
            value={betaCode}
            onChange={(e) => setBetaCode(e.target.value.toUpperCase())}
            placeholder="코드 이름 (예: BETA2026)"
            className="w-full px-4 py-3 rounded-xl border border-warm-200 bg-cream-50 focus:outline-none focus:ring-2 focus:ring-coral-300 text-sm font-mono tracking-wide uppercase"
            spellCheck={false}
          />
          <div className="flex gap-2">
            <input
              type="text"
              value={betaName}
              onChange={(e) => setBetaName(e.target.value)}
              placeholder="메모 (예: 2026년 5월 베타 사용자용)"
              className="flex-1 px-4 py-3 rounded-xl border border-warm-200 bg-cream-50 focus:outline-none focus:ring-2 focus:ring-coral-300 text-sm"
            />
            <button
              type="submit"
              disabled={betaCreating || !betaCode.trim() || !betaName.trim()}
              className="px-5 py-3 rounded-2xl bg-coral-500 hover:bg-coral-600 text-white font-semibold disabled:opacity-50 transition text-sm whitespace-nowrap"
            >
              {betaCreating ? "발급 중..." : "베타 코드"}
            </button>
          </div>
        </form>
        {betaError && (
          <p className="text-sm text-coral-600 leading-relaxed">{betaError}</p>
        )}
      </section>

      <section className="bg-paper rounded-2xl shadow-card p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink">
            발급된 코드 ({filteredLicenses.length}
            {filteredLicenses.length !== licenses.length && ` / ${licenses.length}`}
            )
          </h2>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              load();
            }}
            className="text-xs text-ink-muted hover:text-ink underline underline-offset-2"
          >
            새로고침
          </button>
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="송금자명 또는 코드로 검색"
          className="w-full px-4 py-2.5 rounded-xl border border-warm-200 bg-cream-50 focus:outline-none focus:ring-2 focus:ring-coral-300 text-sm"
        />
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              { id: "all", label: "전체" },
              { id: "active", label: "활성" },
              { id: "beta", label: "베타" },
              { id: "revoked", label: "정지" },
            ] as const
          ).map((t) => {
            const active = filter === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setFilter(t.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                  active
                    ? "bg-coral-500 text-white border-coral-500 shadow-sm"
                    : "bg-paper text-ink-soft border-warm-200 hover:bg-warm-50"
                }`}
              >
                {t.label} <span className={active ? "text-white/80" : "text-ink-muted"}>({counts[t.id]})</span>
              </button>
            );
          })}
        </div>
        {loadError && (
          <p className="text-sm text-coral-600 leading-relaxed">{loadError}</p>
        )}
        {actionError && (
          <p className="text-sm text-coral-600 leading-relaxed">
            {actionError}
          </p>
        )}
        {loading ? (
          <p className="text-sm text-ink-muted">불러오는 중...</p>
        ) : licenses.length === 0 ? (
          <p className="text-sm text-ink-muted">아직 발급된 코드가 없어요.</p>
        ) : filteredLicenses.length === 0 ? (
          <p className="text-sm text-ink-muted">
            조건에 맞는 코드가 없어요. 검색어나 필터를 바꿔보세요.
          </p>
        ) : (
          <ul className="divide-y divide-warm-100">
            {filteredLicenses.map((l) => {
              const isBeta = l.kind === "beta";
              const limitText =
                l.deviceLimit === null
                  ? "무제한"
                  : `${l.devices.length}/${l.deviceLimit ?? 2}`;
              const isRevoked = l.status === "revoked";
              return (
                <li
                  key={l.code}
                  className="py-3 space-y-2"
                >
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink flex items-center gap-1.5">
                        {l.senderName}
                        {isBeta && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-mustard-100 text-mustard-700">
                            BETA
                          </span>
                        )}
                        {isRevoked && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-warm-100 text-ink-muted">
                            정지됨
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-ink-muted mt-0.5">
                        {new Date(l.createdAt).toLocaleDateString("ko-KR", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                        })}
                        {" · 기기 "}
                        {limitText}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <code className="text-sm font-bold text-coral-700 bg-coral-50 px-2.5 py-1 rounded-lg select-all">
                        {l.code}
                      </code>
                      <button
                        type="button"
                        onClick={() => copy(l.code)}
                        className="text-xs font-semibold bg-coral-100 hover:bg-coral-200 text-coral-700 rounded-lg px-2.5 py-1"
                      >
                        {copiedCode === l.code ? "복사됨!" : "복사"}
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {isRevoked ? (
                      <button
                        type="button"
                        onClick={() => patchLicense(l.code, "reactivate")}
                        className="text-xs font-semibold bg-sage-100 hover:bg-sage-200 text-sage-700 rounded-lg px-2.5 py-1"
                      >
                        다시 활성화
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            confirm(
                              `${l.code} 코드를 정지할까요?\n이 코드를 쓰는 모든 기기가 다음 접속 시 차단돼요.`,
                            )
                          ) {
                            patchLicense(l.code, "revoke");
                          }
                        }}
                        className="text-xs font-semibold bg-warm-100 hover:bg-warm-200 text-ink-soft rounded-lg px-2.5 py-1"
                      >
                        정지
                      </button>
                    )}
                    {l.devices.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            confirm(
                              `${l.code} 의 등록된 기기를 모두 해제할까요?`,
                            )
                          ) {
                            patchLicense(l.code, "resetDevices");
                          }
                        }}
                        className="text-xs font-semibold bg-warm-100 hover:bg-warm-200 text-ink-soft rounded-lg px-2.5 py-1"
                      >
                        기기 초기화
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          confirm(
                            `${l.code} 코드를 영구 삭제할까요?\n\n주의: 되돌릴 수 없어요.\n발급 기록과 등록 기기 정보가 모두 사라져요.`,
                          )
                        ) {
                          deleteLicenseEntry(l.code);
                        }
                      }}
                      className="text-xs font-semibold bg-coral-50 hover:bg-coral-100 text-coral-700 border border-coral-200 rounded-lg px-2.5 py-1"
                    >
                      삭제
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
