import { DISCIPLINE_CONFIG, type Discipline } from "@/lib/types";

// Colored top-level discipline badge. Server-component friendly.
export function DisciplineBadge({
  discipline,
  className = "",
}: {
  discipline: string | null | undefined;
  className?: string;
}) {
  if (!discipline) return null;
  const cfg = DISCIPLINE_CONFIG[discipline as Discipline];
  if (!cfg) return null;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.badge} ${className}`}
    >
      <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}
