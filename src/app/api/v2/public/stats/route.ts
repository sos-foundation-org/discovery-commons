import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { jsonLd, corsPreflight } from "@/lib/public-api";

export function OPTIONS() {
  return corsPreflight();
}

// GET /api/v2/public/stats — platform-level statistics (public).
export async function GET(_request: NextRequest) {
  const [users, threads, publicThreads, contributions, replications] =
    await Promise.all([
      prisma.user.count(),
      prisma.thread.count(),
      prisma.thread.count({ where: { visibility: "L3" } }),
      prisma.contribution.count(),
      prisma.replication.count(),
    ]);

  return jsonLd({
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "Discovery Commons platform statistics",
    stats: {
      users,
      threads,
      publicThreads,
      contributions,
      replications,
    },
    generatedAt: new Date().toISOString(),
  });
}
