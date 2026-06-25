"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

const FORMATS = [
  { value: "credit", label: "CRediT-compatible JSON" },
  { value: "json", label: "Full JSON" },
  { value: "csv", label: "CSV" },
] as const;

// Format selector + download for the nine-dimension credit portfolio.
export function CreditExport() {
  const [format, setFormat] = useState<string>("credit");

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        value={format}
        onChange={(e) => setFormat(e.target.value)}
        className="rounded-md border bg-background px-3 py-1.5 text-sm"
        aria-label="Export format"
      >
        {FORMATS.map((f) => (
          <option key={f.value} value={f.value}>
            {f.label}
          </option>
        ))}
      </select>
      <a href={`/api/v2/credits/me/export?format=${format}`} target="_blank" rel="noreferrer">
        <Button variant="outline" size="sm">
          Download
        </Button>
      </a>
    </div>
  );
}
