import { CreditBadge } from "./CreditBadge";
import { formatDate } from "@/lib/utils";
import type { CreditDimension } from "@/lib/types";

interface TimelineEntry {
  id: string;
  timestamp: string | Date;
  creditType: string;
  weight: number;
  thread: { id: string; title: string };
}

// Chronological list of credit records (most recent first).
export function CreditTimeline({ entries }: { entries: TimelineEntry[] }) {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No credits yet. Start contributing!
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map((entry) => (
        <div
          key={entry.id}
          className="flex items-center justify-between border-b py-2 text-sm last:border-0"
        >
          <div className="flex items-center gap-2">
            <CreditBadge
              dimension={entry.creditType as CreditDimension}
              weight={entry.weight}
            />
            <span className="text-muted-foreground">{entry.thread.title}</span>
          </div>
          <span className="font-mono text-xs text-muted-foreground">
            {formatDate(new Date(entry.timestamp))}
          </span>
        </div>
      ))}
    </div>
  );
}
