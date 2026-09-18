"use client";

import {
  PROTOTYPE_CREDIT_DIMENSIONS,
  CREDIT_DIMENSION_CONFIG,
} from "@/lib/types";
import { useI18n } from "@/components/language-provider";

// Horizontal bar visualization across the prototype's four credit dimensions
// (idea / data / analysis / validation).
export function CreditDistribution({
  byDimension,
  showEmpty = true,
}: {
  byDimension: Record<string, number>;
  showEmpty?: boolean;
}) {
  const { t } = useI18n();
  const max = Math.max(1, ...Object.values(byDimension));
  const dimensions = showEmpty
    ? PROTOTYPE_CREDIT_DIMENSIONS
    : PROTOTYPE_CREDIT_DIMENSIONS.filter((d) => (byDimension[d] || 0) > 0);

  if (dimensions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {t("thread.credit.none")}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {dimensions.map((dimension) => {
        const config = CREDIT_DIMENSION_CONFIG[dimension];
        const value = byDimension[dimension] || 0;
        const pct = Math.round((value / max) * 100);
        return (
          <div key={dimension}>
            <div className="mb-0.5 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5" title={t(`creditDesc.${dimension}`)}>
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: config.color }}
                />
                {t(`credit.${dimension}`)}
              </span>
              <span className="text-muted-foreground">{value.toFixed(2)}</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, backgroundColor: config.color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
