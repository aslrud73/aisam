import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppShell } from "./components/AppShell";

export const metadata: Metadata = {
  title: "쌤노트 — 선생님을 위한 AI 기록 자동화",
  description:
    "유치원·어린이집 선생님을 위한 AI 기록 자동화. 알림장·관찰일지·학부모 답변까지 한 번에.",
  applicationName: "쌤노트",
  appleWebApp: {
    capable: true,
    title: "쌤노트",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#E85A4F",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
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
