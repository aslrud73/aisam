import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "오늘알림장 — AI 알림장 자동작성",
  description:
    "유치원·어린이집 선생님을 위한 알림장 자동작성 도우미. 하루 1시간 절약하세요.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
