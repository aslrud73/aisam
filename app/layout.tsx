import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppShell } from "./components/AppShell";

export const metadata: Metadata = {
  title: "쌤노트 — 선생님의 1시간을 돌려드립니다",
  description:
    "유치원·어린이집 선생님을 위한 AI 기록 도우미. 알림장·관찰일지·학부모 답변·놀이기록·성장 리포트까지 10분에 끝내세요.",
};

export const viewport: Viewport = {
  themeColor: "#FBF7F0",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
