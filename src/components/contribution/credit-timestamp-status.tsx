"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Clock } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

// Layer-2 credit-timestamp status, embedded in a contribution card's metadata
// row (Web Prototype §3B.7). Published → green timestamp; not-yet-published →
// grey "No credit timestamp yet" that expands a one-line explanation on click.
// No standalone banner — the information lives inline to avoid visual noise.
export function CreditTimestampStatus({
  publishedAt,
}: {
  publishedAt: string | Date | null;
}) {
  const [expanded, setExpanded] = useState(false);

  if (publishedAt) {
    return (
      <span
        className="inline-flex items-center gap-1 text-green-700 dark:text-green-400"
        title="Credit priority was established when this was published"
      >
        <CheckCircle2 className="h-3.5 w-3.5" />
        Credit timestamp: {formatDateTime(publishedAt)}
      </span>
    );
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-1 text-muted-foreground">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="inline-flex items-center gap-1 hover:text-foreground"
        aria-expanded={expanded}
      >
        <Clock className="h-3.5 w-3.5" />
        No credit timestamp yet
      </button>
      {expanded && (
        <span className="text-[11px]">
          — a credit timestamp is only recorded when you publish.{" "}
          <Link href="/about#credit-timestamps" className="underline">
            Learn more
          </Link>
        </span>
      )}
    </span>
  );
}
