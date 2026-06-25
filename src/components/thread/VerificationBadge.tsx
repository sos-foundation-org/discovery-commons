import {
  VERIFICATION_BADGE_CONFIG,
  type VerificationBadge as VerificationBadgeType,
} from "@/lib/types";
import { cn } from "@/lib/utils";

// Displays a thread's verification level. Badges are auto-calculated from the
// thread's evidence state (AI checks, community reviews, replications, DOI).
export function VerificationBadge({
  badge,
  className,
}: {
  badge: string;
  className?: string;
}) {
  const config =
    VERIFICATION_BADGE_CONFIG[badge as VerificationBadgeType] ??
    VERIFICATION_BADGE_CONFIG.unverified;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        config.color,
        className
      )}
      title={config.description}
    >
      {config.label}
    </span>
  );
}
