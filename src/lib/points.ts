/**
 * Discovery Points (DP) — core economy logic.
 *
 * All balance mutations use atomic `UPDATE SET balance = balance + delta`
 * inside Prisma transactions to prevent race conditions. The PointsTransaction
 * ledger is append-only and serves as the source of truth for audits.
 */

import type { Prisma, PrismaClient } from "@prisma/client";
import {
  DP_PUBLISH_REWARDS,
  DP_EVENT_REWARDS,
  DP_LIKE_MILESTONES,
  DP_PLATFORM_FEE,
  getLevel,
} from "./types";

type TxClient = Prisma.TransactionClient;

// ── Account helpers ─────────────────────────────────────────

/**
 * Get or lazily create a PointsAccount for a user.
 * Must be called inside a transaction when followed by balance mutations.
 */
export async function getOrCreateAccount(
  userId: string,
  tx: TxClient
) {
  const existing = await tx.pointsAccount.findUnique({
    where: { userId },
  });
  if (existing) return existing;
  return tx.pointsAccount.create({
    data: { userId },
  });
}

// ── Core atomic operations ──────────────────────────────────

interface EarnParams {
  userId: string;
  amount: number;
  reason: string;
  referenceId?: string;
  referenceType?: string;
  counterpartyId?: string;
}

/**
 * Award DP to a user. Atomically increments balance + lifetimeEarned,
 * recalculates reputation & level, and appends a transaction record.
 */
export async function earnDP(
  prisma: PrismaClient,
  params: EarnParams
) {
  const { userId, amount, reason, referenceId, referenceType, counterpartyId } =
    params;
  if (amount <= 0) return null;

  return prisma.$transaction(async (tx) => {
    await getOrCreateAccount(userId, tx);

    // Atomic increment — no read-modify-write race
    const account = await tx.pointsAccount.update({
      where: { userId },
      data: {
        balance: { increment: amount },
        lifetimeEarned: { increment: amount },
      },
    });

    // Recalculate reputation & level
    const reputation = computeReputation(account.lifetimeEarned);
    const level = getLevel(reputation).level;
    const updated = await tx.pointsAccount.update({
      where: { userId },
      data: { reputation, level },
    });

    // Append transaction record
    const txRecord = await tx.pointsTransaction.create({
      data: {
        accountId: updated.id,
        type: "earn",
        amount,
        reason,
        referenceId: referenceId ?? null,
        referenceType: referenceType ?? null,
        counterpartyId: counterpartyId ?? null,
        balanceAfter: updated.balance,
      },
    });

    return { account: updated, transaction: txRecord };
  });
}

interface SpendParams {
  userId: string;
  amount: number;
  reason: string;
  referenceId?: string;
  referenceType?: string;
  counterpartyId?: string;
}

/**
 * Deduct DP from a user's balance. Fails if insufficient funds.
 */
export async function spendDP(
  prisma: PrismaClient,
  params: SpendParams
) {
  const { userId, amount, reason, referenceId, referenceType, counterpartyId } =
    params;
  if (amount <= 0) return null;

  return prisma.$transaction(async (tx) => {
    await getOrCreateAccount(userId, tx);

    // Atomic conditional update — prevents race condition where two concurrent
    // spends both read the same balance and both pass the check.
    const result = await tx.pointsAccount.updateMany({
      where: { userId, balance: { gte: amount } },
      data: { balance: { decrement: amount } },
    });
    if (result.count === 0) {
      const acct = await tx.pointsAccount.findUnique({ where: { userId } });
      throw new Error(`Insufficient DP: have ${acct?.balance ?? 0}, need ${amount}`);
    }

    const updated = await tx.pointsAccount.findUniqueOrThrow({ where: { userId } });

    const txRecord = await tx.pointsTransaction.create({
      data: {
        accountId: updated.id,
        type: "spend",
        amount: -amount,
        reason,
        referenceId: referenceId ?? null,
        referenceType: referenceType ?? null,
        counterpartyId: counterpartyId ?? null,
        balanceAfter: updated.balance,
      },
    });

    return { account: updated, transaction: txRecord };
  });
}

