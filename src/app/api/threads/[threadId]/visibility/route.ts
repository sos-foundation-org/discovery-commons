import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { updateVisibilitySchema } from "@/lib/validations";
import { VISIBILITY_LEVELS } from "@/lib/types";

export async function POST(
  request: NextRequest,
  { params }: { params: { threadId: string } }
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { threadId } = params;
    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
    });

    if (!thread || thread.creatorId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
    }

    const parsed = updateVisibilitySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { visibility: newLevel } = parsed.data;
    const oldIndex = VISIBILITY_LEVELS.indexOf(thread.visibility as any);
    const newIndex = VISIBILITY_LEVELS.indexOf(newLevel);

    if (newIndex <= oldIndex) {
      return NextResponse.json(
        { error: "Visibility can only be increased, not decreased" },
        { status: 400 }
      );
    }

    const [updated] = await prisma.$transaction([
      prisma.thread.update({
        where: { id: threadId },
        data: { visibility: newLevel },
      }),
      prisma.visibilityLog.create({
        data: {
          entityType: "thread",
          entityId: threadId,
          oldLevel: thread.visibility,
          newLevel,
          changedBy: session.user.id,
        },
      }),
    ]);

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update thread visibility:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
