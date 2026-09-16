import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getLevel } from "@/lib/types";

/**
 * GET /api/points/leaderboard — top 20 users by reputation (public endpoint).
 */
export async function GET() {
  const accounts = await prisma.pointsAccount.findMany({
    orderBy: { reputation: "desc" },
    take: 20,
    include: {
      user: {
        select: {
          id: true,
          displayName: true,
          name: true,
          image: true,
        },
      },
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leaderboard = accounts.map((a: any, i: number) => ({
    rank: i + 1,
    user: a.user,
    reputation: a.reputation,
    level: getLevel(a.reputation),
    lifetimeEarned: a.lifetimeEarned,
  }));

  return NextResponse.json(leaderboard);
}
