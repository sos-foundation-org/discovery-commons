import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

// POST /api/contributions/[id]/publish — make a not-yet-public contribution
// public. Author-only. Transitions private|shared → public and stamps
// publishedAt = now, the moment credit priority is established (Web Prototype
// §3B). This is the ONLY place a plain (non-sealed) contribution gets its credit
// timestamp on an explicit user action. Publishing is irreversible (public is
// terminal). Sealed contributions must go through /reveal instead, which
// re-verifies the SHA-256 before unlocking the content.
export async function POST(
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
      select: { id: true, authorId: true, visibility: true },
    });

    if (!contribution || contribution.authorId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (contribution.visibility === "public") {
      return NextResponse.json(
        { error: "This contribution is already public" },
        { status: 400 }
      );
    }
    if (contribution.visibility === "sealed") {
      return NextResponse.json(
        {
          error:
            "Sealed contributions must be revealed, not published — use Reveal so the hash is re-verified before unlocking.",
        },
        { status: 400 }
      );
    }

    const now = new Date();
    // On Postgres the guard trigger stamps published_at authoritatively; we set
    // it here so local SQLite (no triggers) stays consistent.
    const updated = await prisma.contribution.update({
      where: { id: contribution.id },
      data: { visibility: "public", publishedAt: now },
    });

    return NextResponse.json({
      success: true,
      visibility: updated.visibility,
      publishedAt: updated.publishedAt,
    });
  } catch (error) {
    console.error("Failed to publish contribution:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