/**
 * Transfer DP between two users (purchase flow). Includes platform fee sink.
 * Returns the buyer's and seller's updated accounts.
 */
export async function transferDP(
  prisma: PrismaClient,
  params: {
    buyerId: string;
    sellerId: string;
    amount: number;
    reason: string;
    referenceId?: string;
    referenceType?: string;
  }
) {
  const { buyerId, sellerId, amount, reason, referenceId, referenceType } = params;
  const fee = Math.round(amount * DP_PLATFORM_FEE);
  const sellerReceives = amount - fee;

  return prisma.$transaction(async (tx) => {
    // Ensure both accounts exist
    await getOrCreateAccount(buyerId, tx);
    await getOrCreateAccount(sellerId, tx);

    // Atomic conditional debit
    const debitResult = await tx.pointsAccount.updateMany({
      where: { userId: buyerId, balance: { gte: amount } },
      data: { balance: { decrement: amount } },
    });
    if (debitResult.count === 0) {
      const acct = await tx.pointsAccount.findUnique({ where: { userId: buyerId } });
      throw new Error(`Insufficient DP: have ${acct?.balance ?? 0}, need ${amount}`);
    }

    const updatedBuyer = await tx.pointsAccount.findUniqueOrThrow({ where: { userId: buyerId } });

    // Credit seller (amount minus fee)
    const updatedSeller = await tx.pointsAccount.update({
      where: { userId: sellerId },
      data: {
        balance: { increment: sellerReceives },
        // Note: purchase income does NOT count toward lifetimeEarned / reputation (R11)
      },
    });

    // Buyer transaction
    await tx.pointsTransaction.create({
      data: {
        accountId: updatedBuyer.id,
        type: "spend",
        amount: -amount,
        reason,
        referenceId: referenceId ?? null,
        referenceType: referenceType ?? null,
        counterpartyId: sellerId,
        balanceAfter: updatedBuyer.balance,
      },
    });

    // Seller transaction
    await tx.pointsTransaction.create({
      data: {
        accountId: updatedSeller.id,
        type: "transfer_in",
        amount: sellerReceives,
        reason,
        referenceId: referenceId ?? null,
        referenceType: referenceType ?? null,
        counterpartyId: buyerId,
        balanceAfter: updatedSeller.balance,
      },
    });

    // Sink transaction (platform fee burned)
    if (fee > 0) {
      await tx.pointsTransaction.create({
        data: {
          accountId: updatedSeller.id,
          type: "sink",
          amount: -fee,
          reason: "platform_fee",
          referenceId: referenceId ?? null,
          referenceType: referenceType ?? null,
          counterpartyId: null,
          balanceAfter: updatedSeller.balance,
        },
      });
    }

    return { buyer: updatedBuyer, seller: updatedSeller, fee, sellerReceives };
  });
}

// ── Freeze / unfreeze (collaboration deposits) ──────────────

export async function freezeDP(
  prisma: PrismaClient,
  userId: string,
  amount: number,
  referenceId: string
) {
  if (amount <= 0) return null;

  return prisma.$transaction(async (tx) => {
    await getOrCreateAccount(userId, tx);

    // Atomic conditional update
    const result = await tx.pointsAccount.updateMany({
      where: { userId, balance: { gte: amount } },
      data: {
        balance: { decrement: amount },
        frozenBalance: { increment: amount },
      },
    });
    if (result.count === 0) {
      const acct = await tx.pointsAccount.findUnique({ where: { userId } });
      throw new Error(`Insufficient DP for deposit: have ${acct?.balance ?? 0}, need ${amount}`);
    }

    const updated = await tx.pointsAccount.findUniqueOrThrow({ where: { userId } });

    await tx.pointsTransaction.create({
      data: {
        accountId: updated.id,
        type: "freeze",
        amount: -amount,
        reason: "collab_deposit",
        referenceId,
        referenceType: "collaboration",
        counterpartyId: null,
        balanceAfter: updated.balance,
      },
    });

    return updated;
  });
}

