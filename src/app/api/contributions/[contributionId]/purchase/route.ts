import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { DP_PLATFORM_FEE } from "@/lib/types";
import type { ContributionPricingMeta } from "@/lib/types";

/**
 * POST /api/contributions/[contributionId]/purchase
 * Purchase access to gated content. Transfers DP from buyer to seller
 * with platform fee sink. Creates a ContentPurchase record.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: { contributionId: string } }
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const buyerId = session.user.id;
  const contributionId = params.contributionId;

  try {
    // Get contribution + author
    const contribution = await prisma.contribution.findUnique({
      where: { id: contributionId },
      select: {
        id: true,
        authorId: true,
        metadata: true,
        visibility: true,
      },
    });

    if (!contribution) {
      return NextResponse.json({ error: "Contribution not found" }, { status: 404 });
    }

    // Can't buy your own content
    if (contribution.authorId === buyerId) {
      return NextResponse.json(
        { error: "You cannot purchase your own content" },
        { status: 400 }
      );
    }

    // Check if buyer is blocked by the author
    const blockRule = await prisma.contentAccessRule.findFirst({
      where: {
        ownerId: contribution.authorId,
        targetUserId: buyerId,
        action: "block",
        OR: [
          { targetContributionId: null },
          { targetContributionId: contributionId },
        ],
      },
    }).catch(() => null);
    if (blockRule) {
      return NextResponse.json(
        { error: "You cannot purchase this content" },
        { status: 403 }
      );
    }

    // Check if content is actually priced
    const meta = contribution.metadata as ContributionPricingMeta | null;
    const accessMode = meta?.accessMode ?? "open";
    if (!accessMode.includes("priced") || !meta?.price) {
      return NextResponse.json(
        { error: "This content is not available for purchase" },
        { status: 400 }
      );
    }

    const price = meta.price;
    const fee = Math.round(price * DP_PLATFORM_FEE);
    const sellerReceives = price - fee;

    // Atomic transaction: check duplicate + transfer DP + record purchase
    // Prevents TOCTOU race where concurrent requests both pass the
    // existence check and double-charge the buyer.
    const result = await prisma.$transaction(async (tx) => {
      // Check if already purchased (inside transaction)
      const existing = await tx.contentPurchase.findUnique({
        where: { buyerId_contributionId: { buyerId, contributionId } },
      });
      if (existing) {
        throw new Error("ALREADY_PURCHASED");
      }

      // Check buyer balance (atomic condition)
      const buyerAccount = await tx.pointsAccount.findUnique({
        where: { userId: buyerId },
      });
      if (!buyerAccount || buyerAccount.balance < price) {
        throw new Error(`Insufficient DP: have ${buyerAccount?.balance ?? 0}, need ${price}`);
      }

      // Debit buyer
      const updatedBuyer = await tx.pointsAccount.update({
        where: { userId: buyerId },
        data: { balance: { decrement: price } },
      });
      // Credit seller (purchase income does NOT count toward lifetimeEarned — R11)
      const sellerAccount = await tx.pointsAccount.upsert({
        where: { userId: contribution.authorId },
        update: { balance: { increment: sellerReceives } },
        create: { userId: contribution.authorId, balance: sellerReceives },
      });

      // Transaction records
      await tx.pointsTransaction.create({
        data: {
          accountId: updatedBuyer.id,
          type: "spend",
          amount: -price,
          reason: "content_purchase",
          referenceId: contributionId,
          referenceType: "contribution",
          counterpartyId: contribution.authorId,
          balanceAfter: updatedBuyer.balance,
        },
      });
      await tx.pointsTransaction.create({
        data: {
          accountId: sellerAccount.id,
          type: "transfer_in",
          amount: sellerReceives,
          reason: "content_purchase",
          referenceId: contributionId,
          referenceType: "contribution",
          counterpartyId: buyerId,
          balanceAfter: sellerAccount.balance,
        },
      });

      // Record the purchase
      await tx.contentPurchase.create({
        data: {
          buyerId,
          contributionId,
          pricePaid: price,
          platformFee: fee,
          sellerReceived: sellerReceives,
        },
      });

      return { pricePaid: price };
    });

    return NextResponse.json({
      success: true,
      pricePaid: result.pricePaid,
      message: "Content unlocked successfully",
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Purchase failed";
    if (message === "ALREADY_PURCHASED") {
      return NextResponse.json(
        { error: "You already have access to this content" },
        { status: 400 }
      );
    }
    if (message.includes("Insufficient DP")) {
      return NextResponse.json(
        { error: message },
        { status: 402 } // Payment Required
      );
    }
    console.error("Purchase failed:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
