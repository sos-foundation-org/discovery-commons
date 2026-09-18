// Per-contribution access control (Web Prototype §3A.5).
//
// The effective visibility of a contribution is gated by BOTH its own
// visibility and its thread's visibility. Sealed is a special case: anyone who
// can see the thread can see the hash + timestamp, but only the author sees the
// content — that asymmetry is the anti-scooping mechanism.
//
// This module is the canonical access helper. API routes and server components
// should prefer it over ad-hoc visibility comparisons.

import type { PrismaClient } from "@prisma/client";
import { prisma as defaultPrisma } from "./db";

export interface AccessCheckResult {
  /** Can the user see that this contribution exists (and its hash/timestamp)? */
  canView: boolean;
  /** Can the user see the actual content? (false for sealed unless author) */
  canViewContent: boolean;
  /** Can the user edit it? */
  canEdit: boolean;
  reason?: string;
  /** v3: Has the user purchased access to this gated content? */
  hasPurchased?: boolean;
  /** v3: Is this content gated (priced/collab)? */
  isGated?: boolean;
  /** v3: Is the viewer blocked by the author? */
  isBlocked?: boolean;
}

const DENY: AccessCheckResult = {
  canView: false,
  canViewContent: false,
  canEdit: false,
};

/**
 * Resolve access for a single contribution.
 *
 * @param userId  the viewer's id, or null for a logged-out visitor
 */
export async function checkContributionAccess(
  contributionId: string,
  userId: string | null,
  prisma: PrismaClient = defaultPrisma
): Promise<AccessCheckResult> {
  const contribution = await prisma.contribution.findUnique({
    where: { id: contributionId },
    include: {
      thread: { include: { collaborators: true } },
      sharedWith: true,
    },
  });

  if (!contribution) return { ...DENY, reason: "not_found" };

  // Query block rules, purchases, and accepted collabs for this viewer.
  // This is the single-contribution path (used by API routes); the thread
  // page uses the batch path with pre-loaded sets instead.
  let blockedByAuthorIds = new Set<string>();
  let blockedContributionIds = new Set<string>();
  let purchasedContributionIds = new Set<string>();
  let collabAcceptedContributionIds = new Set<string>();

  if (userId) {
    const [blockRules, purchases, collabs] = await Promise.all([
      prisma.contentAccessRule
        .findMany({
          where: {
            ownerId: contribution.authorId,
            targetUserId: userId,
            action: "block",
          },
          select: { targetContributionId: true },
        })
        .catch(() => []),
      prisma.contentPurchase
        .findMany({
          where: { buyerId: userId, contributionId },
          select: { contributionId: true },
        })
        .catch(() => []),
      prisma.collaborationRequest
        .findMany({
          where: { applicantId: userId, contributionId, status: "accepted" },
          select: { contributionId: true },
        })
        .catch(() => []),
    ]);

    // User-level blocks
    blockedByAuthorIds = new Set(
      blockRules
        .filter((r: { targetContributionId: string | null }) => !r.targetContributionId)
        .map(() => contribution.authorId)
    );
    // Contribution-level blocks
    blockedContributionIds = new Set(
      blockRules
        .filter((r: { targetContributionId: string | null }) => !!r.targetContributionId)
        .map((r: { targetContributionId: string | null }) => r.targetContributionId as string)
    );
    purchasedContributionIds = new Set(purchases.map((p: { contributionId: string }) => p.contributionId));
    collabAcceptedContributionIds = new Set(collabs.map((c: { contributionId: string }) => c.contributionId));
  }

  return evaluateContributionAccess(
    {
      id: contributionId,
      authorId: contribution.authorId,
      visibility: contribution.visibility,
      sharedWith: contribution.sharedWith.map((s) => s.userId),
      thread: {
        creatorId: contribution.thread.creatorId,
        visibility: contribution.thread.visibility,
        collaboratorIds: contribution.thread.collaborators.map((c) => c.userId),
      },
      metadata: contribution.metadata as { accessMode?: string; price?: number } | null,
    },
    userId,
    {
      blockedByAuthorIds,
      blockedContributionIds,
      purchasedContributionIds,
      collabAcceptedContributionIds,
    }
  );
}

