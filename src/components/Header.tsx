"use client";

import React from "react";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import LanguageSwitcher from "./LanguageSwitcher";
import { routing } from "@/i18n/routing";

interface HeaderProps {
  breadcrumb?: React.ReactNode;
  onToggleSidebar?: () => void;
}

export default function Header({ breadcrumb, onToggleSidebar }: HeaderProps = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("Header");
  const [userName, setUserName] = React.useState<string>("Admin");

  const stripLocale = (path: string) => {
    const segments = path.split("/");
    const maybeLocale = segments[1];
    if ((routing.locales as readonly string[]).includes(maybeLocale)) {
      return "/" + segments.slice(2).join("/");
    }
    return path;
  };

  // Auto generate clean breadcrumbs
  const segments = stripLocale(pathname)
    .split("/")
    .filter(Boolean);
  const crumbs = segments.map((seg, i) => {
    const path = "/" + segments.slice(0, i + 1).join("/");
    const label = seg
      .replace(/-/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
    return { path, label };
  });

  const handleLogout = () => {
    localStorage.removeItem("test_login");
    localStorage.removeItem("crm_user_name");
    router.push("/login");
  };

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("crm_user_name");
    if (stored) {
      setUserName(stored);
    }
  }, []);

  return (
    <header className="header">
      <div className="header-inner">
        <button
          className="menu-toggle"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation"
        >
          <i className="ri-menu-line"></i>
        </button>
        <nav className="breadcrumbs">
          {breadcrumb ? (
            breadcrumb
          ) : (
            <>
              <Link href="/" className="crumb">
                <i className="ri-home-4-line"></i>
              </Link>
              {crumbs.map((crumb, i) => (
                <React.Fragment key={crumb.path}>
                  <span className="sep">/</span>
                  {i === crumbs.length - 1 ? (
                    <span className="crumb current">{crumb.label}</span>
                  ) : (
                    <Link href={crumb.path} className="crumb">
                      {crumb.label}
                    </Link>
                  )}
                </React.Fragment>
              ))}
            </>
          )}
        </nav>

        <div className="user-actions">
          <LanguageSwitcher />
          <span className="user-name">{userName}</span>
          <button onClick={handleLogout} className="logout-btn">
            <i className="ri-logout-box-r-line" aria-hidden></i>
            <span className="sr-only">{t("logout")}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
