import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonLd, corsPreflight, PUBLIC_CORS_HEADERS } from "@/lib/public-api";

export function OPTIONS() {
  return corsPreflight();
}

// GET /api/v2/public/doi/[doi]/metadata — Research Object metadata by DOI.
// The DOI path segment is URL-encoded (DOIs contain slashes).
export async function GET(
  _request: NextRequest,
  { params }: { params: { doi: string } }
) {
  const doi = decodeURIComponent(params.doi);

  const thread = await prisma.thread.findUnique({
    where: { doi },
    select: {
      id: true,
      title: true,
      description: true,
      visibility: true,
      currentStage: true,
      domainTags: true,
      verificationBadge: true,
      doi: true,
      createdAt: true,
      creator: { select: { displayName: true, name: true, orcidId: true } },
      researchObject: { select: { version: true, updatedAt: true } },
    },
  });

  if (!thread || thread.visibility !== "L3") {
    return NextResponse.json(
      { error: "No public research object for this DOI" },
      { status: 404, headers: PUBLIC_CORS_HEADERS }
    );
  }

  return jsonLd({
    "@context": "https://schema.org",
    "@type": "ScholarlyArticle",
    "@id": `https://doi.org/${thread.doi}`,
    identifier: { "@type": "PropertyValue", propertyID: "DOI", value: thread.doi },
    name: thread.title,
    abstract: thread.description,
    keywords: thread.domainTags,
    creativeWorkStatus: thread.currentStage,
    verificationStatus: thread.verificationBadge,
    datePublished: thread.createdAt.toISOString(),
    version: thread.researchObject?.version ?? 1,
    author: {
      "@type": "Person",
      name: thread.creator.displayName || thread.creator.name,
      ...(thread.creator.orcidId
        ? { identifier: `https://orcid.org/${thread.creator.orcidId}` }
        : {}),
    },
    publisher: { "@type": "Organization", name: "SOS Foundation — Discovery Commons" },
  });
}
