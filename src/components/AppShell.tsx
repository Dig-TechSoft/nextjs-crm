"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Header from "./Header";

const HIDDEN_LAYOUT_PATHS = ["/login"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isSidebarOpen, setSidebarOpen] = React.useState(false);
  const hideChrome = HIDDEN_LAYOUT_PATHS.some((path) => pathname.startsWith(path));

  if (hideChrome) {
    return <div className="app-standalone">{children}</div>;
  }

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className={`app-shell ${isSidebarOpen ? "sidebar-open" : ""}`}>
      <Sidebar isOpen={isSidebarOpen} onNavigate={closeSidebar} />
      <button
        className={`sidebar-backdrop ${isSidebarOpen ? "show" : ""}`}
        onClick={closeSidebar}
        aria-label="Close navigation"
      />
      <div className="app-main">
        <Header onToggleSidebar={() => setSidebarOpen((open) => !open)} />
        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}
