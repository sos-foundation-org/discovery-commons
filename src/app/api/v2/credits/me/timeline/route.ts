import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/v2/credits/me/timeline — chronological credit history with running
// totals, suitable for a timeline visualization.
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
      orderBy: { timestamp: "asc" },
    });

    let cumulative = 0;
    const timeline = credits.map((c) => {
      cumulative += c.weight;
      return {
        id: c.id,
        timestamp: c.timestamp,
        creditType: c.creditType,
        weight: c.weight,
        cumulativeWeight: cumulative,
        thread: c.thread,
        contributionType: c.contribution?.type ?? null,
      };
    });

    return NextResponse.json({ timeline });
  } catch (error) {
    console.error("Failed to get credit timeline:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
