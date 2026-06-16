import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { sealId: string } }
) {
  try {
    const seal = await prisma.sealedRegistration.findUnique({
      where: { id: params.sealId },
      select: {
        id: true,
        contentHash: true,
        registeredAt: true,
        status: true,
        revealedAt: true,
        contributionId: true,
      },
    });

    if (!seal) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
      sealId: seal.id,
      hash: seal.contentHash,
      registeredAt: seal.registeredAt,
      status: seal.status,
      revealedAt: seal.revealedAt,
      contributionId: seal.contributionId,
    });
  } catch (error) {
    console.error("Failed to verify seal:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
