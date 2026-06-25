import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { summarizeCredits } from "@/lib/credits";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditDistribution } from "@/components/credit/CreditDistribution";
import { CreditTimeline } from "@/components/credit/CreditTimeline";
import { CreditExport } from "@/components/credit/CreditExport";
import { OrcidBadge } from "@/components/profile/OrcidBadge";

export const metadata = {
  title: "Credit Portfolio — Discovery Commons",
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
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Credit Portfolio</h1>
          <p className="text-sm text-muted-foreground">
            Your contributions across the nine credit dimensions.
          </p>
        </div>
        {user?.orcidId && (
          <OrcidBadge orcidId={user.orcidId} verified={user.orcidVerified} />
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Total Weight</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {summary.total.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              across {summary.count} credit records
            </p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Nine-Dimension Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <CreditDistribution byDimension={summary.byDimension} />
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Export</CardTitle>
          <CreditExport />
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Export your credit portfolio in a CRediT-compatible format for your CV
            or academic profile, or as JSON/CSV for your own analysis.
          </p>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Credit History</CardTitle>
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
