"use client";

import {
  CREDIT_DIMENSION_CONFIG,
  type CreditDimension,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/language-provider";

// A single credit-dimension badge: a colored dot + label, optionally a weight.
export function CreditBadge({
  dimension,
  weight,
  className,
}: {
  dimension: CreditDimension;
  weight?: number;
  className?: string;
}) {
  const { t } = useI18n();
  const config = CREDIT_DIMENSION_CONFIG[dimension];
  if (!config) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        className
      )}
      title={t(`creditDesc.${dimension}`)}
    >
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: config.color }}
      />
      {t(`credit.${dimension}`)}
      {weight !== undefined && (
        <span className="text-muted-foreground">{weight.toFixed(2)}</span>
      )}
    </span>
  );
}
