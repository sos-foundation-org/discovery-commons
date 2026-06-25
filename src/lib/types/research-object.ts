/**
 * Semantic Document Graph (SDG) — the structured, machine-readable
 * representation of a thread's scientific content (Task 6).
 *
 * Phase 2 scope is data model + basic CRUD only. The SDG is the single
 * source of truth from which every output format (web, PDF, slides, ...)
 * will later be rendered. No renderers exist yet — the web view is just a
 * structured display of this object.
 */

export interface ContentNode {
  id: string;
  content: string; // Markdown
  contributionIds: string[]; // which DC contributions this node maps to
  updatedAt: string; // ISO timestamp
}

export interface DataNode extends ContentNode {
  dataType: string; // dataset | simulation | observation
  format?: string;
  size?: number;
  accessUrl?: string;
}

export interface ResultNode extends ContentNode {
  figureUrls?: string[];
  statisticalOutputs?: Record<string, unknown>;
}

export interface SemanticDocumentGraph {
  version: number;

  nodes: {
    abstract?: ContentNode;
    background?: ContentNode;
    methods: ContentNode[];
    data: DataNode[];
    results: ResultNode[];
    discussion: ContentNode[];
    conclusions?: ContentNode;
  };

  metadata: {
    title: string;
    domainTags: string[];
    stage: string;
    verificationStatus: string;
    doi?: string;
    contributors: { userId: string; creditSummary: Record<string, number> }[];
  };
}

/** An empty SDG scaffold for a new Research Object. */
export function emptySDG(
  title: string,
  domainTags: string[],
  stage: string,
  verificationStatus: string
): SemanticDocumentGraph {
  return {
    version: 1,
    nodes: {
      methods: [],
      data: [],
      results: [],
      discussion: [],
    },
    metadata: {
      title,
      domainTags,
      stage,
      verificationStatus,
      contributors: [],
    },
  };
}
