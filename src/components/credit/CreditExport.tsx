"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/language-provider";

const FORMATS = [
  { value: "credit", labelKey: "thread.export.credit" },
  { value: "json", labelKey: "thread.export.json" },
  { value: "csv", labelKey: null },
] as const;

// Format selector + download for the nine-dimension credit portfolio.
export function CreditExport() {
  const [format, setFormat] = useState<string>("credit");
  const { t } = useI18n();

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        value={format}
        onChange={(e) => setFormat(e.target.value)}
        className="rounded-md border bg-background px-3 py-1.5 text-sm"
        aria-label={t("thread.export.format")}
      >
        {FORMATS.map((f) => (
          <option key={f.value} value={f.value}>
            {f.labelKey ? t(f.labelKey) : "CSV"}
          </option>
        ))}
      </select>
      <a href={`/api/v2/credits/me/export?format=${format}`} target="_blank" rel="noreferrer">
        <Button variant="outline" size="sm">
          {t("thread.export.download")}
        </Button>
      </a>
    </div>
  );
}
