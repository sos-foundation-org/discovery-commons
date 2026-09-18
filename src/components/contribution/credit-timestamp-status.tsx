"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Clock } from "lucide-react";
import { formatDateTimeL } from "@/lib/i18n";
import { useI18n } from "@/components/language-provider";

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
  const { t, locale } = useI18n();

  if (publishedAt) {
    return (
      <span
        className="inline-flex items-center gap-1 text-green-700 dark:text-green-400"
        title={t("contribution.creditEstablishedTitle")}
      >
        <CheckCircle2 className="h-3.5 w-3.5" />
        {t("contribution.creditTimestampAt", {
          date: formatDateTimeL(publishedAt, locale),
        })}
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
        {t("contribution.noCreditTimestamp")}
      </button>
      {expanded && (
        <span className="text-[11px]">
          {t("contribution.creditOnlyOnPublish")}{" "}
          <Link href="/about#credit-timestamps" className="underline">
            {t("contribution.learnMore")}
          </Link>
        </span>
      )}
    </span>
  );
}
