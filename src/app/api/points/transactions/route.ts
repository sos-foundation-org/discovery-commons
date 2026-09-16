import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * GET /api/points/transactions?cursor=<id>&limit=<n>
 * Paginated transaction history for the current user.
 */
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor");
  const limit = Math.min(Number(searchParams.get("limit") || "50"), 100);

  const account = await prisma.pointsAccount.findUnique({
    where: { userId: session.user.id },
  });
  if (!account) {
    return NextResponse.json({ transactions: [], hasMore: false });
  }

  const transactions = await prisma.pointsTransaction.findMany({
    where: { accountId: account.id },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor
      ? { cursor: { id: cursor }, skip: 1 }
      : {}),
  });

  const hasMore = transactions.length > limit;
  if (hasMore) transactions.pop();

  return NextResponse.json({
    transactions,
    hasMore,
    nextCursor: hasMore ? transactions[transactions.length - 1]?.id : null,
  });
}
