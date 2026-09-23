import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { rewardLikeReceived } from "@/lib/points";
import { logBackgroundError } from "@/lib/log";
import { rateLimit } from "@/lib/rate-limit";

// POST — toggle the current user's like on a contribution. Returns { liked, count }.
export async function POST(
  _req: NextRequest,
  { params }: { params: { contributionId: string } }
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // Rate limit: 30 likes per 10 minutes per user
  const likeKey = `like:${session.user.id}`;
  if (!rateLimit(likeKey, 30, 10 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many likes. Please slow down." },
      { status: 429 }
    );
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

    // Award DP to the contribution author (non-blocking, only on new like)
    const contribution = await prisma.contribution
      .findUnique({ where: { id: contributionId }, select: { authorId: true } })
      .catch(() => null);
    if (contribution && contribution.authorId !== userId) {
      rewardLikeReceived(prisma, contribution.authorId, contributionId, userId).catch(logBackgroundError("api/contributions/[contributionId]/like"));
    }
  }

  const count = await prisma.contributionLike.count({ where: { contributionId } });
  return NextResponse.json({ liked: !existing, count });
}
