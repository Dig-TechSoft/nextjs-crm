"use client";

import React from "react";
import { useTranslations } from "next-intl";

export default function OperationsPage() {
  const t = useTranslations("Operations");

  return (
    <div className="panel">
      <div className="panel-header">
        <strong>{t("title")}</strong>
      </div>
      <div className="panel-body">
        <p>{t("subtitle")}</p>
      </div>
    </div>
  );
}
