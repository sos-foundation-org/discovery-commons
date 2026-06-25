import {
  REPLICATION_OUTCOME_CONFIG,
  type ReplicationOutcome,
} from "@/lib/types";
import { cn } from "@/lib/utils";

// Color-coded badge for a replication outcome. Failed replications are styled
// as a first-class, equally-valued result — not a negative.
export function ReplicationStatus({
  outcome,
  className,
}: {
  outcome: string;
  className?: string;
}) {
  const config =
    REPLICATION_OUTCOME_CONFIG[outcome as ReplicationOutcome] ??
    REPLICATION_OUTCOME_CONFIG.inconclusive;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        config.color,
        className
      )}
      title={config.description}
    >
      {config.label}
    </span>
  );
}
