"use client";

import React, { useState } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { routing } from "@/i18n/routing";

interface SidebarProps {
  isOpen?: boolean;
  onNavigate?: () => void;
}

export default function Sidebar({ isOpen = false, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const t = useTranslations("Sidebar");
  const operationLabel = t("operation");
  const [open, setOpen] = useState<string | null>(operationLabel);

  const stripLocale = (path: string) => {
    const segments = path.split("/");
    const maybeLocale = segments[1];
    if ((routing.locales as readonly string[]).includes(maybeLocale)) {
      return "/" + segments.slice(2).join("/");
    }
    return path;
  };

  const menus = [
    { name: t("dashboard"), href: "/", icon: "ri-dashboard-line" },
    {
      name: t("operation"),
      icon: "ri-folder-open-line",
      items: [
        { name: t("applications"), href: "/operations/application" },
        { name: t("depositRequests"), href: "/operations/deposit" },
        { name: t("withdrawRequests"), href: "/operations/withdraw" },
        { name: t("clientList"), href: "/operations/clients" },
      ],
    },
  ];

  const cleanPath = stripLocale(pathname);
  const isActive = (href: string) => cleanPath === href;
  const isParentActive = () => cleanPath.startsWith("/operations");

  return (
    <aside className={`sidebar ${isOpen ? "open" : ""}`}>
      <Link href="/" className="logo" aria-label="Flamycom CRM home">
        <Image
          src="/images/flamycom.png"
          alt="Flamycom CRM logo"
          width={180}
          height={52}
          priority
        />
      </Link>
      <nav className="nav">
        {menus.map((item) =>
          item.href ? (
            <Link
              key={item.name}
              href={item.href}
              className={`nav-item ${isActive(item.href) ? "active" : ""}`}
              aria-current={isActive(item.href) ? "page" : undefined}
              onClick={onNavigate}
            >
              <i className={item.icon}></i>
              <span className="nav-label">{item.name}</span>
            </Link>
          ) : (
            <div key={item.name} className="nav-group">
              <button
                className={`nav-item ${
                  isParentActive() || open === item.name ? "active" : ""
                }`}
                onClick={() => setOpen(open === item.name ? null : item.name)}
                aria-expanded={open === item.name}
              >
                <i className={item.icon}></i>
                <span className="nav-label">{item.name}</span>
                <i
                  className={`ri-arrow-down-s-line arrow ${
                    open === item.name ? "open" : ""
                  }`}
                ></i>
              </button>

              <div className={`dropdown ${open === item.name ? "show" : ""}`}>
                {item.items?.map((sub) => (
                  <Link
                    key={sub.href}
                    href={sub.href}
                    className={`dropdown-item ${
                      isActive(sub.href) ? "active" : ""
                    }`}
                    aria-current={isActive(sub.href) ? "page" : undefined}
                    onClick={onNavigate}
                  >
                    {sub.name}
                  </Link>
                ))}
              </div>
            </div>
          )
        )}
      </nav>
    </aside>
  );
}
