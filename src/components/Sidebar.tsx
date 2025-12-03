"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState<string | null>("Operation");

  const menus = [
    { name: "Dashboard", href: "/", icon: "ri-dashboard-line" },
    {
      name: "Operation",
      icon: "ri-folder-open-line",
      items: [
        { name: "Applications", href: "/operations/application" },
        { name: "Deposit Requests", href: "/operations/deposit" },
        { name: "Withdraw Requests", href: "/operations/withdraw" },
        { name: "Client List", href: "/operations/clients" },
      ],
    },
  ];

  const isActive = (href: string) => pathname === href;
  const isParentActive = () => pathname.startsWith("/operations");

  return (
    <aside className="sidebar">
      <div className="logo">MT5</div>
      <nav className="nav">
        {menus.map((item) =>
          item.href ? (
            <Link
              key={item.name}
              href={item.href}
              className={`nav-item ${isActive(item.href) ? "active" : ""}`}
              aria-current={isActive(item.href) ? "page" : undefined}
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
