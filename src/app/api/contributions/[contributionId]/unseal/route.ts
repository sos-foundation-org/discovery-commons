import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: { contributionId: string } }
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const contribution = await prisma.contribution.findUnique({
      where: { id: params.contributionId },
      include: { sealedReg: true },
    });

    if (!contribution || contribution.authorId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (!contribution.sealedReg || contribution.sealedReg.status !== "sealed") {
      return NextResponse.json(
        { error: "This contribution is not sealed" },
        { status: 400 }
      );
    }

    await prisma.sealedRegistration.update({
      where: { id: contribution.sealedReg.id },
      data: { status: "revealed", revealedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to unseal contribution:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
