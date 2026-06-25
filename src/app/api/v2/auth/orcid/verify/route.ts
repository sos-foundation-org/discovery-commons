import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/v2/auth/orcid/verify — report the current account's ORCID linkage.
export async function GET(_request: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { orcidId: true, orcidVerified: true },
    });

    return NextResponse.json({
      linked: Boolean(user?.orcidId),
      orcidId: user?.orcidId ?? null,
      verified: user?.orcidVerified ?? false,
    });
  } catch (error) {
    console.error("Failed to verify ORCID:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
