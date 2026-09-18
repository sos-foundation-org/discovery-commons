import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VISIBILITY_LABELS, type VisibilityLevel } from "@/lib/types";
import { ThreadFilters } from "@/components/thread/thread-filters";
import { ThreadRow } from "@/components/thread/thread-row";
import { T } from "@/components/t";

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
        collaborators: { some: { userId: session.user.id } },
      },
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

  // Fetch threads + collect domain tags in one pass (was two separate queries)
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

  // Extract unique domain tags from the fetched threads for the filter dropdown
  const allDomains = Array.from(
    new Set(threads.flatMap((t) => t.domainTags as string[]))
  ).sort();

  const hasFilters =
    !!searchParams.q ||
    !!searchParams.stage ||
    !!searchParams.visibility ||
    !!searchParams.domain;

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold"><T k="threads.title" /></h1>
          <p className="text-muted-foreground mt-1">
            <T k="threads.subtitle" />
          </p>
        </div>
        <Link href="/threads/new">
          <Button><T k="threads.new" /></Button>
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
          <span className="text-xs text-muted-foreground"><T k="threads.filters" />:</span>
          {searchParams.q && (
            <Badge variant="secondary" className="text-xs">
              <T k="common.search" />: &quot;{searchParams.q}&quot;
            </Badge>
          )}
          {searchParams.stage && (
            <Badge variant="secondary" className="text-xs">
              <T k="filters.stage" />: <T k={`type.${searchParams.stage}`} />
            </Badge>
          )}
          {searchParams.visibility && (
            <Badge variant="secondary" className="text-xs">
              <T k="filters.visibility" />:{" "}
              {VISIBILITY_LABELS[searchParams.visibility as VisibilityLevel] ? (
                <T k={`vis.${searchParams.visibility}`} />
              ) : (
                searchParams.visibility
              )}
            </Badge>
          )}
          {searchParams.domain && (
            <Badge variant="secondary" className="text-xs">
              <T k="filters.domain" />: {searchParams.domain}
            </Badge>
          )}
          <Link href="/threads" className="text-xs text-primary hover:underline">
            <T k="filters.clearAll" />
          </Link>
        </div>
      )}

      {/* Results count */}
      <p className="text-sm text-muted-foreground mb-4">
        <T
          k={threads.length === 1 ? "threads.countOne" : "threads.countMany"}
          vars={{ n: threads.length }}
        />
      </p>

      {/* Thread list */}
      <div className="space-y-3">
        {threads.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">
                {hasFilters
                  ? <T k="threads.noMatch" />
                  : <T k="threads.noThreads" />}
              </p>
              {hasFilters ? (
                <Link href="/threads">
                  <Button variant="outline"><T k="threads.clearFilters" /></Button>
                </Link>
              ) : (
                <Link href="/threads/new">
                  <Button><T k="home.startThread" /></Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          threads.map((thread) => <ThreadRow key={thread.id} thread={thread} />)
        )}
      </div>
    </div>
  );
}