export async function unfreezeDP(
  prisma: PrismaClient,
  userId: string,
  amount: number,
  referenceId: string
) {
  if (amount <= 0) return null;

  return prisma.$transaction(async (tx) => {
    // Idempotency: check if already unfrozen for this reference
    const existingUnfreeze = await tx.pointsTransaction.findFirst({
      where: {
        reason: "collab_deposit_refund",
        referenceId,
        type: "unfreeze",
      },
    });
    if (existingUnfreeze) return null; // Already refunded — skip

    // Only unfreeze if there's enough frozen balance
    const result = await tx.pointsAccount.updateMany({
      where: { userId, frozenBalance: { gte: amount } },
      data: {
        balance: { increment: amount },
        frozenBalance: { decrement: amount },
      },
    });
    if (result.count === 0) {
      console.warn(`unfreezeDP: no frozen balance to refund for user ${userId}, ref ${referenceId}`);
      return null;
    }

    const updated = await tx.pointsAccount.findUniqueOrThrow({ where: { userId } });

    await tx.pointsTransaction.create({
      data: {
        accountId: updated.id,
        type: "unfreeze",
        amount,
        reason: "collab_deposit_refund",
        referenceId,
        referenceType: "collaboration",
        counterpartyId: null,
        balanceAfter: updated.balance,
      },
    });

    return updated;
  });
}

// ── Reputation calculation (R11: purchases excluded) ────────

/**
 * Simplified reputation = lifetimeEarned (which only tracks base earn,
 * not purchase income — see transferDP: seller's lifetimeEarned is NOT
 * incremented). Full formula will add CreditV2 weight × 50 later.
 */
export function computeReputation(lifetimeEarned: number): number {
  return lifetimeEarned;
}

// ── Convenience: publish reward ─────────────────────────────

/**
 * Award DP for publishing a contribution. Call after the contribution
 * is successfully created/published.
 */
export async function rewardPublish(
  prisma: PrismaClient,
  userId: string,
  contributionType: string,
  contributionId: string
) {
  const amount = DP_PUBLISH_REWARDS[contributionType] ?? 10;
  return earnDP(prisma, {
    userId,
    amount,
    reason: "contribution_publish",
    referenceId: contributionId,
    referenceType: "contribution",
  });
}

/**
 * Award DP when a user's contribution receives a like.
 */
export async function rewardLikeReceived(
  prisma: PrismaClient,
  authorId: string,
  contributionId: string,
  likerId: string
) {
  return earnDP(prisma, {
    userId: authorId,
    amount: DP_EVENT_REWARDS.like_received,
    reason: "like_received",
    referenceId: contributionId,
    referenceType: "contribution",
    counterpartyId: likerId,
  });
}

/**
 * Award DP when a user posts a comment/review.
 */
export async function rewardCommentPosted(
  prisma: PrismaClient,
  commenterId: string,
  contributionId: string
) {
  return earnDP(prisma, {
    userId: commenterId,
    amount: DP_EVENT_REWARDS.comment_posted,
    reason: "comment_posted",
    referenceId: contributionId,
    referenceType: "contribution",
  });
}

/**
 * Award DP to the contribution author when they receive a review comment.
 */
export async function rewardReviewReceived(
  prisma: PrismaClient,
  authorId: string,
  contributionId: string,
  reviewerId: string
) {
  return earnDP(prisma, {
    userId: authorId,
    amount: DP_EVENT_REWARDS.review_received,
    reason: "review_received",
    referenceId: contributionId,
    referenceType: "contribution",
    counterpartyId: reviewerId,
  });
}

/**
 * Award welcome bonus for a user's first contribution.
 */
export async function rewardWelcomeBonus(
  prisma: PrismaClient,
  userId: string,
  contributionId: string
) {
  // Check if this is truly the first contribution
  const count = await prisma.contribution.count({
    where: { authorId: userId },
  });
  if (count > 1) return null; // not first

  return earnDP(prisma, {
    userId,
    amount: DP_EVENT_REWARDS.welcome_bonus,
    reason: "welcome_bonus",
    referenceId: contributionId,
    referenceType: "contribution",
  });
}
