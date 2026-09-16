// Web Prototype visibility model (DC_Web_Prototype_架構設計 §3A).
// Threads have three levels; contributions add a fourth, "sealed" (content
// hidden, SHA-256 hash + timestamp public — the anti-scooping mechanism).
// Replaces the earlier L0-L3 scheme: L0→private, L1→shared, L2/L3→public.
export const THREAD_VISIBILITY = ["private", "shared", "public"] as const;
export type ThreadVisibility = (typeof THREAD_VISIBILITY)[number];

export const CONTRIBUTION_VISIBILITY = [
  "private",
  "shared",
  "public",
  "sealed",
] as const;
export type ContributionVisibility = (typeof CONTRIBUTION_VISIBILITY)[number];

// Back-compat aliases: most of the app operates on the thread-level set.
export const VISIBILITY_LEVELS = THREAD_VISIBILITY;
export type VisibilityLevel = ThreadVisibility;

export const VISIBILITY_LABELS: Record<ContributionVisibility, string> = {
  private: "Private",
  shared: "Shared",
  public: "Public",
  sealed: "Sealed",
};

export const VISIBILITY_ICONS: Record<ContributionVisibility, string> = {
  private: "Lock",
  shared: "Users",
  public: "Globe",
  sealed: "ShieldCheck",
};

export const VISIBILITY_DESCRIPTIONS: Record<ContributionVisibility, string> = {
  private: "Only you can see this",
  shared: "Visible to thread collaborators and people you share with",
  public: "Anyone can see this, including logged-out visitors",
  sealed: "Content hidden; the SHA-256 hash + timestamp are public to prove priority",
};

export const CONTRIBUTION_TYPES = [
  "question",
  "hypothesis",
  "data",
  "simulation",
  "statistics",
  "interpretation",
  "insight",
  // v2 (Task 2): new contribution types
  "methodology",
  "replication",
] as const;
export type ContributionType = (typeof CONTRIBUTION_TYPES)[number];

export const CONTRIBUTION_TYPE_CONFIG: Record<
  ContributionType,
  { label: string; icon: string; color: string; description: string }
> = {
  question: {
    label: "Question",
    icon: "MessageCircleQuestion",
    color: "text-blue-600",
    description: "The research question or problem statement",
  },
  data: {
    label: "Data",
    icon: "Database",
    color: "text-green-600",
    description: "Raw data, measurements, observations, collected evidence",
  },
  statistics: {
    label: "Statistics",
    icon: "BarChart3",
    color: "text-purple-600",
    description: "Statistical analysis results, tests, p-values, confidence intervals",
  },
  simulation: {
    label: "Simulation",
    icon: "Cpu",
    color: "text-cyan-600",
    description: "Computational models, simulations, predictions",
  },
  interpretation: {
    label: "Interpretation",
    icon: "BookOpen",
    color: "text-amber-600",
    description: "What the data/stats/simulation mean — connecting findings to theory",
  },
  hypothesis: {
    label: "Hypothesis",
    icon: "Lightbulb",
    color: "text-yellow-600",
    description: "Proposed explanations or theories",
  },
  insight: {
    label: "Insight",
    icon: "Sparkles",
    color: "text-orange-600",
    description: "Higher-level synthesis, cross-domain connections, breakthroughs",
  },
  methodology: {
    label: "Method",
    icon: "Pentagon",
    color: "text-emerald-500",
    description:
      "A standalone method: a new statistical approach, R package, instrument, or protocol — applicable to data collection, analysis, or simulation",
  },
  replication: {
    label: "Replication",
    icon: "RefreshCw",
    color: "text-rose-500",
    description: "An independent attempt to reproduce a claim — successful or failed",
  },
};

export const PRIMARY_CONTRIBUTION_TYPES: ContributionType[] = [
  "question",
  "hypothesis",
  "data",
  "methodology",
  "insight",
];

// A Method contribution can declare which research activities it supports.
// Stored in Contribution.metadata as { methodAppliesTo: MethodAppliesTo[] }.
export const METHOD_APPLIES_TO = [
  "data_collection",
  "analysis",
  "simulation",
] as const;
export type MethodAppliesTo = (typeof METHOD_APPLIES_TO)[number];

export const METHOD_APPLIES_TO_CONFIG: Record<
  MethodAppliesTo,
  { label: string; color: string }
