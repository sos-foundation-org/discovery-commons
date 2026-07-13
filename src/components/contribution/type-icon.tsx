import {
  MessageCircleQuestion,
  Lightbulb,
  Database,
  Cpu,
  BarChart3,
  BookOpen,
  Sparkles,
  FlaskConical,
  RefreshCw,
  CircleDot,
  type LucideIcon,
} from "lucide-react";
import { CONTRIBUTION_TYPE_CONFIG, type ContributionType } from "@/lib/types";

const ICONS: Record<string, LucideIcon> = {
  question: MessageCircleQuestion,
  hypothesis: Lightbulb,
  data: Database,
  simulation: Cpu,
  statistics: BarChart3,
  interpretation: BookOpen,
  insight: Sparkles,
  methodology: FlaskConical,
  replication: RefreshCw,
};

// Colored Lucide icon for a contribution type (color comes from the type config).
export function TypeIcon({
  type,
  className = "h-4 w-4",
}: {
  type: string;
  className?: string;
}) {
  const Icon = ICONS[type] ?? CircleDot;
  const color =
    CONTRIBUTION_TYPE_CONFIG[type as ContributionType]?.color ?? "text-muted-foreground";
  return <Icon className={`${color} ${className}`} aria-hidden />;
}
