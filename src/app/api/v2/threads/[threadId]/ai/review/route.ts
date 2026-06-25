import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { runReview } from "@/lib/ai/reviewer";
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
        contributions: {
          orderBy: { createdAt: "asc" },
          select: { type: true, content: true },
        },
      },
    });
    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    // Assemble thread content for review.
    const threadContent = [
      `Title: ${thread.title}`,
      `Description: ${thread.description}`,
      "",
      "Contributions:",
      ...thread.contributions.map(
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

      if (result.overallAssessment === "pass" && thread.verificationBadge === "unverified") {
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