> = {
  data_collection: { label: "Data collection", color: "text-green-600" },
  analysis: { label: "Analysis", color: "text-purple-600" },
  simulation: { label: "Simulation", color: "text-cyan-600" },
};

// ============================================================
// Disciplines — top-level subject categories with badge colors
// ============================================================

export const DISCIPLINES = [
  "life_sciences",
  "physical_sciences",
  "math_cs",
  "earth_environment",
  "social_sciences",
  "engineering",
  "medicine_health",
  "humanities",
  "interdisciplinary",
] as const;
export type Discipline = (typeof DISCIPLINES)[number];

export const DISCIPLINE_CONFIG: Record<
  Discipline,
  { label: string; badge: string; dot: string }
> = {
  life_sciences: {
    label: "Life Sciences",
    badge:
      "bg-green-100 text-green-800 border-green-300 dark:bg-green-950 dark:text-green-300 dark:border-green-800",
    dot: "bg-green-500",
  },
  physical_sciences: {
    label: "Physical Sciences",
    badge:
      "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
    dot: "bg-blue-500",
  },
  math_cs: {
    label: "Math & CS",
    badge:
      "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800",
    dot: "bg-purple-500",
  },
  earth_environment: {
    label: "Earth & Environment",
    badge:
      "bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-950 dark:text-teal-300 dark:border-teal-800",
    dot: "bg-teal-500",
  },
  social_sciences: {
    label: "Social Sciences",
    badge:
      "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
    dot: "bg-amber-500",
  },
  engineering: {
    label: "Engineering",
    badge:
      "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800",
    dot: "bg-orange-500",
  },
  medicine_health: {
    label: "Medicine & Health",
    badge:
      "bg-red-100 text-red-800 border-red-300 dark:bg-red-950 dark:text-red-300 dark:border-red-800",
    dot: "bg-red-500",
  },
  humanities: {
    label: "Humanities",
    badge:
      "bg-pink-100 text-pink-800 border-pink-300 dark:bg-pink-950 dark:text-pink-300 dark:border-pink-800",
    dot: "bg-pink-500",
  },
  interdisciplinary: {
    label: "Interdisciplinary",
    badge:
      "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600",
    dot: "bg-gray-500",
  },
};

/**
 * Scope feature flag: disciplines offered in selection UI (e.g. New Thread).
 * Hidden disciplines stay fully defined — existing threads keep their badges
 * and the API still accepts every code. Only the pickers are narrowed.
 */
export const DEFAULT_VISIBLE_DISCIPLINES: readonly Discipline[] = [
  "life_sciences",
  "physical_sciences",
  "math_cs",
  "earth_environment",
  "humanities",
  "interdisciplinary",
];

/**
 * NEXT_PUBLIC_VISIBLE_DISCIPLINES overrides the default: a comma-separated
 * list of codes, or "all" to show every discipline. Unknown codes are ignored;
 * unset/empty (or a list with no valid codes) uses DEFAULT_VISIBLE_DISCIPLINES.
 */
export function getVisibleDisciplines(
  flag: string | undefined = process.env.NEXT_PUBLIC_VISIBLE_DISCIPLINES
): readonly Discipline[] {
  const raw = flag?.trim();
  if (raw === "all") return DISCIPLINES;
  const allow = raw
    ? raw.split(",").map((s) => s.trim())
    : [...DEFAULT_VISIBLE_DISCIPLINES];
  const visible = DISCIPLINES.filter((d) => allow.includes(d));
  return visible.length > 0
    ? visible
    : DISCIPLINES.filter((d) => DEFAULT_VISIBLE_DISCIPLINES.includes(d));
}

export const TRUST_LEVELS = [
  "new_member",
  "contributor",
  "trusted",
  "established",
  "moderator",
] as const;
export type TrustLevel = (typeof TRUST_LEVELS)[number];

export const TRUST_LEVEL_CONFIG: Record<
  TrustLevel,
  { label: string; description: string }
> = {
  new_member: {
    label: "New Member",
    description: "Create private/shared threads, contribute to own threads",
  },
  contributor: {
    label: "Contributor",
    description: "Contribute to others' threads, comment",
  },
  trusted: {
    label: "Trusted",
    description: "Create shared threads, join Trusted Circles",
  },
  established: {
    label: "Established",
    description: "Create public threads, nominate others",
  },
  moderator: {
    label: "Moderator",
    description: "Flag/hide spam, manage community",
  },
};

