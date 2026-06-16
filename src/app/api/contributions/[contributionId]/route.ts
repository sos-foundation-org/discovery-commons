import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generatePriorityHash } from "@/lib/hash";

export async function GET(
  request: NextRequest,
  { params }: { params: { contributionId: string } }
) {
  try {
    const contribution = await prisma.contribution.findUnique({
      where: { id: params.contributionId },
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
        thread: { select: { id: true, title: true, creatorId: true } },
        versions: { orderBy: { versionNumber: "desc" } },
        comments: {
          orderBy: { createdAt: "asc" },
          include: {
            author: {
              select: { id: true, displayName: true, name: true, image: true },
            },
          },
        },
        _count: { select: { comments: true } },
      },
    });

    if (!contribution) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(contribution);
  } catch (error) {
    console.error("Failed to get contribution:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { contributionId: string } }
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const contribution = await prisma.contribution.findUnique({
      where: { id: params.contributionId },
      include: { versions: { orderBy: { versionNumber: "desc" }, take: 1 } },
    });

    if (!contribution || contribution.authorId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
    }

    const { content, editSummary } = body;
    if (!content || content.length < 10) {
      return NextResponse.json(
        { error: "Content must be at least 10 characters" },
        { status: 400 }
      );
    }

    const now = new Date();
    const newHash = generatePriorityHash(session.user.id, content, now);
    const nextVersion = (contribution.versions[0]?.versionNumber ?? 0) + 1;

    const updated = await prisma.$transaction(async (tx) => {
      // Create new version (preserves old hash)
      await tx.contributionVersion.create({
        data: {
          contributionId: contribution.id,
          versionNumber: nextVersion,
          content,
          contentHash: newHash,
          editSummary,
        },
      });

      // Update contribution content (original contentHash stays immutable)
      return tx.contribution.update({
        where: { id: contribution.id },
        data: { content },
      });
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update contribution:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
