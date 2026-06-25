import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { jsonLd, corsPreflight } from "@/lib/public-api";

export function OPTIONS() {
  return corsPreflight();
}

// GET /api/v2/public/threads/search?q=...&limit=... — search public (L3) threads.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim();
  const limit = Math.min(Number(searchParams.get("limit")) || 20, 100);

  const threads = await prisma.thread.findMany({
    where: {
      visibility: "L3",
      isArchived: false,
      ...(q
        ? {
            OR: [
              { title: { contains: q } },
              { description: { contains: q } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      title: true,
      currentStage: true,
      verificationBadge: true,
      domainTags: true,
      doi: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return jsonLd({
    "@context": "https://schema.org",
    "@type": "ItemList",
    query: q,
    numberOfItems: threads.length,
    itemListElement: threads.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "CreativeWork",
        identifier: t.id,
        name: t.title,
        creativeWorkStatus: t.currentStage,
        verificationStatus: t.verificationBadge,
        keywords: t.domainTags,
        ...(t.doi ? { sameAs: `https://doi.org/${t.doi}` } : {}),
        dateCreated: t.createdAt.toISOString(),
        url: `/api/v2/public/threads/${t.id}/summary`,
      },
    })),
  });
}
