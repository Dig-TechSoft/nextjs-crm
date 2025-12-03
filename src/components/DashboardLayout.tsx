"use client";

import React from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

interface DashboardLayoutProps {
  children: React.ReactNode;
  breadcrumb?: React.ReactNode;
}

export default function DashboardLayout({ children, breadcrumb }: DashboardLayoutProps) {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-body">
        <div className="page-wrapper">
          <Header breadcrumb={breadcrumb} />
          <div className="page-content">{children}</div>
        </div>
      </div>
    </div>
  );
}
