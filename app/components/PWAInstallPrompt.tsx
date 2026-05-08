"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const DISMISS_KEY = "pwa-install-dismissed";

export function PWAInstallPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOS, setShowIOS] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    // 이미 standalone(설치된) 모드면 안내 안 함
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as { standalone?: boolean }).standalone === true;
    if (isStandalone) return;

    // 이전에 닫은 상태면 다시 안 띄움
    if (localStorage.getItem(DISMISS_KEY)) return;

    setHidden(false);

    // iOS Safari 감지 (beforeinstallprompt 미지원이라 수동 안내)
    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua);
    const isInWebView = /CriOS|FxiOS|EdgiOS/i.test(ua); // iOS Chrome/FF 등은 설치 불가
    if (isIOS && !isInWebView) {
      setShowIOS(true);
    }

    // 안드로이드 크롬 등의 자동 설치 프롬프트 가로채기
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    // 설치 완료되면 사라짐
    const onInstalled = () => {
      setHidden(true);
      setInstallEvent(null);
      setShowIOS(false);
    };
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setHidden(true);
  }

  async function install() {
    if (!installEvent) return;
    await installEvent.prompt();
    const result = await installEvent.userChoice;
    if (result.outcome === "accepted") {
      setHidden(true);
    }
    setInstallEvent(null);
  }

  if (hidden) return null;
  if (!installEvent && !showIOS) return null;

  return (
    <div
      className="fixed left-4 right-4 lg:left-auto lg:right-4 lg:w-80 bg-paper rounded-2xl shadow-card-hover p-4 z-30 border border-warm-200"
      style={{ bottom: "calc(env(safe-area-inset-bottom, 0) + 5rem)" }}
      role="dialog"
      aria-label="앱 설치 안내"
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl shrink-0" aria-hidden="true">
          📲
        </span>
        <div className="flex-1 text-sm">
          <p className="font-semibold text-ink mb-1">쌤노트를 앱으로 설치할까요?</p>
          {installEvent && (
            <p className="text-ink-soft text-xs leading-relaxed">
              홈 화면에 두면 앱처럼 빠르게 열려요. 매일 알림장 작성이 한결
              편해져요.
            </p>
          )}
          {showIOS && !installEvent && (
            <p className="text-ink-soft text-xs leading-relaxed">
              사파리 하단의 <strong>공유</strong> 버튼{" "}
              <span aria-hidden="true">↑</span>을 눌러서{" "}
              <strong>&quot;홈 화면에 추가&quot;</strong>를 선택해 주세요.
            </p>
          )}
        </div>
        <button
          onClick={dismiss}
          className="text-ink-faint hover:text-ink-muted text-lg leading-none px-1 -mt-1"
          aria-label="설치 안내 닫기"
        >
          ×
        </button>
      </div>
      {installEvent && (
        <div className="flex gap-2 mt-3">
          <button
            onClick={install}
            className="flex-1 bg-coral-500 hover:bg-coral-600 text-white py-2 rounded-xl text-sm font-semibold shadow-sm"
          >
            설치하기
          </button>
          <button
            onClick={dismiss}
            className="px-3 py-2 text-ink-muted hover:bg-warm-50 rounded-xl text-sm"
          >
            나중에
          </button>
        </div>
      )}
    </div>
  );
}
