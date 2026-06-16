"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { STAGE_ORDER, VISIBILITY_LEVELS, VISIBILITY_LABELS } from "@/lib/types";

export function ThreadFilters({
  currentQ,
  currentStage,
  currentVisibility,
  currentDomain,
  allDomains,
}: {
  currentQ?: string;
  currentStage?: string;
  currentVisibility?: string;
  currentDomain?: string;
  allDomains: string[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(currentQ || "");
  const [showFilters, setShowFilters] = useState(
    !!currentStage || !!currentVisibility || !!currentDomain
  );

  const updateParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }
      router.push(`/threads?${params.toString()}`);
    },
    [router, searchParams]
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateParams({ q: q || undefined });
  };

  return (
    <div className="mb-6 space-y-3">
      <div className="flex gap-2">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by title, description, or domain..."
            className="flex-1"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Search
          </button>
        </form>
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={`px-3 py-2 rounded-md text-sm border transition-colors ${
            showFilters
              ? "bg-accent text-foreground border-border"
              : "text-muted-foreground border-border hover:bg-accent/50"
          }`}
        >
          Filters
        </button>
      </div>

      {showFilters && (
        <div className="flex flex-wrap gap-3 p-3 rounded-lg bg-muted/50 border">
          {/* Stage filter */}
          <div>
            <label className="block text-xs font-medium mb-1">Stage</label>
            <select
              value={currentStage || ""}
              onChange={(e) =>
                updateParams({ stage: e.target.value || undefined })
              }
              className="px-2 py-1.5 rounded-md border bg-background text-sm"
            >
              <option value="">All stages</option>
              {STAGE_ORDER.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Visibility filter */}
          <div>
            <label className="block text-xs font-medium mb-1">Visibility</label>
            <select
              value={currentVisibility || ""}
              onChange={(e) =>
                updateParams({ visibility: e.target.value || undefined })
              }
              className="px-2 py-1.5 rounded-md border bg-background text-sm"
            >
              <option value="">All levels</option>
              {VISIBILITY_LEVELS.map((v) => (
                <option key={v} value={v}>
                  {VISIBILITY_LABELS[v]}
                </option>
              ))}
            </select>
          </div>

          {/* Domain filter */}
          {allDomains.length > 0 && (
            <div>
              <label className="block text-xs font-medium mb-1">Domain</label>
              <select
                value={currentDomain || ""}
                onChange={(e) =>
                  updateParams({ domain: e.target.value || undefined })
                }
                className="px-2 py-1.5 rounded-md border bg-background text-sm"
              >
                <option value="">All domains</option>
                {allDomains.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
