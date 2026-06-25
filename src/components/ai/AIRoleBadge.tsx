import { AI_ROLE_CONFIG, type AIRole } from "@/lib/types";
import { cn } from "@/lib/utils";

// Labels AI-generated output with its role, e.g. [AI Reviewer].
export function AIRoleBadge({
  role,
  className,
}: {
  role: AIRole;
  className?: string;
}) {
  const config = AI_ROLE_CONFIG[role];
  if (!config) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border border-dashed px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        config.color,
        className
      )}
      title={config.description}
    >
      {config.label}
    </span>
  );
}
