import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { summarizeCredits } from "@/lib/credits";

// GET /api/v2/credits/me — personal nine-dimension credit portfolio.
export async function GET(_request: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const credits = await prisma.creditV2.findMany({
      where: { contributorId: session.user.id },
      include: {
        thread: { select: { id: true, title: true } },
        contribution: { select: { id: true, type: true } },
      },
      orderBy: { timestamp: "desc" },
    });

    const summary = summarizeCredits(credits);

    return NextResponse.json({ ...summary, credits });
  } catch (error) {
    console.error("Failed to get v2 credit portfolio:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
