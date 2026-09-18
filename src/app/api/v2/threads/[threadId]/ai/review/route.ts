import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { runReview } from "@/lib/ai/reviewer";
import {
  canViewThread,
  evaluateContributionAccess,
  loadViewerAccessSets,
} from "@/lib/access-control";
import { isAIConfigured, logAIInteraction, checkDailyQuota, AI_MODEL } from "@/lib/ai/router";

// POST /api/v2/threads/[threadId]/ai/review — run the AI Reviewer over a thread.
// Logs the interaction for cost tracking, and (on a clean pass) promotes an
// unverified thread to the ai_checked badge.
export async function POST(
  _request: NextRequest,
  { params }: { params: { threadId: string } }
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAIConfigured()) {
    return NextResponse.json(
      { error: "AI Reviewer is not configured on this deployment." },
      { status: 503 }
    );
  }

  const { threadId } = params;

  try {
    const quota = await checkDailyQuota(prisma, session.user.id, "reviewer");
    if (!quota.allowed) {
      return NextResponse.json(
        { error: `Daily AI Reviewer quota reached (${quota.used}/${quota.limit}).` },
        { status: 429 }
      );
    }

    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
      include: {
        collaborators: { select: { userId: true } },
        contributions: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            type: true,
            content: true,
            authorId: true,
            visibility: true,
            metadata: true,
            sharedWith: { select: { userId: true } },
          },
        },
      },
    });
    const collaboratorIds = thread?.collaborators.map((c) => c.userId) ?? [];
    if (
      !thread ||
      !canViewThread(
        { creatorId: thread.creatorId, visibility: thread.visibility, collaboratorIds },
        session.user.id
      )
    ) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    // Only content the requester may read goes into the prompt — sealed,
    // gated-unpurchased, private and blocked contributions are excluded so the
    // AI response can never echo protected content.
    const accessSets = await loadViewerAccessSets(
      thread.contributions,
      session.user.id,
      prisma
    );
    const readable = thread.contributions.filter(
      (c) =>
        evaluateContributionAccess(
          {
            id: c.id,
            authorId: c.authorId,
            visibility: c.visibility,
            sharedWith: c.sharedWith.map((s) => s.userId),
            thread: {
              creatorId: thread.creatorId,
              visibility: thread.visibility,
              collaboratorIds,
            },
            metadata: c.metadata as { accessMode?: string; price?: number } | null,
          },
          session.user.id,
          accessSets
        ).canViewContent
    );

    // Assemble thread content for review.
    const threadContent = [
      `Title: ${thread.title}`,
      `Description: ${thread.description}`,
      "",
      "Contributions:",
      ...readable.map(
        (c, i) => `${i + 1}. [${c.type}] ${c.content}`
      ),
    ].join("\n");

    const { result, inputTokens, outputTokens } = await runReview(threadContent);

    // Log the interaction and conditionally promote the verification badge.
    await prisma.$transaction(async (tx) => {
      await logAIInteraction(tx, {
        userId: session.user.id,
        threadId,
        aiRole: "reviewer",
        aiFeature: "error_check",
        inputTokens,
        outputTokens,
        responseData: result,
        model: AI_MODEL,
      });

      // Only a review that saw the whole thread may promote its badge.
      if (
        result.overallAssessment === "pass" &&
        thread.verificationBadge === "unverified" &&
        readable.length === thread.contributions.length
      ) {
        await tx.thread.update({
          where: { id: threadId },
          data: { verificationBadge: "ai_checked" },
        });
      }
    });

    return NextResponse.json({
      review: result,
      usage: { inputTokens, outputTokens },
      disclaimer:
        "AI review is advisory and supplements — does not replace — human expert review.",
    });
  } catch (error) {
    console.error("Failed to run AI review:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while running the AI review." },
      { status: 500 }
    );
  }
}
