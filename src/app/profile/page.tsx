import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TRUST_LEVEL_CONFIG,
  CREDIT_WEIGHTS,
  CONTRIBUTION_TYPE_CONFIG,
  type TrustLevel,
  type ContributionType,
} from "@/lib/types";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { AvatarBadge } from "@/components/ui/avatar-badge";
import { CreditDistribution } from "@/components/credit/CreditDistribution";
import { summarizeCredits } from "@/lib/credits";

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect("/auth/signin");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      _count: {
        select: {
          threads: true,
          contributions: true,
          comments: true,
          sealedRegistrations: true,
          credits: true,
        },
      },
    },
  });

  if (!user) redirect("/auth/signin");

  const trustConfig =
    TRUST_LEVEL_CONFIG[(user.trustLevel as TrustLevel) || "new_member"];

  const allCredits = await prisma.credit.findMany({
    where: { userId: user.id },
    include: {
      thread: { select: { id: true, title: true } },
      contribution: { select: { id: true, type: true } },
    },
    orderBy: { timestamp: "desc" },
  });

  // 5-dimension credit portfolio (CreditV2).
  const creditsV2 = await prisma.creditV2.findMany({
    where: { contributorId: user.id },
    select: { creditType: true, weight: true },
  });
  const creditSummary = summarizeCredits(creditsV2);

  // Contribution breakdown by type
  const typeCounts: Record<string, number> = {};
  for (const credit of allCredits) {
    const t = credit.creditType.replace("sealed_", "");
    typeCounts[t] = (typeCounts[t] || 0) + 1;
  }
  const maxCount = Math.max(1, ...Object.values(typeCounts));

  // Discovery Credit Score
  let creditScore = 0;
  for (const credit of allCredits) {
    const t = credit.creditType.replace("sealed_", "");
    creditScore += CREDIT_WEIGHTS[t] || 1;
  }

  // Unique threads contributed to
  const threadMap = new Map<string, string>();
  for (const credit of allCredits) {
    if (!threadMap.has(credit.threadId)) {
      threadMap.set(credit.threadId, credit.thread.title);
    }
  }
  const uniqueThreads = Array.from(threadMap.entries());

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8 flex items-center gap-4">
        <AvatarBadge
          name={user.displayName || user.name}
          seed={user.id}
          image={user.image}
          size="lg"
        />
        <div>
          <h1 className="text-3xl font-bold">
            {user.displayName || user.name || "Your Profile"}
          </h1>
          <Link
            href={`/profile/${user.id}`}
            className="text-sm text-primary hover:underline"
          >
            View public profile →
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* User Info */}
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="text-sm text-muted-foreground">Name: </span>
              <span>{user.displayName || user.name || "—"}</span>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Email: </span>
              <span>{user.email}</span>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">
                Trust Level:{" "}
              </span>
              <Badge>{trustConfig.label}</Badge>
              <p className="text-xs text-muted-foreground mt-1">
                {trustConfig.description}
              </p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Joined: </span>
              <span>{formatDate(user.createdAt)}</span>
            </div>
            {user.covenantAcceptedAt && (
              <div>
                <span className="text-sm text-muted-foreground">
                  Covenant accepted:{" "}
                </span>
                <span>{formatDate(user.covenantAcceptedAt)}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats + Credit Score */}
        <Card>
          <CardHeader>
            <CardTitle>Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <Stat label="Threads" value={user._count.threads} />
              <Stat label="Contributions" value={user._count.contributions} />
              <Stat label="Comments" value={user._count.comments} />
              <Stat label="Sealed Ideas" value={user._count.sealedRegistrations} />
            </div>
            <div className="p-4 rounded-lg bg-primary/10 text-center">
              <div className="text-3xl font-bold text-primary">
                {creditScore}
              </div>
              <div className="text-xs text-muted-foreground">
                Discovery Credit Score
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Weighted: Question(1) Hypothesis(2) Data(3) Simulation(3) Statistics(3) Interpretation(4) Insight(5)
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Credit portfolio — 5 colored dimensions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>
            Credit Portfolio{" "}
            <span className="text-sm font-normal text-muted-foreground">
              ({creditSummary.total.toFixed(2)} total across 5 dimensions)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CreditDistribution byDimension={creditSummary.byDimension} />
        </CardContent>
      </Card>

      {/* Contribution Breakdown Chart */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Contribution Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(typeCounts).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No contributions yet. Start contributing!
            </p>
          ) : (
            <div className="space-y-3">
              {Object.entries(typeCounts)
                .sort(([, a], [, b]) => b - a)
                .map(([type, count]) => {
                  const config =
                    CONTRIBUTION_TYPE_CONFIG[type as ContributionType];
                  const pct = Math.round((count / maxCount) * 100);
                  return (
                    <div key={type}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className={config?.color || ""}>
                          {config?.label || type}
                        </span>
                        <span className="text-muted-foreground">
                          {count} ({CREDIT_WEIGHTS[type] || 1} pts each)
                        </span>
                      </div>
                      <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Threads Contributed To */}
      {uniqueThreads.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Threads You&apos;ve Contributed To</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {uniqueThreads.map(([id, title]) => (
                <Link
                  key={id}
                  href={`/threads/${id}`}
                  className="block text-sm text-primary hover:underline"
                >
                  {title}
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Credit History */}
      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Credit History</CardTitle>
          <div className="flex gap-2">
            <Link href="/api/credits?format=csv">
              <Button variant="outline" size="sm">
                Export CSV
              </Button>
            </Link>
            <Link href="/api/credits">
              <Button variant="outline" size="sm">
                Export JSON
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {allCredits.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No credits yet. Start contributing!
            </p>
          ) : (
            <div className="space-y-2">
              {allCredits.slice(0, 20).map((credit) => (
                <div
                  key={credit.id}
                  className="flex items-center justify-between text-sm py-2 border-b last:border-0"
                >
                  <div>
                    <Badge variant="outline" className="mr-2">
                      {credit.creditType}
                    </Badge>
                    <Link
                      href={`/threads/${credit.threadId}`}
                      className="text-primary hover:underline"
                    >
                      {credit.thread.title}
                    </Link>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">
                    {formatDate(credit.timestamp)}
                  </span>
                </div>
              ))}
              {allCredits.length > 20 && (
                <p className="text-xs text-muted-foreground pt-2">
                  Showing 20 of {allCredits.length} credits. Export for full list.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center p-3 rounded-lg bg-muted">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
