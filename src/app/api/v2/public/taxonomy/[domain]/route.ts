import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { jsonLd, corsPreflight } from "@/lib/public-api";

export function OPTIONS() {
  return corsPreflight();
}

// GET /api/v2/public/taxonomy/[domain] — list public (L3) threads tagged with a
// domain. domainTags is stored as a JSON array; SQLite has no JSON-array query
// operators, so we filter in application code.
export async function GET(
  _request: NextRequest,
  { params }: { params: { domain: string } }
) {
  const domain = decodeURIComponent(params.domain).toLowerCase();

  const threads = await prisma.thread.findMany({
    where: { visibility: "public", isArchived: false },
    select: {
      id: true,
      title: true,
      currentStage: true,
      verificationBadge: true,
      domainTags: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const matches = threads.filter((t) => {
    const tags = Array.isArray(t.domainTags) ? (t.domainTags as string[]) : [];
    return tags.some((tag) => tag.toLowerCase() === domain);
  });

  return jsonLd({
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    name: domain,
    inDefinedTermSet: "Discovery Commons domain taxonomy",
    numberOfItems: matches.length,
    itemListElement: matches.map((t) => ({
      "@type": "CreativeWork",
      identifier: t.id,
      name: t.title,
      creativeWorkStatus: t.currentStage,
      verificationStatus: t.verificationBadge,
      url: `/api/v2/public/threads/${t.id}/summary`,
    })),
  });
}
