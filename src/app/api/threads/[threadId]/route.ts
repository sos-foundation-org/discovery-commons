import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { STAGE_ORDER } from "@/lib/types";

export async function GET(
  request: NextRequest,
  { params }: { params: { threadId: string } }
) {
  try {
    const session = await getSession();
    const { threadId } = params;

    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
      include: {
        creator: {
          select: {
            id: true,
            displayName: true,
            name: true,
            image: true,
            trustLevel: true,
          },
        },
        contributions: {
          orderBy: { createdAt: "asc" },
          include: {
            author: {
              select: {
                id: true,
                displayName: true,
                name: true,
                image: true,
                trustLevel: true,
              },
            },
            _count: { select: { comments: true } },
          },
        },
        _count: { select: { contributions: true } },
      },
    });

    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    // Visibility check
    if (thread.visibility === "private" && thread.creatorId !== session?.user?.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (thread.visibility === "shared") {
      if (!session?.user?.id) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      if (thread.creatorId !== session.user.id) {
        const [collaborator, inCircle] = await Promise.all([
          prisma.threadCollaborator.findUnique({
            where: {
              threadId_userId: {
                threadId: thread.id,
                userId: session.user.id,
              },
            },
          }),
          prisma.trustedCircle.findFirst({
            where: {
              ownerId: thread.creatorId,
              trustedUserId: session.user.id,
            },
          }),
        ]);
        if (!collaborator && !inCircle) {
          return NextResponse.json({ error: "Not found" }, { status: 404 });
        }
      }
    }

    // Filter contributions by visibility for non-owner
    const filteredContributions = thread.contributions.filter((c) => {
      if (c.authorId === session?.user?.id) return true;
      if (c.visibility === "public") return true;
      if (c.visibility === "sealed") return true; // hash + timestamp visible; content masked client-side
      if (c.visibility === "shared" && session?.user?.id) return true;
      return false; // private
    });

    return NextResponse.json({
      ...thread,
      contributions: filteredContributions,
    });
  } catch (error) {
    console.error("Failed to get thread:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

export async function PATCH(
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

    const updates: any = {};
    if (body.title) updates.title = body.title;
    if (body.description) updates.description = body.description;
    if (body.domainTags) updates.domainTags = body.domainTags;
    if (body.isArchived !== undefined) updates.isArchived = body.isArchived;

    const updated = await prisma.thread.update({
      where: { id: threadId },
      data: updates,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update thread:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
