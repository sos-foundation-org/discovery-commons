import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditDistribution } from "@/components/credit/CreditDistribution";
import { OrcidBadge } from "@/components/profile/OrcidBadge";
import { summarizeCredits } from "@/lib/credits";
import { TRUST_LEVEL_CONFIG, type TrustLevel } from "@/lib/types";
import { formatDate } from "@/lib/utils";

// Public profile (Web Prototype §9 /profile/[userId]). No auth required. Shows
// only public information: bio, trust level, 4-dimension credit summary, and
// the user's public threads + contributions.
export default async function PublicProfilePage({
  params,
}: {
  params: { userId: string };
}) {
  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: {
      id: true,
      displayName: true,
      name: true,
      image: true,
      bio: true,
      trustLevel: true,
      createdAt: true,
      orcidId: true,
      orcidVerified: true,
    },
  });

  if (!user) notFound();

  const [credits, publicThreads, publicContributions] = await Promise.all([
    prisma.creditV2.findMany({
      where: { contributorId: user.id },
      select: { creditType: true, weight: true },
    }),
    prisma.thread.findMany({
      where: { creatorId: user.id, visibility: "public", isArchived: false },
      select: { id: true, title: true, currentStage: true },
      orderBy: { updatedAt: "desc" },
      take: 20,
    }),
    prisma.contribution.findMany({
      where: {
        authorId: user.id,
        visibility: "public",
        thread: { visibility: "public" },
      },
      select: {
        id: true,
        type: true,
        createdAt: true,
        thread: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const summary = summarizeCredits(credits);
  const trustConfig =
    TRUST_LEVEL_CONFIG[(user.trustLevel as TrustLevel) || "new_member"];
  const displayName = user.displayName || user.name || "Anonymous researcher";

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        {user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.image}
            alt={displayName}
            className="h-16 w-16 rounded-full"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold">{displayName}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Badge>{trustConfig.label}</Badge>
            {user.orcidId && (
              <OrcidBadge orcidId={user.orcidId} verified={user.orcidVerified} />
            )}
            <span className="text-xs text-muted-foreground">
              Joined {formatDate(user.createdAt)}
            </span>
          </div>
        </div>
      </div>

      {user.bio && (
        <Card className="mb-6">
          <CardContent className="py-4 text-sm text-muted-foreground">
            {user.bio}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Credit Portfolio{" "}
              <span className="text-sm font-normal text-muted-foreground">
                ({summary.total.toFixed(2)} total)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CreditDistribution byDimension={summary.byDimension} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Public Threads</CardTitle>
          </CardHeader>
          <CardContent>
            {publicThreads.length === 0 ? (
              <p className="text-sm text-muted-foreground">No public threads.</p>
            ) : (
              <ul className="space-y-2">
                {publicThreads.map((t) => (
                  <li key={t.id}>
                    <Link
                      href={`/threads/${t.id}`}
                      className="text-sm text-primary hover:underline"
                    >
                      {t.title}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Recent Public Contributions</CardTitle>
        </CardHeader>
        <CardContent>
          {publicContributions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No public contributions yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {publicContributions.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <Link
                    href={`/threads/${c.thread.id}`}
                    className="text-primary hover:underline truncate"
                  >
                    <Badge variant="outline" className="mr-2">
                      {c.type}
                    </Badge>
                    {c.thread.title}
                  </Link>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatDate(c.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
