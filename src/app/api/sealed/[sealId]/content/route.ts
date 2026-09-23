import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { sealId: string } }
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const seal = await prisma.sealedRegistration.findUnique({
      where: { id: params.sealId },
    });

    if (!seal || seal.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // sealedContent is a new schema field — remove `as any` after `prisma generate`.
    const sealedContent = (seal as any).sealedContent as string | null;
    if (!sealedContent) {
      return NextResponse.json(
        { error: "No stored content for this seal (created before content storage was enabled)" },
        { status: 404 }
      );
    }

    return NextResponse.json({ content: sealedContent });
  } catch (error) {
    console.error("Failed to retrieve sealed content:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
