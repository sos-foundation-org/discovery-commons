import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { earnDP } from "@/lib/points";
import { logBackgroundError } from "@/lib/log";

const awardSchema = z.object({
  recipientId: z.string().min(1),
});

/**
 * POST /api/bounties/[bountyId]/award — award a bounty to a user.
 * Only the bounty author can award. DP transfers from frozenBalance to recipient.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { bountyId: string } }
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bounty = await prisma.bounty.findUnique({
    where: { id: params.bountyId },
    include: { awards: true },
  });

  if (!bounty) {
    return NextResponse.json({ error: "Bounty not found" }, { status: 404 });
  }
  if (bounty.authorId !== session.user.id) {
    return NextResponse.json(
      { error: "Only the bounty creator can award" },
      { status: 403 }
    );
  }
  if (bounty.status !== "active") {
    return NextResponse.json(
      { error: `Bounty is ${bounty.status}` },
      { status: 400 }
    );
  }
  if (bounty.awards.length >= bounty.maxRecipients) {
    return NextResponse.json(
      { error: "All bounty slots have been awarded" },
      { status: 400 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = awardSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  const { recipientId } = parsed.data;

  // Can't award yourself
  if (recipientId === session.user.id) {
    return NextResponse.json(
      { error: "Cannot award a bounty to yourself" },
      { status: 400 }
    );
  }

  // Check duplicate award
  const existingAward = bounty.awards.find((a) => a.recipientId === recipientId);
  if (existingAward) {
    return NextResponse.json(
      { error: "This user has already been awarded" },
      { status: 409 }
    );
  }

  const amount = bounty.perRewardAmount;

  await prisma.$transaction(async (tx) => {
    // Re-count awards inside transaction (prevents race)
    const currentAwards = await tx.bountyAward.count({
      where: { bountyId: params.bountyId },
    });
    if (currentAwards >= bounty.maxRecipients) {
      throw new Error("ALL_SLOTS_AWARDED");
    }

    // Atomic deduct from frozenBalance — MUST check count
    const deductResult = await tx.pointsAccount.updateMany({
      where: { userId: session.user.id, frozenBalance: { gte: amount } },
      data: { frozenBalance: { decrement: amount } },
    });
    if (deductResult.count === 0) {
      throw new Error("Insufficient frozen balance for bounty award");
    }

    // Record the award
    await tx.bountyAward.create({
      data: {
        bountyId: params.bountyId,
        recipientId,
        amount,
      },
    });

    // Check if bounty is now complete
    if (currentAwards + 1 >= bounty.maxRecipients) {
      await tx.bounty.update({
        where: { id: params.bountyId },
        data: { status: "completed" },
      });
    }
  });

  // Credit recipient (outside transaction — non-blocking, counts toward reputation)
  earnDP(prisma, {
    userId: recipientId,
    amount,
    reason: "bounty_award",
    referenceId: params.bountyId,
    referenceType: "bounty",
    counterpartyId: session.user.id,
  }).catch((err) => console.error("Failed to credit bounty award:", err));

  // Notify recipient
  prisma.notification
    .create({
      data: {
        userId: recipientId,
        type: "bounty_awarded",
        title: `You received a ${amount} DP bounty!`,
        message: bounty.criteria
          ? `Bounty: "${bounty.criteria.slice(0, 80)}"`
          : "A bounty has been awarded to you for your contribution.",
        linkUrl: `/threads/${bounty.contributionId}`,
      },
    })
    .catch(logBackgroundError("api/bounties/[bountyId]/award"));

  return NextResponse.json({ success: true, amount });
}
