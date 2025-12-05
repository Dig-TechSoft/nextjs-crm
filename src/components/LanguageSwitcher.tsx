"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import clsx from "clsx";

const languages = [
  { code: "en", name: "English", badge: "EN" },
  { code: "zh-Hans", name: "简体中文", badge: "中" },
];

export default function LanguageSwitcher() {
  const locale = useLocale();
  const t = useTranslations("Common");
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const currentLang = useMemo(
    () => languages.find((lang) => lang.code === locale) ?? languages[0],
    [locale]
  );

  const handleLanguageChange = (newLocale: string) => {
    setOpen(false);
    if (newLocale === locale) return;
    router.replace(pathname, { locale: newLocale });
  };

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="lang-root" ref={menuRef}>
      <button
        type="button"
        className="lang-toggle"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("language")}
      >
        <span className="badge">{currentLang.badge}</span>
        <span className="sr-only">{currentLang.name}</span>
        <i
          className={clsx("ri-arrow-down-s-line", "chevron", open && "open")}
          aria-hidden
        />
      </button>

      {open && (
        <div className="lang-menu" role="listbox">
          {languages.map((lang) => (
            <button
              key={lang.code}
              type="button"
              role="option"
              aria-selected={locale === lang.code}
              className={clsx("lang-item", locale === lang.code && "active")}
              onClick={() => handleLanguageChange(lang.code)}
            >
              <span className="badge">{lang.badge}</span>
              <span className="label">{lang.name}</span>
              {locale === lang.code && (
                <i className="ri-check-line check" aria-hidden />
              )}
            </button>
          ))}
        </div>
      )}

      <style jsx>{`
        .lang-root {
          position: relative;
        }
        .lang-toggle {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: 1px solid var(--gray-200, #e5e7eb);
          background: var(--gray-50, #f9fafb);
          color: inherit;
          border-radius: 999px;
          padding: 6px 8px;
          font-size: 12px;
          line-height: 1;
          cursor: pointer;
          transition: background 0.15s ease, border-color 0.15s ease;
        }
        .lang-toggle:hover {
          background: var(--gray-100, #f3f4f6);
          border-color: var(--gray-300, #d1d5db);
        }
        .lang-menu {
          position: absolute;
          right: 0;
          margin-top: 6px;
          min-width: 180px;
          background: #fff;
          border: 1px solid var(--gray-200, #e5e7eb);
          border-radius: 12px;
          box-shadow: 0 12px 32px rgba(17, 24, 39, 0.12);
          padding: 6px;
          z-index: 20;
        }
        .lang-item {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          padding: 10px 12px;
          border: none;
          background: transparent;
          border-radius: 10px;
          cursor: pointer;
          color: inherit;
          transition: background 0.15s ease;
        }
        .lang-item:hover {
          background: var(--gray-50, #f9fafb);
        }
        .lang-item.active {
          background: var(--primary-50, #eef4ff);
          color: var(--primary-700, #2d6cdf);
        }
        .badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: var(--gray-200, #e5e7eb);
          font-size: 11px;
          font-weight: 600;
        }
        .label {
          flex: 1;
          text-align: left;
          font-size: 13px;
        }
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          border: 0;
        }
        .chevron {
          font-size: 14px;
          transition: transform 0.15s ease;
        }
        .chevron.open {
          transform: rotate(180deg);
        }
        .check {
          color: var(--primary-600, #2563eb);
        }
      `}</style>
    </div>
  );
}
