import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { summarizeCredits } from "@/lib/credits";

// GET /api/v2/threads/[threadId]/credits — credit distribution for a thread,
// aggregated per contributor and per dimension.
export async function GET(
  _request: NextRequest,
  { params }: { params: { threadId: string } }
) {
  const { threadId } = params;

  try {
    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
      select: { id: true, title: true, creatorId: true },
    });
    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    const credits = await prisma.creditV2.findMany({
      where: { threadId },
      include: {
        contributor: {
          select: { id: true, displayName: true, name: true, image: true },
        },
      },
      orderBy: { timestamp: "asc" },
    });

    const overall = summarizeCredits(credits);

    // Per-contributor breakdown.
    const byContributorMap = new Map<
      string,
      {
        contributor: (typeof credits)[number]["contributor"];
        byDimension: Record<string, number>;
        total: number;
      }
    >();
    for (const c of credits) {
      const key = c.contributorId;
      if (!byContributorMap.has(key)) {
        byContributorMap.set(key, {
          contributor: c.contributor,
          byDimension: {},
          total: 0,
        });
      }
      const entry = byContributorMap.get(key)!;
      entry.byDimension[c.creditType] =
        (entry.byDimension[c.creditType] || 0) + c.weight;
      entry.total += c.weight;
    }

    return NextResponse.json({
      threadId: thread.id,
      title: thread.title,
      overall,
      byContributor: Array.from(byContributorMap.values()),
    });
  } catch (error) {
    console.error("Failed to get thread credits:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
