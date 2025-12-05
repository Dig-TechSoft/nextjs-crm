"use client";

import React from "react";
import { usePathname } from "@/i18n/navigation";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { routing } from "@/i18n/routing";

const HIDDEN_LAYOUT_PATHS = ["/login"];

function stripLocale(pathname: string) {
  const segments = pathname.split("/");
  const maybeLocale = segments[1];
  if ((routing.locales as readonly string[]).includes(maybeLocale)) {
    return "/" + segments.slice(2).join("/");
  }
  return pathname;
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isSidebarOpen, setSidebarOpen] = React.useState(false);
  const normalizedPath = stripLocale(pathname || "/");
  const hideChrome = HIDDEN_LAYOUT_PATHS.some((path) =>
    normalizedPath.startsWith(path)
  );

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
