import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createContributionSchema } from "@/lib/validations";
import { generatePriorityHash } from "@/lib/hash";
import { STAGE_LEVEL } from "@/lib/types";
import { generateCredits } from "@/lib/credits";

// Assemble the per-type metadata JSON (undefined when empty so we don't store {}).
function buildMetadata(
  type: string,
  opts: { methodAppliesTo?: string[]; dataUrl?: string }
): Prisma.InputJsonValue | undefined {
  const meta: Record<string, string | string[]> = {};
  if (type === "methodology" && opts.methodAppliesTo?.length) {
    meta.methodAppliesTo = opts.methodAppliesTo;
  }
  if (type === "data" && opts.dataUrl) {
    meta.dataUrl = opts.dataUrl;
  }
  return Object.keys(meta).length ? meta : undefined;
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
  }

  try {
    const parsed = createContributionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { threadId, type, content, visibility, parentId, sealed, circleUserIds, methodAppliesTo, dataUrl } = parsed.data;

    // When visibility is "shared", circleUserIds can restrict which collaborators
    // see this contribution. Persisted via ContributionShare in the seal/collab pass;
    // for now the shared check in the thread route uses the creator's full trusted circle.
    void circleUserIds;

    // Verify thread exists and user has access
    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
    });
    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    const now = new Date();
    const contentHash = generatePriorityHash(session.user.id, content, now);

    // Sealing overrides the chosen visibility: content is hidden, hash is public.
    const effectiveVisibility = sealed
      ? "sealed"
      : visibility || thread.visibility;

    const contribution = await prisma.$transaction(async (tx) => {
      // Create contribution
      const contrib = await tx.contribution.create({
        data: {
          threadId,
          authorId: session.user.id,
          type,
          content,
          contentHash,
          visibility: effectiveVisibility,
          sealedAt: sealed ? now : null,
          // Credit timestamp: a contribution created directly public is
          // published on the spot (Web Prototype §3B). Non-public → null (no
          // credit priority yet). Mirrors the Postgres INSERT guard trigger.
          publishedAt: effectiveVisibility === "public" ? now : null,
          parentId,
          // Per-type structured extras stored on the contribution.
          metadata: buildMetadata(type, { methodAppliesTo, dataUrl }),
          createdAt: now,
        },
        include: {
          author: {
            select: {
              id: true,
              displayName: true,
              name: true,
              image: true,
            },
          },
        },
      });

      // Create initial version
      await tx.contributionVersion.create({
        data: {
          contributionId: contrib.id,
          versionNumber: 1,
          content,
          contentHash,
        },
      });

      // Create credit (legacy v1 — preserved for backwards compatibility)
      await tx.credit.create({
        data: {
          userId: session.user.id,
          threadId,
          contributionId: contrib.id,
          creditType: type,
          hash: contentHash,
        },
      });

      // Create CreditV2 records (9-dimension system) for this contribution.
      await generateCredits(
        { id: contrib.id, authorId: contrib.authorId, threadId, type },
        tx
      );

      // Create sealed registration if requested
      if (sealed) {
        await tx.sealedRegistration.create({
          data: {
            userId: session.user.id,
            contentHash: contentHash,
            title: content.slice(0, 80),
            contributionId: contrib.id,
            status: "sealed",
          },
        });
      }

      // Update thread stage if this contribution advances it (level-based)
      const typeLevel = STAGE_LEVEL[type] ?? -1;
      const currentLevel = STAGE_LEVEL[thread.currentStage] ?? -1;
      if (typeLevel > currentLevel) {
        await tx.thread.update({
          where: { id: threadId },
          data: { currentStage: type },
        });
      }

      return contrib;
    });

    // Notify thread creator (outside transaction, non-blocking)
    if (thread.creatorId !== session.user.id) {
      const authorName =
        contribution.author.displayName || contribution.author.name || "Someone";
      prisma.notification
        .create({
          data: {
            userId: thread.creatorId,
            type: "new_contribution",
            title: `New ${type} on your thread`,
            message: `${authorName} added a ${type} to "${thread.title.slice(0, 60)}"`,
            linkUrl: `/threads/${threadId}`,
          },
        })
        .catch(() => {});
    }

    return NextResponse.json(contribution, { status: 201 });
  } catch (error) {
    console.error("Failed to create contribution:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
