import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { adjustCreditSchema } from "@/lib/validations";
import { generateCreditHash } from "@/lib/credits";

// POST /api/v2/threads/[threadId]/credits/adjust
// Adjust a credit weight. Credit records are append-only — this creates a NEW
// versioned record (version+1) linked to the prior one via parentCreditIds,
// rather than mutating the original. Thread creator only.
export async function POST(
  request: NextRequest,
  { params }: { params: { threadId: string } }
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { threadId } = params;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
  }

  const parsed = adjustCreditSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
      select: { id: true, creatorId: true },
    });
    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }
    if (thread.creatorId !== session.user.id) {
      return NextResponse.json(
        { error: "Only the thread creator can adjust credit weights" },
        { status: 403 }
      );
    }

    const original = await prisma.creditV2.findUnique({
      where: { id: parsed.data.creditId },
    });
    if (!original || original.threadId !== threadId) {
      return NextResponse.json(
        { error: "Credit not found on this thread" },
        { status: 404 }
      );
    }

    const timestamp = new Date();
    const creditType = parsed.data.creditType ?? original.creditType;
    const parentIds = Array.isArray(original.parentCreditIds)
      ? (original.parentCreditIds as string[])
      : [];

    const adjusted = await prisma.creditV2.create({
      data: {
        contributorId: original.contributorId,
        threadId: original.threadId,
        contributionId: original.contributionId,
        creditType,
        weight: parsed.data.weight,
        hash: generateCreditHash(
          original.contributorId,
          creditType,
          original.contributionId,
          timestamp
        ),
        timestamp,
        parentCreditIds: [...parentIds, original.id],
        version: original.version + 1,
      },
    });

    return NextResponse.json(adjusted, { status: 201 });
  } catch (error) {
    console.error("Failed to adjust credit:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