export const COMMENT_TYPES = [
  "endorsement",
  "question",
  "critique",
  "suggestion",
  "method_review",
  "stat_review",
] as const;
export type CommentType = (typeof COMMENT_TYPES)[number];

export const COMMENT_TYPE_CONFIG: Record<
  CommentType,
  { label: string; color: string }
> = {
  endorsement: { label: "Endorsement", color: "text-green-600" },
  question: { label: "Question", color: "text-blue-600" },
  critique: { label: "Critique", color: "text-red-600" },
  suggestion: { label: "Suggestion", color: "text-yellow-600" },
  method_review: { label: "Method Review", color: "text-purple-600" },
  stat_review: { label: "Stat Review", color: "text-indigo-600" },
};

export const CREDIT_WEIGHTS: Record<string, number> = {
  question: 1,
  hypothesis: 2,
  data: 3,
  simulation: 3,
  statistics: 3,
  interpretation: 4,
  insight: 5,
  methodology: 4,
  replication: 4,
};

export const STAGE_ORDER = [
  "question",
  "hypothesis",
  "data",
  "simulation",
  "statistics",
  "interpretation",
  "insight",
] as const;

// Level index for each stage — data and simulation share the same level (parallel)
export const STAGE_LEVEL: Record<string, number> = {
  question: 0,
  hypothesis: 1,
  data: 2,
  simulation: 2,
  statistics: 3,
  interpretation: 4,
  insight: 5,
};

// Stages grouped by progression level for visual display
export const STAGE_LEVELS: (string | string[])[] = [
  "question",
  "hypothesis",
  ["data", "simulation"],
  "statistics",
  "interpretation",
  "insight",
];

// Methodology and Replication are intentionally NOT part of STAGE_LEVEL /
// STAGE_ORDER. They are valid contribution types but do not advance the
// canonical Q→H→D→S→I→★ progression (which is preserved unchanged).

// ============================================================
// v2 — Nine-Dimensional Credit System (CreditV2, Task 1)
// ============================================================

export const CREDIT_DIMENSIONS = [
  "idea",
  "data",
  "method",
  "analysis",
  "validation",
  "communication",
  "curation",
  "resource",
  "mentorship",
] as const;
export type CreditDimension = (typeof CREDIT_DIMENSIONS)[number];

// The prototype tracks a 5-dimension subset (brief §3.1 B3 had 4; "method"
// was promoted to first-class alongside the standalone Method contribution
// type). The full 9-dim config above is retained for the production system.
export const PROTOTYPE_CREDIT_DIMENSIONS: CreditDimension[] = [
  "idea",
  "data",
  "method",
  "analysis",
  "validation",
];

export const CREDIT_DIMENSION_CONFIG: Record<
  CreditDimension,
  { label: string; icon: string; color: string; description: string }
> = {
  idea: {
    label: "Idea",
    icon: "Lightbulb",
    color: "#EAB308",
    description: "Posing questions, forming hypotheses",
  },
  data: {
    label: "Data",
    icon: "Database",
    color: "#22C55E",
    description: "Collecting, curating, providing datasets",
  },
  method: {
    label: "Method",
    icon: "Pentagon",
    color: "#10B981",
    description: "Designing approaches, creating protocols",
  },
  analysis: {
    label: "Analysis",
    icon: "BarChart3",
    color: "#A855F7",
    description: "Running analyses, statistical work, code",
  },
  validation: {
    label: "Validation",
    icon: "ShieldCheck",
    color: "#F43F5E",
    description: "Review, replication, error-checking",
  },
  communication: {
    label: "Communication",
    icon: "BookOpen",
    color: "#F59E0B",
    description: "Writing, visualization, audience translation",
  },
  curation: {
    label: "Curation",
    icon: "Library",
    color: "#0EA5E9",
    description: "Maintaining threads, updating metadata, stewardship",
  },
  resource: {
    label: "Resource",
    icon: "Boxes",
    color: "#6366F1",
    description: "Providing equipment, funding, field access, compute",
  },
  mentorship: {
    label: "Mentorship",
    icon: "GraduationCap",
    color: "#EC4899",
    description: "Guiding other contributors' work",
  },
};

// ============================================================
// v2 — Verification Badges (Task 3)
// ============================================================

export const VERIFICATION_BADGES = [
  "unverified",
  "ai_checked",
  "community_reviewed",
  "replicated",
  "doi_published",
] as const;
export type VerificationBadge = (typeof VERIFICATION_BADGES)[number];

