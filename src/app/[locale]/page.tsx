// app/dashboard/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { getTotalUsers } from "../actions";

export default function Dashboard() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("Dashboard");
  const [totalUsers, setTotalUsers] = useState<number | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const isTestLogin = localStorage.getItem("test_login") === "true";
    if (!isTestLogin) {
      router.push("/login");
    } else {
      getTotalUsers()
        .then((count) => setTotalUsers(typeof count === "number" ? count : 0))
        .catch(() => setTotalUsers(0));
    }

    setReady(true);
  }, [locale, router]);

  // Optional: show loading state
  if (!ready) {
    return null;
  }

  return (
    <div className="grid grid-sm">
      <div className="col-lg-12">
        <h3>{t("title")}</h3>
      </div>

      <div className="col-lg-12">
        <div className="panel">
          <div className="panel-body">
            <p>{t("welcome")}</p>
          </div>
        </div>
      </div>

      <div className="col-lg-4 col-sm-6">
        <div className="panel">
          <div className="panel-header">
            <strong>{t("totalUsers")}</strong>
          </div>
          <div className="panel-body">
            <div className="txt-xl txt-bold">
              {totalUsers !== null ? totalUsers.toLocaleString() : "Loading..."}
            </div>
            <div className="txt-hint">{t("activeReal")}</div>
          </div>
        </div>
      </div>

      <div className="col-lg-4">
        <div className="panel">
          <div className="panel-header">
            <strong>{t("systemStatus")}</strong>
          </div>
          <div className="panel-body">
            <div className="flex align-center gap-10">
              <i className="ri-checkbox-circle-fill txt-success"></i>
              <span>{t("statusValue")}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
