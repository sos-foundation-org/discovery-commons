export const VISIBILITY_LEVELS = ["L0", "L1", "L2", "L3"] as const;
export type VisibilityLevel = (typeof VISIBILITY_LEVELS)[number];

export const VISIBILITY_LABELS: Record<VisibilityLevel, string> = {
  L0: "Private",
  L1: "Inner Circle",
  L2: "Community",
  L3: "Public",
};

export const VISIBILITY_ICONS: Record<VisibilityLevel, string> = {
  L0: "Lock",
  L1: "Users",
  L2: "Globe2",
  L3: "Globe",
};

export const CONTRIBUTION_TYPES = [
  "question",
  "hypothesis",
  "data",
  "simulation",
  "statistics",
  "interpretation",
  "insight",
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
    description: "Create threads (L0-L1), contribute to own threads",
  },
  contributor: {
    label: "Contributor",
    description: "Contribute to others' threads, comment",
  },
  trusted: {
    label: "Trusted",
    description: "Create L2 threads, join Trusted Circles",
  },
  established: {
    label: "Established",
    description: "Create L3 threads, nominate others",
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
