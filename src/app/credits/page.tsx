import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { summarizeCredits } from "@/lib/credits";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditDistribution } from "@/components/credit/CreditDistribution";
import { CreditTimeline } from "@/components/credit/CreditTimeline";
import { CreditExport } from "@/components/credit/CreditExport";
import { OrcidBadge } from "@/components/profile/OrcidBadge";
import { T } from "@/components/t";

export const metadata = {
  title: "Credit Portfolio — Map of the Unknown",
};

export default async function CreditsPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/auth/signin");

  const [user, credits] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { displayName: true, name: true, orcidId: true, orcidVerified: true },
    }),
    prisma.creditV2.findMany({
      where: { contributorId: session.user.id },
      include: { thread: { select: { id: true, title: true } } },
      orderBy: { timestamp: "desc" },
    }),
  ]);

  const summary = summarizeCredits(credits);

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-4 rounded-md bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 p-3 text-sm text-amber-800 dark:text-amber-200">
        This credit view uses the legacy system and will be consolidated into your profile page in a future update.
      </div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold"><T k="account.credits.title" /></h1>
          <p className="text-sm text-muted-foreground">
            <T k="account.credits.subtitle" />
          </p>
        </div>
        {user?.orcidId && (
          <OrcidBadge orcidId={user.orcidId} verified={user.orcidVerified} />
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base"><T k="account.credits.totalWeight" /></CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {summary.total.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              <T k="account.credits.acrossRecords" vars={{ n: summary.count }} />
            </p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base"><T k="account.credits.distribution" /></CardTitle>
          </CardHeader>
          <CardContent>
            <CreditDistribution byDimension={summary.byDimension} />
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base"><T k="account.credits.export" /></CardTitle>
          <CreditExport />
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            <T k="account.credits.exportDesc" />
          </p>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base"><T k="account.credits.history" /></CardTitle>
        </CardHeader>
        <CardContent>
          <CreditTimeline
            entries={credits.slice(0, 50).map((c) => ({
              id: c.id,
              timestamp: c.timestamp,
              creditType: c.creditType,
              weight: c.weight,
              thread: c.thread,
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
