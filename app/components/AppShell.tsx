import { Sidebar } from "./Sidebar";
import { MobileHeader } from "./MobileHeader";
import { BottomTabs } from "./BottomTabs";
import { Footer } from "./Footer";
import { PWAInstallPrompt } from "./PWAInstallPrompt";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Sidebar />
      <div className="lg:pl-[240px] flex-1 flex flex-col">
        <MobileHeader />
        <div className="flex-1 pb-24 lg:pb-0">{children}</div>
        <Footer />
      </div>
      <BottomTabs />
      <PWAInstallPrompt />
    </div>
  );
}
