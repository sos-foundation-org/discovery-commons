import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createReplicationSchema } from "@/lib/validations";
import { updateVerificationBadge } from "@/lib/verification";

// GET /api/v2/threads/[threadId]/replications — list replications of a thread.
export async function GET(
  _request: NextRequest,
  { params }: { params: { threadId: string } }
) {
  const { threadId } = params;
  try {
    const replications = await prisma.replication.findMany({
      where: { originalThreadId: threadId },
      include: {
        replicationThread: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ replications });
  } catch (error) {
    console.error("Failed to list replications:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

// POST /api/v2/threads/[threadId]/replications — register a replication attempt
// against this (original) thread. Recomputes the original thread's badge.
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

  const parsed = createReplicationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const [original, replicationThread] = await Promise.all([
      prisma.thread.findUnique({ where: { id: threadId }, select: { id: true } }),
      prisma.thread.findUnique({
        where: { id: parsed.data.replicationThreadId },
        select: { id: true },
      }),
    ]);

    if (!original) {
      return NextResponse.json({ error: "Original thread not found" }, { status: 404 });
    }
    if (!replicationThread) {
      return NextResponse.json(
        { error: "Replication thread not found" },
        { status: 404 }
      );
    }
    if (replicationThread.id === original.id) {
      return NextResponse.json(
        { error: "A thread cannot replicate itself" },
        { status: 400 }
      );
    }

    const replication = await prisma.$transaction(async (tx) => {
      const created = await tx.replication.create({
        data: {
          originalThreadId: threadId,
          replicationThreadId: parsed.data.replicationThreadId,
          outcome: parsed.data.outcome,
          notes: parsed.data.notes,
          contributionId: parsed.data.contributionId,
        },
      });
      await updateVerificationBadge(threadId, tx);
      return created;
    });

    return NextResponse.json(replication, { status: 201 });
  } catch (error) {
    console.error("Failed to register replication:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