/**
 * Pure access evaluation — no DB access. Use when the contribution + thread +
 * collaborator/share ids are already loaded (e.g. batch rendering a thread).
 */
export function evaluateContributionAccess(
  contribution: {
    id?: string; // v3: needed for gated-content lookups
    authorId: string;
    visibility: string; // private | shared | public | sealed
    sharedWith: string[];
    thread: {
      creatorId: string;
      visibility: string; // private | shared | public
      collaboratorIds: string[];
    };
    // v3: pricing metadata (from Contribution.metadata JSON)
    metadata?: { accessMode?: string; price?: number } | null;
  },
  userId: string | null,
  /** v3: pre-loaded sets for batch rendering (avoids N+1 queries) */
  preloaded?: {
    purchasedContributionIds?: Set<string>;
    collabAcceptedContributionIds?: Set<string>;
    /** Set of authorIds who have blocked the current viewer (user-level) */
    blockedByAuthorIds?: Set<string>;
    /** Set of contributionIds specifically blocked for the current viewer */
    blockedContributionIds?: Set<string>;
  }
): AccessCheckResult {
  const { thread } = contribution;
  const isAuthor = userId !== null && userId === contribution.authorId;
  const isThreadCreator = userId !== null && userId === thread.creatorId;
  const isCollaborator =
    userId !== null && thread.collaboratorIds.includes(userId);
  const isSharedWith =
    userId !== null && contribution.sharedWith.includes(userId);

  // 1. Thread-level gate first — a contribution can never be more visible than
  //    its thread.
  if (thread.visibility === "private" && !isThreadCreator && !isCollaborator) {
    return { ...DENY, reason: "thread_private" };
  }
  if (thread.visibility === "shared" && !isThreadCreator && !isCollaborator) {
    return { ...DENY, reason: "thread_shared" };
  }

  // 2. Block list check — runs before visibility, so blocked users cannot see
  //    even public content from this author. Already-purchased content is an
  //    exception (completed transaction — not revoked).
  const isUserBlocked = !isAuthor && userId && preloaded?.blockedByAuthorIds?.has(contribution.authorId);
  const isContribBlocked = !isAuthor && userId && contribution.id && preloaded?.blockedContributionIds?.has(contribution.id);
  if (isUserBlocked || isContribBlocked) {
    const purchased = preloaded?.purchasedContributionIds?.has(contribution.id ?? "") ?? false;
    if (!purchased) {
      return {
        canView: true,        // card shell is visible (shows "restricted" message)
        canViewContent: false,
        canEdit: false,
        isBlocked: true,
        reason: "blocked_by_author",
      };
    }
    // Purchased before block → still has access (completed transaction)
  }

  // 3. Contribution-level gate.
  switch (contribution.visibility) {
    case "public": {
      // v3: Check if content is gated (priced/collab).
      // The `contributionId` field is optionally passed for gated-content checks.
      const meta = contribution.metadata;
      const accessMode = (meta?.accessMode as string) ?? "open";
      const contribId = contribution.id;

      if (accessMode !== "open" && !isAuthor && contribId) {
        const purchased = preloaded?.purchasedContributionIds?.has(contribId) ?? false;
        const collabAccepted = preloaded?.collabAcceptedContributionIds?.has(contribId) ?? false;

        if (purchased || collabAccepted) {
          return { canView: true, canViewContent: true, canEdit: isAuthor, hasPurchased: purchased, isGated: true };
        }
        return { canView: true, canViewContent: false, canEdit: isAuthor, isGated: true, hasPurchased: false };
      }
      return { canView: true, canViewContent: true, canEdit: isAuthor };
    }

    case "shared": {
      const ok = isAuthor || isThreadCreator || isCollaborator || isSharedWith;
      return {
        canView: ok,
        canViewContent: ok,
        canEdit: isAuthor,
        reason: ok ? undefined : "contribution_shared",
      };
    }

    case "sealed":
      // Existence + hash + timestamp are public; content is author-only.
      // Sealed content is immutable, so never editable.
      return {
        canView: true,
        canViewContent: isAuthor,
        canEdit: false,
      };

    case "private":
      return {
        canView: isAuthor,
        canViewContent: isAuthor,
        canEdit: isAuthor,
        reason: isAuthor ? undefined : "contribution_private",
      };

    default:
      return { ...DENY, reason: "unknown_visibility" };
  }
}

