import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const entry = await prisma.trustedCircle.findUnique({
      where: {
        ownerId_trustedUserId: {
          ownerId: session.user.id,
          trustedUserId: params.userId,
        },
      },
    });

    if (!entry) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.trustedCircle.delete({
      where: { id: entry.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to remove user from trusted circle:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
