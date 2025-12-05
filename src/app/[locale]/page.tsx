// app/dashboard/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { getTotalUsers } from "../actions";

type PendingSummary = {
  total: number;
  items: { id: number; login: string; amount: number | null }[];
};

export default function Dashboard() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("Dashboard");
  const [totalUsers, setTotalUsers] = useState<number | null>(null);
  const [ready, setReady] = useState(false);
  const [deposits, setDeposits] = useState<PendingSummary>({
    total: 0,
    items: [],
  });
  const [withdrawals, setWithdrawals] = useState<PendingSummary>({
    total: 0,
    items: [],
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const isTestLogin = localStorage.getItem("test_login") === "true";
    if (!isTestLogin) {
      router.push("/login");
    } else {
      getTotalUsers()
        .then((count) => setTotalUsers(typeof count === "number" ? count : 0))
        .catch(() => setTotalUsers(0));

      fetch("/api/dashboard/pending", { cache: "no-store" })
        .then((res) => res.json())
        .then((data) => {
          setDeposits(data?.deposits || { total: 0, items: [] });
          setWithdrawals(data?.withdrawals || { total: 0, items: [] });
        })
        .catch(() => {
          setDeposits({ total: 0, items: [] });
          setWithdrawals({ total: 0, items: [] });
        });
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

      <div className="col-lg-6 col-sm-6">
        <Link href="/operations/deposit" className="panel hover-card dashboard-card">
          <div className="panel-header flex align-center gap-6">
            <i className="ri-copper-coin-line txt-warning"></i>
            <div className="flex column">
              <strong>{t("pendingDeposits.title")}</strong>
              <span className="txt-hint">
                {t("pendingDeposits.total", { count: deposits.total })}
              </span>
            </div>
          </div>
          <div className="panel-body">
            {deposits.items.length === 0 ? (
              <p className="txt-hint">{t("pendingDeposits.empty")}</p>
            ) : (
              <ul className="pending-list">
                {deposits.items.map((item) => (
                  <li key={item.id} className="pending-item">
                    <span className="pending-login">{item.login}</span>
                    <span className="pending-amount">
                      {item.amount !== null
                        ? `${item.amount.toLocaleString()} USD`
                        : "--"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Link>
      </div>

      <div className="col-lg-6 col-sm-6">
        <Link href="/operations/withdraw" className="panel hover-card dashboard-card">
          <div className="panel-header flex align-center gap-6">
            <i className="ri-bank-card-line txt-primary"></i>
            <div className="flex column">
              <strong>{t("pendingWithdraws.title")}</strong>
              <span className="txt-hint">
                {t("pendingWithdraws.total", { count: withdrawals.total })}
              </span>
            </div>
          </div>
          <div className="panel-body">
            {withdrawals.items.length === 0 ? (
              <p className="txt-hint">{t("pendingWithdraws.empty")}</p>
            ) : (
              <ul className="pending-list">
                {withdrawals.items.map((item) => (
                  <li key={item.id} className="pending-item">
                    <span className="pending-login">{item.login}</span>
                    <span className="pending-amount">
                      {item.amount !== null
                        ? `${item.amount.toLocaleString()} USD`
                        : "--"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Link>
      </div>
    </div>
  );
}
