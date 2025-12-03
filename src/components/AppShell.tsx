"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Header from "./Header";

const HIDDEN_LAYOUT_PATHS = ["/login"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideChrome = HIDDEN_LAYOUT_PATHS.some((path) => pathname.startsWith(path));

  if (hideChrome) {
    return <div className="app-standalone">{children}</div>;
  }

  return (
    <>
      <Sidebar />
      <div className="app-main">
        <Header />
        <main className="app-content">{children}</main>
      </div>
    </>
  );
}
