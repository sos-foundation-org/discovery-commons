import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { STAGE_LEVEL } from "@/lib/types";

export async function POST(
  request: NextRequest,
  { params }: { params: { threadId: string } }
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const thread = await prisma.thread.findUnique({
      where: { id: params.threadId },
      include: {
        contributions: { select: { type: true } },
      },
    });

    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    if (thread.creatorId !== session.user.id) {
      return NextResponse.json(
        { error: "Only the thread creator can advance the stage" },
        { status: 403 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
    }

    const targetStage = body.stage as string;

    const currentLevel = STAGE_LEVEL[thread.currentStage] ?? -1;
    const targetLevel = STAGE_LEVEL[targetStage] ?? -1;

    if (targetLevel < 0 || targetLevel !== currentLevel + 1) {
      return NextResponse.json(
        { error: "Can only advance to the next stage level" },
        { status: 400 }
      );
    }

    const hasContrib = thread.contributions.some((c) => c.type === targetStage);
    if (!hasContrib) {
      return NextResponse.json(
        { error: `Need at least one "${targetStage}" contribution to advance` },
        { status: 400 }
      );
    }

    const updated = await prisma.thread.update({
      where: { id: params.threadId },
      data: { currentStage: targetStage },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to advance thread stage:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
