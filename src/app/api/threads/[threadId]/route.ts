import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { STAGE_ORDER } from "@/lib/types";
import { updateThreadSchema } from "@/lib/validations";
import {
  canViewThread,
  evaluateContributionAccess,
  loadViewerAccessSets,
  outlineOf,
  stripTranslations,
} from "@/lib/access-control";

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
            sharedWith: { select: { userId: true } },
            _count: { select: { comments: true } },
          },
        },
        collaborators: { select: { userId: true } },
        _count: { select: { contributions: true } },
      },
    });

    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    // Visibility check — same gate as the thread page.
    const userId = session?.user?.id ?? null;
    const collaboratorIds = thread.collaborators.map((c) => c.userId);
    const threadGate = {
      creatorId: thread.creatorId,
      visibility: thread.visibility,
      collaboratorIds,
    };
    if (!canViewThread(threadGate, userId)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Per-contribution access: hide what the viewer can't see, and strip
    // content (server-side) for sealed / gated-unpurchased / blocked items.
    const accessSets = await loadViewerAccessSets(thread.contributions, userId);
    const filteredContributions = thread.contributions.flatMap(
      ({ sharedWith, ...c }) => {
        const access = evaluateContributionAccess(
          {
            id: c.id,
            authorId: c.authorId,
            visibility: c.visibility,
            sharedWith: sharedWith.map((s) => s.userId),
            thread: threadGate,
            metadata: c.metadata as { accessMode?: string; price?: number } | null,
          },
          userId,
          accessSets
        );
        if (!access.canView) return [];
        if (access.canViewContent) return [c];
        return [
          {
            ...c,
            content:
              c.visibility === "sealed" || access.isBlocked
                ? ""
                : outlineOf(c.content, c.metadata),
            metadata: stripTranslations(c.metadata),
            _access: { canViewContent: false, isGated: access.isGated ?? false },
          },
        ];
      }
    );

    return NextResponse.json({
      ...thread,
      collaborators: undefined,
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

    const parsed = updateThreadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const updated = await prisma.thread.update({
      where: { id: threadId },
      data: parsed.data,
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
