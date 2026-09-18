"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { STAGE_ORDER, VISIBILITY_LEVELS } from "@/lib/types";
import { useI18n } from "@/components/language-provider";

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
  const { t } = useI18n();
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
            placeholder={t("threads.search")}
            aria-label={t("filters.searchLabel")}
            className="flex-1"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            {t("common.search")}
          </button>
        </form>
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          aria-expanded={showFilters}
          className={`px-3 py-2 rounded-md text-sm border transition-colors ${
            showFilters
              ? "bg-accent text-foreground border-border"
              : "text-muted-foreground border-border hover:bg-accent/50"
          }`}
        >
          {t("threads.filters")}
        </button>
      </div>

      {showFilters && (
        <div className="flex flex-wrap gap-3 p-3 rounded-lg bg-muted/50 border">
          {/* Stage filter */}
          <div>
            <label htmlFor="filter-stage" className="block text-xs font-medium mb-1">{t("filters.stage")}</label>
            <select
              id="filter-stage"
              value={currentStage || ""}
              onChange={(e) =>
                updateParams({ stage: e.target.value || undefined })
              }
              className="px-2 py-1.5 rounded-md border bg-background text-sm"
            >
              <option value="">{t("filters.allStages")}</option>
              {STAGE_ORDER.map((s) => (
                <option key={s} value={s}>
                  {t(`type.${s}`)}
                </option>
              ))}
            </select>
          </div>

          {/* Visibility filter */}
          <div>
            <label htmlFor="filter-visibility" className="block text-xs font-medium mb-1">{t("filters.visibility")}</label>
            <select
              id="filter-visibility"
              value={currentVisibility || ""}
              onChange={(e) =>
                updateParams({ visibility: e.target.value || undefined })
              }
              className="px-2 py-1.5 rounded-md border bg-background text-sm"
            >
              <option value="">{t("filters.allLevels")}</option>
              {VISIBILITY_LEVELS.map((v) => (
                <option key={v} value={v}>
                  {t(`vis.${v}`)}
                </option>
              ))}
            </select>
          </div>

          {/* Domain filter */}
          {allDomains.length > 0 && (
            <div>
              <label htmlFor="filter-domain" className="block text-xs font-medium mb-1">{t("filters.domain")}</label>
              <select
                id="filter-domain"
                value={currentDomain || ""}
                onChange={(e) =>
                  updateParams({ domain: e.target.value || undefined })
                }
                className="px-2 py-1.5 rounded-md border bg-background text-sm"
              >
                <option value="">{t("filters.allDomains")}</option>
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
