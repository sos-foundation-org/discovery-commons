import crypto from "crypto";
import type { Prisma, PrismaClient, Contribution, CreditV2 } from "@prisma/client";
import type { CreditDimension } from "./types";

/**
 * Maps a contribution type to the credit dimension(s) it generates.
 * The prototype uses the 5-dimension model (idea/data/method/analysis/
 * validation — see PROTOTYPE_CREDIT_DIMENSIONS). Method contributions earn the
 * dedicated "method" dimension; there is no separate communication dimension
 * yet. The full 9-dim set is reintroduced in the production credit system.
 */
export const CREDIT_TYPE_MAP: Record<string, CreditDimension[]> = {
  question: ["idea"],
  hypothesis: ["idea"],
  data: ["data"],
  simulation: ["data"],
  statistics: ["analysis"],
  interpretation: ["analysis"],
  insight: ["idea"],
  methodology: ["method"],
  replication: ["validation"],
};

/**
 * SHA-256 of (contributorId + creditType + contributionId + timestamp).
 * Matches the brief's hash formula. Credit records are append-only:
 * hash and timestamp are never mutated after creation.
 */
export function generateCreditHash(
  contributorId: string,
  creditType: string,
  contributionId: string | null,
  timestamp: Date
): string {
  const payload = `${contributorId}|${creditType}|${contributionId ?? ""}|${timestamp.toISOString()}`;
  return crypto.createHash("sha256").update(payload, "utf-8").digest("hex");
}

type CreditClient = PrismaClient | Prisma.TransactionClient;

/**
 * Auto-generate CreditV2 records for a contribution based on its type.
 * Weight is split equally across the dimensions a single contribution earns.
 * Pass the same transaction client used to create the contribution so the
 * credit records are written atomically with it.
 */
export async function generateCredits(
  contribution: Pick<Contribution, "id" | "authorId" | "threadId" | "type">,
  client: CreditClient
): Promise<CreditV2[]> {
  const creditTypes = CREDIT_TYPE_MAP[contribution.type] ?? ["idea"];
  const weight = 1.0 / creditTypes.length;

  return Promise.all(
    creditTypes.map((creditType) => {
      const timestamp = new Date();
      return client.creditV2.create({
        data: {
          contributorId: contribution.authorId,
          threadId: contribution.threadId,
          contributionId: contribution.id,
          creditType,
          weight,
          hash: generateCreditHash(
            contribution.authorId,
            creditType,
            contribution.id,
            timestamp
          ),
          timestamp,
          version: 1,
        },
      });
    })
  );
}

/**
 * Credit timestamp (Web Prototype §3B): the moment credit priority is
 * established. A contribution only holds priority once it has been made public;
 * private/shared/sealed contributions return null (no claimable priority).
 */
export function getCreditTimestamp(
  contribution: Pick<Contribution, "publishedAt">
): Date | null {
  return contribution.publishedAt ?? null;
}

/**
 * Priority comparison for two contributions — earlier publish wins. Unpublished
 * contributions have no priority and sort last. Suitable as an Array.sort
 * comparator over contributions competing for the same idea.
 */
export function comparePriority(
  a: Pick<Contribution, "publishedAt">,
  b: Pick<Contribution, "publishedAt">
): number {
  const tsA = getCreditTimestamp(a);
  const tsB = getCreditTimestamp(b);
  if (tsA === null && tsB === null) return 0;
  if (tsA === null) return 1; // a is unpublished → sorts after b
  if (tsB === null) return -1; // b is unpublished → sorts after a
  return tsA.getTime() - tsB.getTime(); // earlier publish first
}

/**
 * Aggregate a set of CreditV2 records into a per-dimension weighted summary.
 * Returns total weight per dimension plus an overall total — the shape used
 * by the credit portfolio dashboard and CRediT-style export.
 */
export function summarizeCredits(credits: Pick<CreditV2, "creditType" | "weight">[]) {
  const byDimension: Record<string, number> = {};
  let total = 0;
  for (const c of credits) {
    byDimension[c.creditType] = (byDimension[c.creditType] || 0) + c.weight;
    total += c.weight;
  }
  return { total, byDimension, count: credits.length };
}
