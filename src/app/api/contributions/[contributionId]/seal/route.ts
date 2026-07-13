import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

// POST /api/contributions/[id]/seal — seal an existing (not-yet-public)
// contribution. Author-only. Transitions private|shared → sealed and stamps
// sealedAt. Public contributions cannot be sealed (already seen); sealed ones
// are a no-op error. Web Prototype §3A.7 step 2.
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
    if (contribution.visibility === "sealed") {
      return NextResponse.json(
        { error: "This contribution is already sealed" },
        { status: 400 }
      );
    }
    if (contribution.visibility === "public") {
      return NextResponse.json(
        { error: "Public contributions cannot be sealed" },
        { status: 400 }
      );
    }

    const now = new Date();
    await prisma.contribution.update({
      where: { id: contribution.id },
      data: { visibility: "sealed", sealedAt: now },
    });

    return NextResponse.json({ success: true, sealedAt: now });
  } catch (error) {
    console.error("Failed to seal contribution:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
