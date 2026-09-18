import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { unfreezeDP, earnDP } from "@/lib/points";
import { DP_EVENT_REWARDS } from "@/lib/types";
import { logBackgroundError } from "@/lib/log";

const respondSchema = z.object({
  action: z.enum(["accept", "decline", "chat_first"]),
  declineReason: z.string().max(200).optional(),
});

/**
 * GET /api/contributions/[contributionId]/collab/[reqId]
 * Get a single collaboration request (only visible to the two parties).
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { contributionId: string; reqId: string } }
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const request = await prisma.collaborationRequest.findUnique({
    where: { id: params.reqId },
    include: {
      contribution: { select: { authorId: true } },
      applicant: {
        select: { id: true, displayName: true, name: true, image: true },
      },
    },
  });

  if (!request || request.contributionId !== params.contributionId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Privacy Layer 1: only the two parties can access
  const isApplicant = session.user.id === request.applicantId;
  const isAuthor = session.user.id === request.contribution.authorId;
  if (!isApplicant && !isAuthor) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  return NextResponse.json({
    id: request.id,
    status: request.status,
    seekingType: request.seekingType,
    message: request.message,
    depositAmount: request.depositAmount,
    applicant: request.applicant,
    createdAt: request.createdAt,
    respondedAt: request.respondedAt,
    // Messages excluded here — use the /messages sub-endpoint
  });
}

/**
 * PATCH /api/contributions/[contributionId]/collab/[reqId]
 * Author responds: accept, decline, or chat_first.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { contributionId: string; reqId: string } }
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const collabReq = await prisma.collaborationRequest.findUnique({
    where: { id: params.reqId },
    include: {
      contribution: { select: { authorId: true } },
    },
  });

  if (!collabReq || collabReq.contributionId !== params.contributionId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Only the contribution author can respond
  if (session.user.id !== collabReq.contribution.authorId) {
    return NextResponse.json(
      { error: "Only the content author can respond to requests" },
      { status: 403 }
    );
  }

  // Can only respond to pending or chatting requests
  if (!["pending", "chatting"].includes(collabReq.status)) {
    return NextResponse.json(
      { error: `Cannot respond to a ${collabReq.status} request` },
      { status: 400 }
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = respondSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { action } = parsed.data;
  const now = new Date();

  if (action === "accept") {
    await prisma.collaborationRequest.update({
      where: { id: params.reqId },
      data: { status: "accepted", respondedAt: now },
    });

    // Refund deposit (idempotent — safe to retry). MUST await to ensure completion.
    if (collabReq.depositAmount > 0) {
      try {
        await unfreezeDP(prisma, collabReq.applicantId, collabReq.depositAmount, params.reqId);
      } catch (err) {
        console.error("Failed to refund deposit on accept:", err);
      }
    }

    // Notify applicant
    prisma.notification
      .create({
        data: {
          userId: collabReq.applicantId,
          type: "collab_accepted",
          title: "Collaboration accepted!",
          message: "Your collaboration request has been accepted. Details are now unlocked.",
          linkUrl: `/threads/${params.contributionId}`,
        },
      })
      .catch(logBackgroundError("api/contributions/[contributionId]/collab/[reqId]"));

    return NextResponse.json({ status: "accepted" });
  }

  if (action === "decline") {
    await prisma.collaborationRequest.update({
      where: { id: params.reqId },
      data: { status: "declined", respondedAt: now },
    });

    // Refund deposit (idempotent — safe to retry). MUST await.
    if (collabReq.depositAmount > 0) {
      try {
        await unfreezeDP(prisma, collabReq.applicantId, collabReq.depositAmount, params.reqId);
      } catch (err) {
        console.error("Failed to refund deposit on decline:", err);
      }
    }

    // Notify applicant
    prisma.notification
      .create({
        data: {
          userId: collabReq.applicantId,
          type: "collab_declined",
          title: "Collaboration request declined",
          message:
            parsed.data.declineReason ||
            "The author declined your collaboration request. Your deposit has been refunded.",
          linkUrl: `/threads/${params.contributionId}`,
        },
      })
      .catch(logBackgroundError("api/contributions/[contributionId]/collab/[reqId]"));

    return NextResponse.json({ status: "declined" });
  }

  // chat_first — transition to chatting status
  await prisma.collaborationRequest.update({
    where: { id: params.reqId },
    data: { status: "chatting", respondedAt: now },
  });

  // Notify applicant
  prisma.notification
    .create({
      data: {
        userId: collabReq.applicantId,
        type: "collab_chat",
        title: "The author wants to chat first",
        message: "Before accepting, the author would like to discuss details.",
        linkUrl: `/threads/${params.contributionId}`,
      },
    })
    .catch(logBackgroundError("api/contributions/[contributionId]/collab/[reqId]"));

  return NextResponse.json({ status: "chatting" });
}
