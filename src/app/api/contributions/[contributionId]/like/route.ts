import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

// POST — toggle the current user's like on a contribution. Returns { liked, count }.
export async function POST(
  _req: NextRequest,
  { params }: { params: { contributionId: string } }
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const contributionId = params.contributionId;
  const userId = session.user.id;

  const existing = await prisma.contributionLike.findUnique({
    where: { contributionId_userId: { contributionId, userId } },
  });

  if (existing) {
    await prisma.contributionLike.delete({ where: { id: existing.id } });
  } else {
    await prisma.contributionLike
      .create({ data: { contributionId, userId } })
      .catch(() => {});
  }

  const count = await prisma.contributionLike.count({ where: { contributionId } });
  return NextResponse.json({ liked: !existing, count });
}
