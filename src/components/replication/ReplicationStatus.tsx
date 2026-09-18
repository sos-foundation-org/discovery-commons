"use client";

import {
  REPLICATION_OUTCOME_CONFIG,
  type ReplicationOutcome,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/language-provider";

// Color-coded badge for a replication outcome. Failed replications are styled
// as a first-class, equally-valued result — not a negative.
export function ReplicationStatus({
  outcome,
  className,
}: {
  outcome: string;
  className?: string;
}) {
  const { t } = useI18n();
  const key: ReplicationOutcome = REPLICATION_OUTCOME_CONFIG[
    outcome as ReplicationOutcome
  ]
    ? (outcome as ReplicationOutcome)
    : "inconclusive";
  const config = REPLICATION_OUTCOME_CONFIG[key];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        config.color,
        className
      )}
      title={t(`outcomeDesc.${key}`)}
    >
      {t(`outcome.${key}`)}
    </span>
  );
}
