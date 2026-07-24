import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { verifyHash } from "@/lib/hash";

const revealSchema = z.object({
  visibility: z.enum(["shared", "public"]).default("public"),
});

// POST /api/contributions/[id]/reveal — reveal a sealed contribution.
// Author-only. Transitions visibility sealed → shared|public, stamps revealedAt,
// and verifies SHA-256(content) still matches the recorded hash (proving the
// content is unchanged since it was sealed). Web Prototype §3A.7 step 4.
export async function POST(
  request: NextRequest,
  { params }: { params: { contributionId: string } }
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = revealSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { visibility } = parsed.data;

  try {
    const contribution = await prisma.contribution.findUnique({
      where: { id: params.contributionId },
      include: { sealedReg: true },
    });

    if (!contribution || contribution.authorId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (contribution.visibility !== "sealed") {
      return NextResponse.json(
        { error: "This contribution is not sealed" },
        { status: 400 }
      );
    }

    // Integrity check: the content that produced the public hash must be intact.
    const hashVerified = verifyHash(
      contribution.authorId,
      contribution.content,
      contribution.createdAt,
      contribution.contentHash
    );
    if (!hashVerified) {
      return NextResponse.json(
        {
          error:
            "Hash verification failed — the sealed content does not match its recorded SHA-256. Reveal aborted.",
        },
        { status: 409 }
      );
    }

    const now = new Date();
    const updated = await prisma.$transaction(async (tx) => {
      const c = await tx.contribution.update({
        where: { id: contribution.id },
        data: {
          visibility,
          revealedAt: now,
          // Revealing to public is a publish: it establishes credit priority
          // (Web Prototype §3B). Revealing to shared does not. On Postgres the
          // guard trigger stamps published_at authoritatively; we set it here so
          // local SQLite (no triggers) stays consistent.
          ...(visibility === "public" ? { publishedAt: now } : {}),
        },
      });
      // Keep the legacy SealedRegistration in sync if one exists.
      if (contribution.sealedReg && contribution.sealedReg.status === "sealed") {
        await tx.sealedRegistration.update({
          where: { id: contribution.sealedReg.id },
          data: { status: "revealed", revealedAt: now },
        });
      }
      return c;
    });

    return NextResponse.json({
      success: true,
      visibility: updated.visibility,
      revealedAt: now,
      publishedAt: updated.publishedAt,
      hashVerified: true,
    });
  } catch (error) {
    console.error("Failed to reveal contribution:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
