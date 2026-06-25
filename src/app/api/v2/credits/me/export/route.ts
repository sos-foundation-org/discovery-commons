import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { summarizeCredits } from "@/lib/credits";

// GET /api/v2/credits/me/export?format=credit|json|csv
// Export the nine-dimension credit portfolio. `credit` is a CRediT-compatible
// JSON shape that maps DC dimensions to a contributor-role summary.
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "json";

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, displayName: true, orcidId: true },
    });

    const credits = await prisma.creditV2.findMany({
      where: { contributorId: session.user.id },
      include: {
        thread: { select: { id: true, title: true } },
        contribution: { select: { id: true, type: true } },
      },
      orderBy: { timestamp: "desc" },
    });

    if (format === "csv") {
      const csv = [
        "timestamp,thread,contribution_type,credit_type,weight,version,hash",
        ...credits.map(
          (c) =>
            `${c.timestamp.toISOString()},${JSON.stringify(c.thread.title)},${c.contribution?.type || ""},${c.creditType},${c.weight},${c.version},${c.hash}`
        ),
      ].join("\n");

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": "attachment; filename=dc-credits-v2.csv",
        },
      });
    }

    const summary = summarizeCredits(credits);

    if (format === "credit") {
      // CRediT-compatible export: a per-dimension contribution summary.
      const creditTaxonomy = Object.entries(summary.byDimension).map(
        ([dimension, weight]) => ({
          role: dimension,
          weight,
        })
      );
      return NextResponse.json({
        contributor: {
          id: user?.id,
          name: user?.displayName || user?.name,
          orcid: user?.orcidId || null,
        },
        generatedAt: new Date().toISOString(),
        format: "CRediT-compatible",
        totalWeight: summary.total,
        contributions: creditTaxonomy,
      });
    }

    return NextResponse.json({ ...summary, credits });
  } catch (error) {
    console.error("Failed to export v2 credits:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
