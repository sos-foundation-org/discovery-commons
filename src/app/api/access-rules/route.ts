import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

const createRuleSchema = z.object({
  targetUserId: z.string().min(1),
  targetContributionId: z.string().min(1).optional(),
  action: z.enum(["block", "allow"]),
  reason: z.string().max(200).optional(),
});

/**
 * GET /api/access-rules — list the current user's access rules.
 */
export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rules = await prisma.contentAccessRule.findMany({
    where: { ownerId: session.user.id },
    include: {
      targetUser: {
        select: { id: true, displayName: true, name: true, image: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(rules);
}

/**
 * POST /api/access-rules — create a block or allow rule.
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

  const parsed = createRuleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { targetUserId, targetContributionId, action, reason } = parsed.data;

  // Can't block/allow yourself
  if (targetUserId === session.user.id) {
    return NextResponse.json(
      { error: "Cannot create a rule targeting yourself" },
      { status: 400 }
    );
  }

  // If contribution-specific, verify ownership
  if (targetContributionId) {
    const contrib = await prisma.contribution.findUnique({
      where: { id: targetContributionId },
      select: { authorId: true },
    });
    if (!contrib || contrib.authorId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only manage access rules for your own contributions" },
        { status: 403 }
      );
    }
  }

  try {
    // Manual upsert: a compound-unique `where` can't match a NULL
    // targetContributionId (user-level rules), so the old upsert never found
    // existing user-level rules and created duplicates.
    const rule = await prisma.$transaction(async (tx) => {
      const existing = await tx.contentAccessRule.findFirst({
        where: {
          ownerId: session.user.id,
          targetUserId,
          targetContributionId: targetContributionId ?? null,
        },
        select: { id: true },
      });
      if (existing) {
        return tx.contentAccessRule.update({
          where: { id: existing.id },
          data: { action, reason },
        });
      }
      return tx.contentAccessRule.create({
        data: {
          ownerId: session.user.id,
          targetUserId,
          targetContributionId: targetContributionId ?? null,
          action,
          reason,
        },
      });
    });

    return NextResponse.json(rule, { status: 201 });
  } catch (error) {
    console.error("Failed to create access rule:", error);
    return NextResponse.json(
      { error: "Failed to create rule" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/access-rules?id=<ruleId> — remove a rule.
 */
export async function DELETE(request: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const ruleId = searchParams.get("id");
  if (!ruleId) {
    return NextResponse.json({ error: "Missing rule id" }, { status: 400 });
  }

  const rule = await prisma.contentAccessRule.findUnique({
    where: { id: ruleId },
  });
  if (!rule || rule.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.contentAccessRule.delete({ where: { id: ruleId } });
  return NextResponse.json({ success: true });
}