/**
 * Thread-level gate (mirrors the thread page): private and shared threads are
 * visible only to the creator and thread collaborators.
 */
export function canViewThread(
  thread: { creatorId: string; visibility: string; collaboratorIds: string[] },
  userId: string | null
): boolean {
  if (thread.visibility === "public") return true;
  if (!userId) return false;
  return userId === thread.creatorId || thread.collaboratorIds.includes(userId);
}

/**
 * Batch-load the viewer-specific sets `evaluateContributionAccess` needs
 * (purchases, accepted collabs, block rules) for many contributions at once.
 */
export async function loadViewerAccessSets(
  contributions: { id: string; authorId: string }[],
  userId: string | null,
  prisma: PrismaClient = defaultPrisma
) {
  const empty = {
    purchasedContributionIds: new Set<string>(),
    collabAcceptedContributionIds: new Set<string>(),
    blockedByAuthorIds: new Set<string>(),
    blockedContributionIds: new Set<string>(),
  };
  if (!userId || contributions.length === 0) return empty;

  const contributionIds = contributions.map((c) => c.id);
  const authorIds = Array.from(new Set(contributions.map((c) => c.authorId)));
  const [purchases, collabs, blockRules] = await Promise.all([
    prisma.contentPurchase
      .findMany({
        where: { buyerId: userId, contributionId: { in: contributionIds } },
        select: { contributionId: true },
      })
      .catch(() => []),
    prisma.collaborationRequest
      .findMany({
        where: {
          applicantId: userId,
          contributionId: { in: contributionIds },
          status: "accepted",
        },
        select: { contributionId: true },
      })
      .catch(() => []),
    prisma.contentAccessRule
      .findMany({
        where: { ownerId: { in: authorIds }, targetUserId: userId, action: "block" },
        select: { ownerId: true, targetContributionId: true },
      })
      .catch(() => []),
  ]);

  return {
    purchasedContributionIds: new Set(
      purchases.map((p: { contributionId: string }) => p.contributionId)
    ),
    collabAcceptedContributionIds: new Set(
      collabs.map((c: { contributionId: string }) => c.contributionId)
    ),
    blockedByAuthorIds: new Set(
      blockRules
        .filter((r: { targetContributionId: string | null }) => !r.targetContributionId)
        .map((r: { ownerId: string }) => r.ownerId)
    ),
    blockedContributionIds: new Set(
      blockRules
        .filter((r: { targetContributionId: string | null }) => !!r.targetContributionId)
        .map((r: { targetContributionId: string | null }) => r.targetContributionId as string)
    ),
  };
}

/** Public outline of gated content (same break rule as the contribution API). */
export function outlineOf(content: string, metadata: unknown): string {
  const breakPoint =
    (metadata as { outlineBreak?: number } | null)?.outlineBreak ??
    Math.min(280, content.length);
  return content.slice(0, breakPoint);
}

/**
 * Cached AI translations (metadata.translations) are full-content copies —
 * drop them whenever the viewer may not read the content.
 */
export function stripTranslations<M>(metadata: M): M {
  if (metadata && typeof metadata === "object" && !Array.isArray(metadata)) {
    const { translations: _omit, ...rest } = metadata as Record<string, unknown>;
    void _omit;
    return rest as M;
  }
  return metadata;
}

/**
 * Field-level filtering for an API response: strips content when the viewer may
 * see the contribution but not its content (i.e. sealed for a non-author).
 */
export function maskContributionForViewer<
  T extends { content: string | null; title?: string | null }
>(contribution: T, access: AccessCheckResult): T & { sealed?: boolean } {
  if (access.canView && !access.canViewContent) {
    return {
      ...contribution,
      content: null,
      sealed: true,
    };
  }
  return contribution;
}
