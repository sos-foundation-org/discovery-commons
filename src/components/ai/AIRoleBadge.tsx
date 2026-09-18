"use client";

import { AI_ROLE_CONFIG, type AIRole } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/language-provider";

// Labels AI-generated output with its role, e.g. [AI Reviewer].
export function AIRoleBadge({
  role,
  className,
}: {
  role: AIRole;
  className?: string;
}) {
  const { t } = useI18n();
  const config = AI_ROLE_CONFIG[role];
  if (!config) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border border-dashed px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        config.color,
        className
      )}
      title={t(`aiRoleDesc.${role}`)}
    >
      {t(`aiRole.${role}`)}
    </span>
  );
}