export const VERIFICATION_BADGE_CONFIG: Record<
  VerificationBadge,
  { label: string; icon: string; color: string; description: string }
> = {
  unverified: {
    label: "Unverified",
    icon: "Circle",
    color: "text-muted-foreground",
    description: "No automated or community verification yet",
  },
  ai_checked: {
    label: "AI-Checked",
    icon: "Bot",
    color: "text-blue-500",
    description: "Passed automated AI statistical and consistency checks",
  },
  community_reviewed: {
    label: "Community Reviewed",
    icon: "Users",
    color: "text-green-600",
    description: "Reviewed by 3+ trusted community members",
  },
  replicated: {
    label: "Independently Replicated",
    icon: "RefreshCw",
    color: "text-violet-600",
    description: "Two or more independent replications with consistent results",
  },
  doi_published: {
    label: "DOI-Published",
    icon: "BadgeCheck",
    color: "text-amber-500",
    description: "A formal DOI has been minted for this research object",
  },
};

export const REPLICATION_OUTCOMES = [
  "replicated",
  "partially_replicated",
  "failed_to_replicate",
  "inconclusive",
] as const;
export type ReplicationOutcome = (typeof REPLICATION_OUTCOMES)[number];

export const REPLICATION_OUTCOME_CONFIG: Record<
  ReplicationOutcome,
  { label: string; color: string; description: string }
> = {
  replicated: {
    label: "Replicated",
    color: "text-green-600",
    description: "The original claim was successfully reproduced",
  },
  partially_replicated: {
    label: "Partially Replicated",
    color: "text-lime-600",
    description: "Some results reproduced, others did not",
  },
  failed_to_replicate: {
    label: "Failed to Replicate",
    color: "text-red-600",
    description: "The original claim could not be reproduced — equally valued",
  },
  inconclusive: {
    label: "Inconclusive",
    color: "text-amber-600",
    description: "The replication attempt did not yield a clear outcome",
  },
};

// AI roles (Task 5)
export const AI_ROLES = ["research_assistant", "reviewer", "translator"] as const;
export type AIRole = (typeof AI_ROLES)[number];

export const AI_ROLE_CONFIG: Record<
  AIRole,
  { label: string; color: string; description: string }
> = {
  research_assistant: {
    label: "AI Research Assistant",
    color: "text-sky-600",
    description: "Literature search, method suggestions, synthesis",
  },
  reviewer: {
    label: "AI Reviewer",
    color: "text-indigo-600",
    description: "Automated statistical, consistency, and bias checks",
  },
  translator: {
    label: "AI Translator",
    color: "text-teal-600",
    description: "Audience-appropriate summaries and explanations",
  },
};

// ============================================================
// v3 — Points Economy (Discovery Points)
// ============================================================

/** DP reward for publishing a contribution (by type). */
export const DP_PUBLISH_REWARDS: Record<string, number> = {
  question: 10,
  hypothesis: 15,
  data: 30,
  simulation: 30,
  statistics: 25,
  methodology: 35,
  interpretation: 30,
  insight: 40,
  replication: 30,
};

/** DP rewards for social/interaction events. */
export const DP_EVENT_REWARDS = {
  like_received: 2,
  endorsement_received: 5,
  review_received: 5, // method_review, stat_review, critique
  comment_posted: 2,
  thread_created: 5,
  daily_login: 1,
  weekly_streak: 10,
  citation_received: 10,
  cross_thread_citation: 15,
  welcome_bonus: 20,
  collab_completed: 30,
} as const;

/** Like milestone bonuses (one-time). */
export const DP_LIKE_MILESTONES: { threshold: number; bonus: number }[] = [
  { threshold: 10, bonus: 15 },
  { threshold: 50, bonus: 50 },
];

/** Platform fee on purchases (percentage as 0-1). */
export const DP_PLATFORM_FEE = 0.10;

// ── Access Modes ────────────────────────────────────────────

export const ACCESS_MODES = [
  "open",
  "priced",
  "collab_open",
  "collab_gated",
  "priced_collab",
] as const;
export type AccessMode = (typeof ACCESS_MODES)[number];

export const ACCESS_MODE_LABELS: Record<AccessMode, string> = {
  open: "Free & Open",
  priced: "Priced",
  collab_open: "Seeking Collaboration",
  collab_gated: "Gated Collaboration",
  priced_collab: "Priced + Collaboration",
};

