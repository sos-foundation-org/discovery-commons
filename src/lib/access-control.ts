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

  return evaluateContributionAccess(
    {
      authorId: contribution.authorId,
      visibility: contribution.visibility,
      sharedWith: contribution.sharedWith.map((s) => s.userId),
      thread: {
        creatorId: contribution.thread.creatorId,
        visibility: contribution.thread.visibility,
        collaboratorIds: contribution.thread.collaborators.map((c) => c.userId),
      },
    },
    userId
  );
}

/**
 * Pure access evaluation — no DB access. Use when the contribution + thread +
 * collaborator/share ids are already loaded (e.g. batch rendering a thread).
 */
export function evaluateContributionAccess(
  contribution: {
    authorId: string;
    visibility: string; // private | shared | public | sealed
    sharedWith: string[];
    thread: {
      creatorId: string;
      visibility: string; // private | shared | public
      collaboratorIds: string[];
    };
  },
  userId: string | null
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

  // 2. Contribution-level gate.
  switch (contribution.visibility) {
    case "public":
      return { canView: true, canViewContent: true, canEdit: isAuthor };

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
