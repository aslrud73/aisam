import type { Metadata } from "next";
import "./globals.css";
import { TopNav } from "./components/TopNav";

export const metadata: Metadata = {
  title: "오늘알림장 — AI 기록 자동화",
  description:
    "유치원·어린이집 선생님을 위한 AI 기록 자동화. 알림장·관찰일지·학부모 답변까지 한 번에.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <TopNav />
        {children}
      </body>
    </html>
  );
}
