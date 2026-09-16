import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getLevel, getLevelProgress, LEVELS } from "@/lib/types";

/**
 * GET /api/points — returns the current user's DP balance, level, and
 * recent transactions. Creates the account lazily if it doesn't exist.
 */
export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  let account = await prisma.pointsAccount.findUnique({
    where: { userId },
  });

  // Lazy-create on first access
  if (!account) {
    account = await prisma.pointsAccount.create({ data: { userId } });
  }

  const levelInfo = getLevel(account.reputation);
  const progress = getLevelProgress(account.reputation);
  const nextLevel = LEVELS.find((l) => l.level === levelInfo.level + 1) ?? null;

  // Recent transactions (last 20)
  const transactions = await prisma.pointsTransaction.findMany({
    where: { accountId: account.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json({
    balance: account.balance,
    frozenBalance: account.frozenBalance,
    lifetimeEarned: account.lifetimeEarned,
    reputation: account.reputation,
    level: levelInfo,
    progress,
    nextLevel,
    transactions,
  });
}
