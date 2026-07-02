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
    label: "Methodology",
    icon: "Pentagon",
    color: "text-emerald-500",
    description: "Experimental or analytical approaches, protocols, and procedures",
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
  "insight",
];

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

// The prototype tracks a 4-dimension subset (brief §3.1 B3). The full 9-dim
// config above is retained for forward-compatibility with the production system.
export const PROTOTYPE_CREDIT_DIMENSIONS: CreditDimension[] = [
  "idea",
  "data",
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
