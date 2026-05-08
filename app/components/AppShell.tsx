import { Sidebar } from "./Sidebar";
import { MobileHeader } from "./MobileHeader";
import { BottomTabs } from "./BottomTabs";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="lg:pl-[240px]">
        <MobileHeader />
        <div className="page-fade">{children}</div>
      </div>
      <BottomTabs />
    </div>
  );
}
