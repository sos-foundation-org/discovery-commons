import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "json";

    const credits = await prisma.credit.findMany({
      where: { userId: session.user.id },
      include: {
        thread: { select: { id: true, title: true } },
        contribution: { select: { id: true, type: true, content: true } },
      },
      orderBy: { timestamp: "desc" },
    });

    if (format === "csv") {
      const csv = [
        "timestamp,thread,contribution_type,credit_type,hash",
        ...credits.map(
          (c) =>
            `${c.timestamp.toISOString()},${JSON.stringify(c.thread.title)},${c.contribution?.type || ""},${c.creditType},${c.hash}`
        ),
      ].join("\n");

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": "attachment; filename=dc-credits.csv",
        },
      });
    }

    return NextResponse.json(credits);
  } catch (error) {
    console.error("Failed to list credits:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
