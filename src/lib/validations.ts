import { z } from "zod";
import {
  CONTRIBUTION_TYPES,
  VISIBILITY_LEVELS,
  COMMENT_TYPES,
} from "./types";

export const createThreadSchema = z.object({
  title: z
    .string()
    .min(10, "Title must be at least 10 characters")
    .max(200, "Title must be at most 200 characters"),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters")
    .max(10000),
  visibility: z.enum(VISIBILITY_LEVELS).default("L0"),
  domainTags: z.array(z.string()).min(1, "Select at least one domain tag").max(5),
});

export const createContributionSchema = z.object({
  threadId: z.string().min(1),
  type: z.enum(CONTRIBUTION_TYPES),
  content: z
    .string()
    .min(10, "Content must be at least 10 characters")
    .max(10000),
  visibility: z.enum(VISIBILITY_LEVELS).default("L0"),
  parentId: z.string().min(1).optional(),
  sealed: z.boolean().default(false),
  circleUserIds: z.array(z.string()).optional(),
});

export const createCommentSchema = z.object({
  contributionId: z.string().min(1),
  content: z.string().min(1).max(5000),
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

export type CreateThreadInput = z.infer<typeof createThreadSchema>;
export type CreateContributionInput = z.infer<typeof createContributionSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
