"use client";

import { cn } from "@/lib/utils";
import { useI18n } from "@/components/language-provider";

// Green ORCID badge linking to the contributor's ORCID record.
export function OrcidBadge({
  orcidId,
  verified = false,
  className,
}: {
  orcidId: string;
  verified?: boolean;
  className?: string;
}) {
  const { t } = useI18n();
  return (
    <a
      href={`https://orcid.org/${orcidId}`}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-[#A6CE39] bg-[#A6CE39]/10 px-2.5 py-0.5 text-xs font-medium text-[#6a8a0f] hover:bg-[#A6CE39]/20",
        className
      )}
      title={verified ? t("account.orcid.verifiedTitle") : t("account.orcid.selfAssertedTitle")}
    >
      <span
        className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#A6CE39] text-[8px] font-bold text-white"
        aria-hidden
      >
        iD
      </span>
      {orcidId}
      {verified && <span aria-hidden>✓</span>}
    </a>
  );
}
