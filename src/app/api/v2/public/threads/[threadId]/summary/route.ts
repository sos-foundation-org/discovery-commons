import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { jsonLd, corsPreflight, PUBLIC_CORS_HEADERS } from "@/lib/public-api";
import { NextResponse } from "next/server";

export function OPTIONS() {
  return corsPreflight();
}

// GET /api/v2/public/threads/[threadId]/summary — public summary + metadata for
// an L3 thread. Returns 404 for non-public threads (never leaks L0–L2 content).
export async function GET(
  _request: NextRequest,
  { params }: { params: { threadId: string } }
) {
  const { threadId } = params;

  const thread = await prisma.thread.findUnique({
    where: { id: threadId },
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
      updatedAt: true,
      creator: { select: { displayName: true, name: true, orcidId: true } },
      _count: { select: { contributions: true } },
    },
  });

  if (!thread || thread.visibility !== "L3") {
    return NextResponse.json(
      { error: "Public thread not found" },
      { status: 404, headers: PUBLIC_CORS_HEADERS }
    );
  }

  return jsonLd({
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    identifier: thread.id,
    name: thread.title,
    abstract: thread.description,
    keywords: thread.domainTags,
    creativeWorkStatus: thread.currentStage,
    verificationStatus: thread.verificationBadge,
    ...(thread.doi ? { sameAs: `https://doi.org/${thread.doi}` } : {}),
    dateCreated: thread.createdAt.toISOString(),
    dateModified: thread.updatedAt.toISOString(),
    author: {
      "@type": "Person",
      name: thread.creator.displayName || thread.creator.name,
      ...(thread.creator.orcidId
        ? { identifier: `https://orcid.org/${thread.creator.orcidId}` }
        : {}),
    },
    contributionCount: thread._count.contributions,
  });
}
