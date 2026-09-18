import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { freezeDP } from "@/lib/points";
import { COLLAB_SEEKING_TYPES } from "@/lib/types";
import type { ContributionPricingMeta } from "@/lib/types";
import { logBackgroundError } from "@/lib/log";

const proposeSchema = z.object({
  message: z.string().max(500).default(""),
  seekingType: z.enum(COLLAB_SEEKING_TYPES).default("either"),
  depositAmount: z.number().int().min(0).max(500).default(0),
});

/**
 * GET /api/contributions/[contributionId]/collab
 * List collaboration requests for a contribution.
 * - Author sees all requests with applicant profiles
 * - Others see only counts (privacy Layer 2)
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { contributionId: string } }
) {
  const session = await getSession();
  const userId = session?.user?.id ?? null;

  const contribution = await prisma.contribution.findUnique({
    where: { id: params.contributionId },
    select: { authorId: true },
  });
  if (!contribution) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isAuthor = userId === contribution.authorId;

  // Count by status (visible to everyone)
  const requests = await prisma.collaborationRequest.findMany({
    where: { contributionId: params.contributionId },
    select: {
      id: true,
      status: true,
      seekingType: true,
      createdAt: true,
      // Only include applicant details for the author
      ...(isAuthor
        ? {
            message: true,
            applicant: {
              select: {
                id: true,
                displayName: true,
                name: true,
                image: true,
                trustLevel: true,
              },
            },
          }
        : {}),
      // The applicant can see their own request
      ...(userId && !isAuthor
        ? { applicantId: true }
        : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  const counts = {
    total: requests.length,
    pending: requests.filter((r) => r.status === "pending").length,
    chatting: requests.filter((r) => r.status === "chatting").length,
    accepted: requests.filter((r) => r.status === "accepted").length,
  };

  if (isAuthor) {
    return NextResponse.json({ counts, requests });
  }

  // Non-author: only return counts + their own request if any
  const myRequest = userId
    ? requests.find(
        (r) => "applicantId" in r && r.applicantId === userId
      )
    : null;

  return NextResponse.json({
    counts,
    myRequest: myRequest
      ? { id: myRequest.id, status: myRequest.status, createdAt: myRequest.createdAt }
      : null,
  });
}

/**
 * POST /api/contributions/[contributionId]/collab
 * Propose a collaboration (Shopee-style: profile auto-attached + one-line message).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { contributionId: string } }
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const contribution = await prisma.contribution.findUnique({
    where: { id: params.contributionId },
    select: { authorId: true, metadata: true, id: true },
  });
  if (!contribution) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (contribution.authorId === userId) {
    return NextResponse.json(
      { error: "You cannot request collaboration on your own content" },
      { status: 400 }
    );
  }

  // Check if content is actually seeking collaboration
  const meta = contribution.metadata as ContributionPricingMeta | null;
  const accessMode = meta?.accessMode ?? "open";
  if (!accessMode.includes("collab")) {
    return NextResponse.json(
      { error: "This content is not open for collaboration" },
      { status: 400 }
    );
  }

  // Check for existing active request
  const existing = await prisma.collaborationRequest.findFirst({
    where: {
      applicantId: userId,
      contributionId: params.contributionId,
      status: { in: ["pending", "chatting", "accepted"] },
    },
  });
  if (existing) {
    return NextResponse.json(
      { error: "You already have an active collaboration request", existingId: existing.id },
      { status: 409 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const parsed = proposeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { message, seekingType, depositAmount } = parsed.data;

  // Atomic: freeze deposit + create request in one transaction
  let collabRequest;
  try {
    collabRequest = await prisma.$transaction(async (tx) => {
      // Freeze deposit if required
      if (depositAmount > 0) {
        const result = await tx.pointsAccount.updateMany({
          where: { userId, balance: { gte: depositAmount } },
          data: {
            balance: { decrement: depositAmount },
            frozenBalance: { increment: depositAmount },
          },
        });
        if (result.count === 0) {
          throw new Error(`Insufficient DP for deposit`);
        }
      }

      return tx.collaborationRequest.create({
        data: {
          applicantId: userId,
          contributionId: params.contributionId,
          seekingType,
          message,
          depositAmount,
        },
      });
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create request";
    return NextResponse.json({ error: msg }, { status: 402 });
  }

  // Notify the contribution author
  const applicantName =
    session.user.displayName || session.user.name || "Someone";
  prisma.notification
    .create({
      data: {
        userId: contribution.authorId,
        type: "collab_request",
        title: "New collaboration request",
        message: `${applicantName} wants to collaborate on your contribution`,
        linkUrl: `/threads/${params.contributionId}`,
      },
    })
    .catch(logBackgroundError("api/contributions/[contributionId]/collab"));

  return NextResponse.json(
    { id: collabRequest.id, status: collabRequest.status },
    { status: 201 }
  );
}
