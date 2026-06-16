import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const credits = await prisma.credit.findMany({
      where: { userId: session.user.id },
      include: {
        thread: { select: { id: true, title: true } },
        contribution: {
          select: { id: true, type: true, content: true },
        },
      },
      orderBy: { timestamp: "desc" },
    });

    const summary = {
      total: credits.length,
      byType: credits.reduce(
        (acc, c) => {
          acc[c.creditType] = (acc[c.creditType] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ),
      credits,
    };

    return NextResponse.json(summary);
  } catch (error) {
    console.error("Failed to get user credits:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
