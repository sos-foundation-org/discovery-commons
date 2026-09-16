import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { freezeDP } from "@/lib/points";

const createBountySchema = z.object({
  contributionId: z.string().min(1),
  perRewardAmount: z.number().int().min(5).max(500),
  maxRecipients: z.number().int().min(1).max(20),
  seekingType: z.string().max(50).optional(),
  criteria: z.string().max(500).optional(),
  expiresInDays: z.number().int().min(1).max(90).default(30),
});

/**
 * POST /api/bounties — create a bounty on a contribution.
 * DP is frozen from the author's balance into frozenBalance.
 */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createBountySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { contributionId, perRewardAmount, maxRecipients, seekingType, criteria, expiresInDays } = parsed.data;
  const totalPool = perRewardAmount * maxRecipients;

  // Verify ownership
  const contribution = await prisma.contribution.findUnique({
    where: { id: contributionId },
    select: { authorId: true },
  });
  if (!contribution || contribution.authorId !== session.user.id) {
    return NextResponse.json(
      { error: "You can only create bounties on your own contributions" },
      { status: 403 }
    );
  }

  // Check no active bounty already exists
  const existing = await prisma.bounty.findFirst({
    where: { contributionId, status: "active" },
  });
  if (existing) {
    return NextResponse.json(
      { error: "An active bounty already exists on this contribution" },
      { status: 409 }
    );
  }

  // Freeze DP
  try {
    await freezeDP(prisma, session.user.id, totalPool, contributionId);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Insufficient DP";
    return NextResponse.json({ error: msg }, { status: 402 });
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);

  const bounty = await prisma.bounty.create({
    data: {
      contributionId,
      authorId: session.user.id,
      totalPool,
      perRewardAmount,
      maxRecipients,
      seekingType,
      criteria,
      expiresAt,
    },
  });

  return NextResponse.json(bounty, { status: 201 });
}
