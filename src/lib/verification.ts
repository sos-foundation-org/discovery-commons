import type { Prisma, PrismaClient } from "@prisma/client";
import type { VerificationBadge } from "./types";

type DbClient = PrismaClient | Prisma.TransactionClient;

const TRUSTED_LEVELS = ["trusted", "established", "moderator"];

/**
 * Recompute a thread's verification badge from its current evidence state,
 * checking from highest to lowest. Badges are auto-calculated and transparent
 * — there is no manual badge assignment.
 *
 * Levels (highest → lowest):
 *   doi_published      — a DOI has been minted
 *   replicated         — ≥2 successful independent replications
 *   community_reviewed — ≥3 reviews from Trusted+ members
 *   ai_checked         — set by the AI Reviewer (preserved if already present)
 *   unverified         — default
 *
 * Note: ai_checked is only preserved, never inferred here — the AI Reviewer
 * route is the sole writer of that state. This function never downgrades an
 * ai_checked thread that lacks higher evidence.
 */
export async function computeVerificationBadge(
  threadId: string,
  client: DbClient
): Promise<VerificationBadge> {
  const thread = await client.thread.findUnique({
    where: { id: threadId },
    include: {
      replicationsOf: true,
    },
  });

  if (!thread) throw new Error("Thread not found");

  if (thread.doi) return "doi_published";

  const successfulReplications = thread.replicationsOf.filter(
    (r) => r.outcome === "replicated" || r.outcome === "partially_replicated"
  );
  if (successfulReplications.length >= 2) return "replicated";

  // Count reviews from Trusted+ members across all contributions in the thread.
  const trustedReviews = await client.comment.count({
    where: {
      contribution: { threadId },
      author: { trustLevel: { in: TRUSTED_LEVELS } },
    },
  });
  if (trustedReviews >= 3) return "community_reviewed";

  if (thread.verificationBadge === "ai_checked") return "ai_checked";

  return "unverified";
}

/**
 * Recompute and persist a thread's verification badge. Returns the new badge.
 */
export async function updateVerificationBadge(
  threadId: string,
  client: DbClient
): Promise<VerificationBadge> {
  const badge = await computeVerificationBadge(threadId, client);
  await client.thread.update({
    where: { id: threadId },
    data: { verificationBadge: badge },
  });
  return badge;
}
