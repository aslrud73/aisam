import type { Metadata, Viewport } from "next";
import "./globals.css";
import { TopNav } from "./components/TopNav";
import { Footer } from "./components/Footer";

export const metadata: Metadata = {
  title: "쌤chat — 선생님을 위한 AI 기록 자동화",
  description:
    "유치원·어린이집 선생님을 위한 AI 기록 자동화. 알림장·관찰일지·학부모 답변까지 한 번에.",
  applicationName: "쌤chat",
  appleWebApp: {
    capable: true,
    title: "쌤chat",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#C56B4A",
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
      <body className="min-h-screen flex flex-col">
        <TopNav />
        <div className="flex-1">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