export const COLLAB_SEEKING_TYPES = ["academic", "commercial", "either"] as const;
export type CollabSeekingType = (typeof COLLAB_SEEKING_TYPES)[number];

export const COLLAB_SEEKING_LABELS: Record<CollabSeekingType, { label: string; icon: string }> = {
  academic: { label: "Academic", icon: "🎓" },
  commercial: { label: "Commercial", icon: "💼" },
  either: { label: "Either", icon: "🔬" },
};

export const COLLAB_STATUSES = [
  "pending",
  "chatting",
  "accepted",
  "declined",
  "withdrawn",
  "completed",
] as const;
export type CollabStatus = (typeof COLLAB_STATUSES)[number];

// ── Level System — Terra Incognita ──────────────────────────

export const LEVELS = [
  { level: 1, name: "Glimmer",      nameZh: "微光",   icon: "🕯", minRep: 0 },
  { level: 2, name: "Compass",      nameZh: "羅盤",   icon: "🧭", minRep: 100 },
  { level: 3, name: "Cartographer", nameZh: "製圖師", icon: "🗺", minRep: 500 },
  { level: 4, name: "Navigator",    nameZh: "領航者", icon: "⛵", minRep: 2000 },
  { level: 5, name: "Trailblazer",  nameZh: "開拓者", icon: "🏔", minRep: 8000 },
  { level: 6, name: "Horizon",      nameZh: "地平線", icon: "🌅", minRep: 25000 },
] as const;

/** Given a reputation score, return the level (1-6). */
export function getLevel(reputation: number): (typeof LEVELS)[number] {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (reputation >= LEVELS[i].minRep) return LEVELS[i];
  }
  return LEVELS[0];
}

/** Progress toward the next level as 0-1 (1 = already at max). */
export function getLevelProgress(reputation: number): number {
  const current = getLevel(reputation);
  const nextIdx = LEVELS.findIndex((l) => l.level === current.level + 1);
  if (nextIdx === -1) return 1; // max level
  const next = LEVELS[nextIdx];
  return (reputation - current.minRep) / (next.minRep - current.minRep);
}

// ── Contribution Pricing Metadata (stored in Contribution.metadata) ──

export interface CollaborationGate {
  minLevel?: number;
  minReputation?: number;
  requiredDisciplines?: string[];
  description?: string;
  seekingType?: CollabSeekingType;
}

export interface ContributionPricingMeta {
  accessMode?: AccessMode;
  price?: number;
  outlineBreak?: number; // char position where outline ends in content
  whyGated?: string; // author explanation for why content is gated
  collaborationGate?: CollaborationGate;
  license?: ContentLicense; // IP license for this contribution
}

// ── Content Licensing ───────────────────────────────────────

/**
 * License types for contributions. Stored in Contribution.metadata.license.
 *
 * Irrevocability rules (mirrors Creative Commons legal code):
 * - All CC licenses are irrevocable once applied. A contribution published
 *   under CC BY cannot later be changed to All Rights Reserved.
 * - "all_rights_reserved" CAN be upgraded to any CC license (opening up).
 * - "dc_collab" CAN be changed to a CC license when collaboration completes.
 * - Direction is always: more restrictive → less restrictive (never reverse).
 */
export const CONTENT_LICENSES = [
  "cc_by",         // CC BY 4.0 — default for public content
  "cc_by_sa",      // CC BY-SA 4.0
  "cc_by_nc",      // CC BY-NC 4.0
  "cc_by_nc_sa",   // CC BY-NC-SA 4.0
  "cc_by_nd",      // CC BY-ND 4.0
  "cc_by_nc_nd",   // CC BY-NC-ND 4.0 — most restrictive CC
  "all_rights_reserved", // Traditional copyright — default for gated/priced content
  "dc_collab",     // DC Collaboration License — for active collaborations
] as const;
export type ContentLicense = (typeof CONTENT_LICENSES)[number];

export const CONTENT_LICENSE_CONFIG: Record<
  ContentLicense,
  {
    label: string;
    shortLabel: string;
    description: string;
    url: string | null;
    irrevocable: boolean; // once chosen, cannot switch to more restrictive
    allowCommercial: boolean;
    allowDerivatives: boolean;
  }
