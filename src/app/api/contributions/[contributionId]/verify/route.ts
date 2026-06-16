import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyHash } from "@/lib/hash";

export async function GET(
  request: NextRequest,
  { params }: { params: { contributionId: string } }
) {
  try {
    const contribution = await prisma.contribution.findUnique({
      where: { id: params.contributionId },
      select: {
        id: true,
        content: true,
        contentHash: true,
        authorId: true,
        createdAt: true,
      },
    });

    if (!contribution) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const isValid = verifyHash(
      contribution.authorId,
      contribution.content,
      contribution.createdAt,
      contribution.contentHash
    );

    return NextResponse.json({
      contributionId: contribution.id,
      hash: contribution.contentHash,
      timestamp: contribution.createdAt,
      verified: isValid,
    });
  } catch (error) {
    console.error("Failed to verify contribution hash:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
