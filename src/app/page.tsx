// app/dashboard/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getTotalUsers } from "./actions";

export default function Dashboard() {
  const router = useRouter();
  const [totalUsers, setTotalUsers] = useState<number | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const isTestLogin = localStorage.getItem("test_login") === "true";
    if (!isTestLogin) {
      router.push("/login");
    } else {
      getTotalUsers().then(setTotalUsers);
    }

    setReady(true);
  }, [router]);

  // Optional: show loading state
  if (!ready) {
    return null;
  }

  return (
    <div className="grid grid-sm">
      <div className="col-lg-12">
        <h3>Dashboard</h3>
      </div>

      <div className="col-lg-12">
        <div className="panel">
          <div className="panel-body">
            <p>Welcome to the MT5 CRM Dashboard.</p>
          </div>
        </div>
      </div>

      <div className="col-lg-4 col-sm-6">
        <div className="panel">
          <div className="panel-header">
            <strong>Total Users</strong>
          </div>
          <div className="panel-body">
            <div className="txt-xl txt-bold">
              {totalUsers !== null ? totalUsers.toLocaleString() : "Loading..."}
            </div>
            <div className="txt-hint">Active real accounts</div>
          </div>
        </div>
      </div>

      <div className="col-lg-4">
        <div className="panel">
          <div className="panel-header">
            <strong>System Status</strong>
          </div>
          <div className="panel-body">
            <div className="flex align-center gap-10">
              <i className="ri-checkbox-circle-fill txt-success"></i>
              <span>All systems operational</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
