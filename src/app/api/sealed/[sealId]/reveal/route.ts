import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateContentHash, generatePriorityHash } from "@/lib/hash";
import { revealSealSchema } from "@/lib/validations";
import { STAGE_ORDER } from "@/lib/types";

export async function POST(
  request: NextRequest,
  { params }: { params: { sealId: string } }
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const seal = await prisma.sealedRegistration.findUnique({
      where: { id: params.sealId },
    });

    if (!seal || seal.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (seal.status !== "sealed") {
      return NextResponse.json(
        { error: "This seal has already been revealed" },
        { status: 400 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
    }

    const parsed = revealSealSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { content, threadId, type } = parsed.data;

    // Verify the hash matches
    const computedHash = generateContentHash(content);
    if (computedHash !== seal.contentHash) {
      return NextResponse.json(
        {
          error:
            "Content does not match the sealed hash. The content must be exactly what was originally sealed.",
        },
        { status: 400 }
      );
    }

    // Verify thread exists
    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
    });
    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    const now = new Date();
    const priorityHash = generatePriorityHash(session.user.id, content, seal.registeredAt);

    const result = await prisma.$transaction(async (tx) => {
      // Create contribution with ORIGINAL seal timestamp for priority
      const contribution = await tx.contribution.create({
        data: {
          threadId,
          authorId: session.user.id,
          type,
          content,
          contentHash: priorityHash,
          visibility: thread.visibility,
          createdAt: now,
        },
      });

      // Create version
      await tx.contributionVersion.create({
        data: {
          contributionId: contribution.id,
          versionNumber: 1,
          content,
          contentHash: priorityHash,
        },
      });

      // Create credit with original seal time
      await tx.credit.create({
        data: {
          userId: session.user.id,
          threadId,
          contributionId: contribution.id,
          creditType: `sealed_${type}`,
          hash: priorityHash,
          timestamp: seal.registeredAt,
        },
      });

      // Update seal
      const updatedSeal = await tx.sealedRegistration.update({
        where: { id: seal.id },
        data: {
          status: "revealed",
          revealedAt: now,
          contributionId: contribution.id,
        },
      });

      // Update thread stage
      const stageIndex = STAGE_ORDER.indexOf(type as any);
      const currentIndex = STAGE_ORDER.indexOf(thread.currentStage as any);
      if (stageIndex > currentIndex) {
        await tx.thread.update({
          where: { id: threadId },
          data: { currentStage: type },
        });
      }

      return { seal: updatedSeal, contribution };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to reveal sealed registration:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
