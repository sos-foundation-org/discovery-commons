import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generatePriorityHash } from "@/lib/hash";
import { checkContributionAccess, stripTranslations } from "@/lib/access-control";
import type { ContributionPricingMeta } from "@/lib/types";

class SealedDuringEditError extends Error {}

export async function GET(
  request: NextRequest,
  { params }: { params: { contributionId: string } }
) {
  try {
    const session = await getSession();
    const userId = session?.user?.id ?? null;

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
        thread: {
          select: { id: true, title: true, creatorId: true },
          include: { collaborators: { select: { userId: true } } },
        },
        sharedWith: { select: { userId: true } },
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

    // Access control: check visibility + gated content
    const access = await checkContributionAccess(params.contributionId, userId);
    if (!access.canView) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Mask content if sealed or gated without access
    let responseContent = contribution.content;
    if (!access.canViewContent) {
      if (contribution.visibility === "sealed" || access.isBlocked) {
        responseContent = ""; // Sealed: hash only. Blocked: nothing.
      } else {
        // Gated: return outline only
        const meta = contribution.metadata as ContributionPricingMeta | null;
        const breakPoint = meta?.outlineBreak ?? Math.min(280, contribution.content.length);
        responseContent = contribution.content.slice(0, breakPoint);
      }
    }

    // Version history and cached translations are full-content copies.
    const protectedFields = access.canViewContent
      ? {}
      : { versions: [], metadata: stripTranslations(contribution.metadata) };

    return NextResponse.json({
      ...contribution,
      ...protectedFields,
      content: responseContent,
      _access: {
        canViewContent: access.canViewContent,
        isGated: access.isGated ?? false,
      },
    });
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

    // Sealed contributions are immutable — reject edits
    if (contribution.visibility === "sealed") {
      return NextResponse.json(
        { error: "Sealed contributions cannot be edited" },
        { status: 403 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
    }

    const { content, editSummary } = body;
    if (typeof content !== "string" || content.length < 10 || content.length > 10000) {
      return NextResponse.json(
        { error: "Content must be 10–10,000 characters" },
        { status: 400 }
      );
    }
    if (editSummary !== undefined && editSummary !== null &&
        (typeof editSummary !== "string" || editSummary.length > 500)) {
      return NextResponse.json(
        { error: "Edit summary must be at most 500 characters" },
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

      // Update contribution content (original contentHash stays immutable).
      // Conditional on "not sealed" so a concurrent seal can't be overwritten.
      const { count } = await tx.contribution.updateMany({
        where: { id: contribution.id, visibility: { not: "sealed" } },
        data: { content },
      });
      if (count === 0) throw new SealedDuringEditError();
      return tx.contribution.findUniqueOrThrow({ where: { id: contribution.id } });
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof SealedDuringEditError) {
      return NextResponse.json(
        { error: "Sealed contributions cannot be edited" },
        { status: 409 }
      );
    }
    console.error("Failed to update contribution:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
