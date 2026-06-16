import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { covenantAcceptedAt: new Date() },
    });

    return NextResponse.json({ accepted: true, acceptedAt: user.covenantAcceptedAt });
  } catch (error) {
    console.error("Failed to accept covenant:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
