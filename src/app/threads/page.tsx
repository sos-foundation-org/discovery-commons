import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { timeAgo } from "@/lib/utils";
import {
  VISIBILITY_LABELS,
  STAGE_ORDER,
  type VisibilityLevel,
} from "@/lib/types";
import { ThreadFilters } from "@/components/thread/thread-filters";

export default async function ThreadsPage({
  searchParams,
}: {
  searchParams: {
    q?: string;
    stage?: string;
    domain?: string;
    visibility?: string;
  };
}) {
  const session = await getSession();

  const where: any = { isArchived: false };

  if (session?.user?.id) {
    where.OR = [
      { visibility: "public" },
      { creatorId: session.user.id },
      {
        visibility: "shared",
        creator: {
          trustedByMe: { some: { trustedUserId: session.user.id } },
        },
      },
    ];
  } else {
    where.visibility = "public";
  }

  const andConditions: any[] = [];

  if (searchParams.q) {
    andConditions.push({
      OR: [
        { title: { contains: searchParams.q } },
        { description: { contains: searchParams.q } },
        { domainTags: { string_contains: searchParams.q } },
      ],
    });
  }
  if (searchParams.stage) {
    andConditions.push({ currentStage: searchParams.stage });
  }
  if (searchParams.visibility) {
    andConditions.push({ visibility: searchParams.visibility });
  }
  if (searchParams.domain) {
    andConditions.push({ domainTags: { string_contains: searchParams.domain } });
  }

  if (andConditions.length > 0) {
    where.AND = andConditions;
  }

  // Collect all domain tags for the filter dropdown
  const allThreads = await prisma.thread
    .findMany({
      where: { isArchived: false },
      select: { domainTags: true },
    })
    .catch(() => []);

  const allDomains = Array.from(
    new Set(allThreads.flatMap((t) => t.domainTags as string[]))
  ).sort();

  const threads = await prisma.thread
    .findMany({
      where,
      include: {
        creator: {
          select: { id: true, displayName: true, name: true, image: true },
        },
        _count: { select: { contributions: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 50,
    })
    .catch(() => []);

  const hasFilters =
    !!searchParams.q ||
    !!searchParams.stage ||
    !!searchParams.visibility ||
    !!searchParams.domain;

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Discovery Threads</h1>
          <p className="text-muted-foreground mt-1">
            Explore ongoing lines of inquiry
          </p>
        </div>
        <Link href="/threads/new">
          <Button>New Thread</Button>
        </Link>
      </div>

      {/* Search & Filters */}
      <ThreadFilters
        currentQ={searchParams.q}
        currentStage={searchParams.stage}
        currentVisibility={searchParams.visibility}
        currentDomain={searchParams.domain}
        allDomains={allDomains}
      />

      {/* Active filter chips */}
      {hasFilters && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="text-xs text-muted-foreground">Filters:</span>
          {searchParams.q && (
            <Badge variant="secondary" className="text-xs">
              Search: &quot;{searchParams.q}&quot;
            </Badge>
          )}
          {searchParams.stage && (
            <Badge variant="secondary" className="text-xs">
              Stage: {searchParams.stage}
            </Badge>
          )}
          {searchParams.visibility && (
            <Badge variant="secondary" className="text-xs">
              Visibility:{" "}
              {VISIBILITY_LABELS[searchParams.visibility as VisibilityLevel] ||
                searchParams.visibility}
            </Badge>
          )}
          {searchParams.domain && (
            <Badge variant="secondary" className="text-xs">
              Domain: {searchParams.domain}
            </Badge>
          )}
          <Link href="/threads" className="text-xs text-primary hover:underline">
            Clear all
          </Link>
        </div>
      )}

      {/* Results count */}
      <p className="text-sm text-muted-foreground mb-4">
        {threads.length} thread{threads.length !== 1 ? "s" : ""} found
      </p>

      {/* Thread list */}
      <div className="space-y-4">
        {threads.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">
                {hasFilters
                  ? "No threads match your filters."
                  : "No threads found. Be the first to start a discussion!"}
              </p>
              {hasFilters ? (
                <Link href="/threads">
                  <Button variant="outline">Clear Filters</Button>
                </Link>
              ) : (
                <Link href="/threads/new">
                  <Button>Start a Thread</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          threads.map((thread) => (
            <Link key={thread.id} href={`/threads/${thread.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer mb-4">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{thread.title}</CardTitle>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Badge variant="secondary">{thread.currentStage}</Badge>
                      <Badge variant="outline">
                        {VISIBILITY_LABELS[thread.visibility as VisibilityLevel]}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {thread.description}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>
                      by {thread.creator.displayName || thread.creator.name}
                    </span>
                    <span>
                      {thread._count.contributions} contribution
                      {thread._count.contributions !== 1 ? "s" : ""}
                    </span>
                    <span>{timeAgo(thread.updatedAt)}</span>
                    <div className="flex gap-1">
                      {(thread.domainTags as string[]).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
