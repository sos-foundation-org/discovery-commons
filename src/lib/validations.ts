import { z } from "zod";
import {
  CONTRIBUTION_TYPES,
  VISIBILITY_LEVELS,
  COMMENT_TYPES,
  CREDIT_DIMENSIONS,
  REPLICATION_OUTCOMES,
  METHOD_APPLIES_TO,
  DISCIPLINES,
  ACCESS_MODES,
  COLLAB_SEEKING_TYPES,
  CONTENT_LICENSES,
} from "./types";

// Minimum length counted on non-whitespace-padded text (10 spaces ≠ content).
// Uses refine, not .trim(), so the stored text — and its hash — is unchanged.
const minTrimmed = (n: number, message: string) =>
  [(s: string) => s.trim().length >= n, { message }] as const;

const domainTag = z.string().trim().min(1).max(100);

export const createThreadSchema = z.object({
  title: z
    .string()
    .max(200, "Title must be at most 200 characters")
    .refine(...minTrimmed(10, "Title must be at least 10 characters")),
  description: z
    .string()
    .max(10000)
    .refine(...minTrimmed(20, "Description must be at least 20 characters")),
  visibility: z.enum(VISIBILITY_LEVELS).default("private"),
  discipline: z.enum(DISCIPLINES).optional(),
  domainTags: z.array(domainTag).min(1, "Select at least one domain tag").max(5),
});

// Thread edits (creator only). Visibility/stage have their own endpoints.
export const updateThreadSchema = z
  .object({
    title: z
      .string()
      .max(200)
      .refine(...minTrimmed(10, "Title must be at least 10 characters"))
      .optional(),
    description: z
      .string()
      .max(10000)
      .refine(...minTrimmed(20, "Description must be at least 20 characters"))
      .optional(),
    domainTags: z.array(domainTag).min(1).max(5).optional(),
    isArchived: z.boolean().optional(),
  })
  .strict();

export const createContributionSchema = z.object({
  threadId: z.string().min(1),
  type: z.enum(CONTRIBUTION_TYPES),
  content: z
    .string()
    .max(10000)
    .refine(...minTrimmed(10, "Content must be at least 10 characters")),
  visibility: z.enum(VISIBILITY_LEVELS).default("private"),
  parentId: z.string().min(1).optional(),
  sealed: z.boolean().default(false),
  circleUserIds: z.array(z.string()).optional(),
  // Method only: which research activities the method supports.
  methodAppliesTo: z.array(z.enum(METHOD_APPLIES_TO)).max(3).optional(),
  // Data only: a link to the raw dataset (Zenodo/OSF/GitHub/CSV/…). Files are
  // not uploaded to the DB — only the URL is stored.
  dataUrl: z.string().url().max(2000).optional().or(z.literal("")),
  // v3: License + Pricing & collaboration (stored in metadata JSON)
  license: z.enum(CONTENT_LICENSES).optional(),
  accessMode: z.enum(ACCESS_MODES).optional(),
  price: z.number().int().min(1).max(1000).optional(),
  whyGated: z.string().max(200).optional(),
  collaborationGate: z
    .object({
      seekingType: z.enum(COLLAB_SEEKING_TYPES).optional(),
      minLevel: z.number().int().min(1).max(6).optional(),
      description: z.string().max(300).optional(),
      requiredDisciplines: z.array(z.string()).max(5).optional(),
    })
    .optional(),
});

export const createCommentSchema = z.object({
  contributionId: z.string().min(1),
  content: z
    .string()
    .max(5000)
    .refine(...minTrimmed(1, "Comment cannot be empty")),
  commentType: z.enum(COMMENT_TYPES).default("endorsement"),
  isAnonymous: z.boolean().default(false),
  parentId: z.string().min(1).optional(),
});

export const sealRegistrationSchema = z.object({
  contentHash: z.string().length(64, "Hash must be a valid SHA-256 (64 hex characters)"),
  title: z.string().max(200).optional(),
});

export const revealSealSchema = z.object({
  content: z.string().min(1),
  threadId: z.string().min(1),
  type: z.enum(CONTRIBUTION_TYPES),
});

export const updateVisibilitySchema = z.object({
  visibility: z.enum(VISIBILITY_LEVELS),
});

// v2 — Credit weight adjustment (append-only: creates a new versioned record).
export const adjustCreditSchema = z.object({
  creditId: z.string().min(1),
  weight: z.number().min(0).max(1),
  creditType: z.enum(CREDIT_DIMENSIONS).optional(),
});

// v2 — Register a replication attempt.
export const createReplicationSchema = z.object({
  replicationThreadId: z.string().min(1),
  outcome: z.enum(REPLICATION_OUTCOMES),
  notes: z.string().max(5000).optional(),
  contributionId: z.string().min(1).optional(),
});

export const updateReplicationSchema = z.object({
  outcome: z.enum(REPLICATION_OUTCOMES).optional(),
  notes: z.string().max(5000).optional(),
});

// v2 — Create/update a Research Object (Semantic Document Graph).
export const researchObjectSchema = z.object({
  structuredContent: z.record(z.unknown()),
});

// v2 — Manually link an ORCID iD (format: 0000-0000-0000-000X).
export const linkOrcidSchema = z.object({
  orcidId: z
    .string()
    .regex(
      /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/,
      "ORCID iD must look like 0000-0000-0000-0000"
    ),
});

export type CreateThreadInput = z.infer<typeof createThreadSchema>;
export type CreateContributionInput = z.infer<typeof createContributionSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type AdjustCreditInput = z.infer<typeof adjustCreditSchema>;
export type CreateReplicationInput = z.infer<typeof createReplicationSchema>;