> = {
  cc_by: {
    label: "CC BY 4.0 — Attribution",
    shortLabel: "CC BY",
    description: "Anyone may use, adapt, and share — even commercially — with attribution to you.",
    url: "https://creativecommons.org/licenses/by/4.0/",
    irrevocable: true,
    allowCommercial: true,
    allowDerivatives: true,
  },
  cc_by_sa: {
    label: "CC BY-SA 4.0 — Attribution-ShareAlike",
    shortLabel: "CC BY-SA",
    description: "Same as CC BY, but derivatives must use the same license.",
    url: "https://creativecommons.org/licenses/by-sa/4.0/",
    irrevocable: true,
    allowCommercial: true,
    allowDerivatives: true,
  },
  cc_by_nc: {
    label: "CC BY-NC 4.0 — Attribution-NonCommercial",
    shortLabel: "CC BY-NC",
    description: "Others may use and adapt with attribution, but not for commercial purposes.",
    url: "https://creativecommons.org/licenses/by-nc/4.0/",
    irrevocable: true,
    allowCommercial: false,
    allowDerivatives: true,
  },
  cc_by_nc_sa: {
    label: "CC BY-NC-SA 4.0 — Attribution-NonCommercial-ShareAlike",
    shortLabel: "CC BY-NC-SA",
    description: "Non-commercial use with attribution; derivatives must use the same license.",
    url: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
    irrevocable: true,
    allowCommercial: false,
    allowDerivatives: true,
  },
  cc_by_nd: {
    label: "CC BY-ND 4.0 — Attribution-NoDerivatives",
    shortLabel: "CC BY-ND",
    description: "Others may redistribute with attribution, but may not adapt or modify.",
    url: "https://creativecommons.org/licenses/by-nd/4.0/",
    irrevocable: true,
    allowCommercial: true,
    allowDerivatives: false,
  },
  cc_by_nc_nd: {
    label: "CC BY-NC-ND 4.0 — Most Restrictive CC",
    shortLabel: "CC BY-NC-ND",
    description: "Non-commercial redistribution only, no modifications, with attribution.",
    url: "https://creativecommons.org/licenses/by-nc-nd/4.0/",
    irrevocable: true,
    allowCommercial: false,
    allowDerivatives: false,
  },
  all_rights_reserved: {
    label: "All Rights Reserved",
    shortLabel: "All Rights Reserved",
    description: "Traditional copyright. Others need your explicit permission to use this content.",
    url: null,
    irrevocable: false, // CAN be upgraded to CC later
    allowCommercial: false,
    allowDerivatives: false,
  },
  dc_collab: {
    label: "DC Collaboration License",
    shortLabel: "DC Collab",
    description: "Content is shared under the DC Collaboration Covenant with accepted collaborators. Can be relicensed when collaboration completes.",
    url: null,
    irrevocable: false, // temporary — changes when collab resolves
    allowCommercial: false,
    allowDerivatives: true,
  },
};

/** Default license by access mode. */
export function getDefaultLicense(accessMode: AccessMode): ContentLicense {
  switch (accessMode) {
    case "open": return "cc_by";
    case "priced": return "all_rights_reserved";
    case "collab_open":
    case "collab_gated": return "dc_collab";
    case "priced_collab": return "all_rights_reserved";
    default: return "cc_by";
  }
}

/**
 * Check if switching from oldLicense to newLicense is allowed.
 * Rule: CC licenses are irrevocable — can only open up, never restrict.
 */
export function isLicenseChangeAllowed(
  oldLicense: ContentLicense,
  newLicense: ContentLicense
): boolean {
  if (oldLicense === newLicense) return true;
  const oldConfig = CONTENT_LICENSE_CONFIG[oldLicense];
  // If old license is irrevocable (any CC), can only switch to same or more permissive
  if (oldConfig.irrevocable) {
    // CC → All Rights Reserved: NOT allowed
    if (newLicense === "all_rights_reserved" || newLicense === "dc_collab") return false;
    // CC BY → CC BY-NC: adding restrictions, NOT allowed
    // General rule: can't add NC or ND restrictions after the fact
    const newConfig = CONTENT_LICENSE_CONFIG[newLicense];
    if (!oldConfig.allowCommercial && newConfig.allowCommercial) return true; // opening up
    if (oldConfig.allowCommercial && !newConfig.allowCommercial) return false; // restricting
    if (!oldConfig.allowDerivatives && newConfig.allowDerivatives) return true;
    if (oldConfig.allowDerivatives && !newConfig.allowDerivatives) return false;
    return true; // same permissiveness level
  }
  // Non-irrevocable (All Rights Reserved, DC Collab) → anything is fine
  return true;
}
