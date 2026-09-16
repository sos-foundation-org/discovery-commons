import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThreadRow } from "@/components/thread/thread-row";
import { T } from "@/components/t";

export default async function HomePage() {
  const session = await getSession();

  const publicThreads = await prisma.thread
    .findMany({
      where: { visibility: "public", isArchived: false },
      include: {
        creator: {
          select: { id: true, displayName: true, name: true, image: true },
        },
        _count: { select: { contributions: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
    })
    .catch(() => []);

  const stats = await Promise.all([
    prisma.thread.count().catch(() => 0),
    prisma.contribution.count().catch(() => 0),
    prisma.user.count().catch(() => 0),
  ]);

  return (
    <div className="flex flex-col">
      {/* Hero — photo at /public/images/hero.png layered under a theme scrim so
          text stays readable in both light and dark. Tune the scrim opacity if
          your image is very light/dark. */}
      <section className="py-24 px-4 relative overflow-hidden dc-hero dc-hero-image">
        <div
          className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/55 to-background/80"
          aria-hidden
        />
        <div className="container mx-auto max-w-4xl text-center relative">
          <Badge variant="secondary" className="mb-4">
            <T k="home.badge" />
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl mb-6">
            <T k="home.title" />
          </h1>
          <p className="text-xl text-muted-foreground mb-2 max-w-2xl mx-auto">
            <T k="home.subtitle" />
          </p>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            <T k="home.description" />
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            {session ? (
              <>
                <Link href="/threads">
                  <Button size="lg"><T k="home.browseThreads" /></Button>
                </Link>
                <Link href="/threads/new">
                  <Button size="lg" variant="outline">
                    <T k="home.startThread" />
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/auth/signin">
                  <Button size="lg"><T k="home.getStarted" /></Button>
                </Link>
                <a href="#how-it-works">
                  <Button size="lg" variant="outline">
                    <T k="home.howItWorks" />
                  </Button>
                </a>
              </>
            )}
          </div>

          {/* Stats */}
          <div className="flex justify-center gap-8 mt-12">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats[0]}</div>
              <div className="text-xs text-muted-foreground"><T k="home.threads" /></div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats[1]}</div>
              <div className="text-xs text-muted-foreground"><T k="home.contributions" /></div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats[2]}</div>
              <div className="text-xs text-muted-foreground"><T k="home.contributors" /></div>
            </div>
          </div>
        </div>
      </section>

      {/* Anti-Library Concept */}
      <section className="py-16 px-4 border-t">
        <div className="container mx-auto max-w-4xl">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-4">
                <T k="anti.title" />
              </h2>
              <p className="text-muted-foreground mb-4">
                <T k="anti.p1" />
              </p>
              <p className="text-muted-foreground">
                <T k="anti.p2" />
              </p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-orange-500/10 p-8 border flex items-center justify-center min-h-[240px]">
              <div className="text-center">
                <div className="text-5xl mb-3">?</div>
                <p className="text-sm text-muted-foreground">
                  Illustration: A vast library where the most
                  <br />
                  valuable shelf is the one labeled &ldquo;Unknown&rdquo;
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Step Guide */}
      <section id="how-it-works" className="py-16 px-4 bg-muted/50">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold text-center mb-4">
            <T k="how.title" />
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            <T k="how.subtitle" />
          </p>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: "1", titleKey: "how.step1.title", descKey: "how.step1.desc", color: "from-blue-500/20 to-blue-600/20" },
              { step: "2", titleKey: "how.step2.title", descKey: "how.step2.desc", color: "from-green-500/20 to-green-600/20" },
              { step: "3", titleKey: "how.step3.title", descKey: "how.step3.desc", color: "from-amber-500/20 to-amber-600/20" },
              { step: "4", titleKey: "how.step4.title", descKey: "how.step4.desc", color: "from-purple-500/20 to-purple-600/20" },
            ].map((item) => (
              <div key={item.step} className="relative">
                <div
                  className={`rounded-xl bg-gradient-to-br ${item.color} p-6 border h-full`}
                >
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold mb-3">
                    {item.step}
                  </div>
                  <h3 className="font-semibold mb-2"><T k={item.titleKey} /></h3>
                  <p className="text-sm text-muted-foreground"><T k={item.descKey} /></p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <div className="text-2xl font-mono text-primary mb-2">
                  Q &rarr; H &rarr; D/S &rarr; I
                </div>
                <CardTitle className="text-lg"><T k="feat.structured.title" /></CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  <T k="feat.structured.desc" />
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="text-2xl font-mono text-primary mb-2">
                  SHA-256
                </div>
                <CardTitle className="text-lg">
                  <T k="feat.antiscooping.title" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  <T k="feat.antiscooping.desc" />
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="text-2xl font-mono text-primary mb-2">
                  Private &rarr; Public
                </div>
                <CardTitle className="text-lg"><T k="feat.visibility.title" /></CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  <T k="feat.visibility.desc" />
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Why Discovery Commons — value props replacing placeholder testimonials */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold text-center mb-4">
            <T k="why.title" />
          </h2>
          <p className="text-center text-muted-foreground mb-10 max-w-2xl mx-auto">
            <T k="why.subtitle" />
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
              <CardContent className="pt-6">
                <div className="text-3xl mb-3">&#x1F512;</div>
                <h3 className="font-semibold mb-2"><T k="why.priority.title" /></h3>
                <p className="text-sm text-muted-foreground">
                  <T k="why.priority.desc" />
                </p>
              </CardContent>
            </Card>
            <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
              <CardContent className="pt-6">
                <div className="text-3xl mb-3">&#x1F91D;</div>
                <h3 className="font-semibold mb-2">
                  <T k="why.collab.title" />
                </h3>
                <p className="text-sm text-muted-foreground">
                  <T k="why.collab.desc" />
                </p>
              </CardContent>
            </Card>
            <Card className="bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800">
              <CardContent className="pt-6">
                <div className="text-3xl mb-3">&#x2696;</div>
                <h3 className="font-semibold mb-2"><T k="why.credit.title" /></h3>
                <p className="text-sm text-muted-foreground">
                  <T k="why.credit.desc" />
                </p>
              </CardContent>
            </Card>
          </div>
          {/* Live stats */}
          {(stats[0] > 0 || stats[1] > 0 || stats[2] > 0) && (
            <div className="flex justify-center gap-10 mt-10">
              <div className="text-center">
                <div className="text-3xl font-bold">{stats[0]}</div>
                <div className="text-xs text-muted-foreground">
                  Active Threads
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{stats[1]}</div>
                <div className="text-xs text-muted-foreground">
                  Contributions
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{stats[2]}</div>
                <div className="text-xs text-muted-foreground">
                  Contributors
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Active Threads */}
      {publicThreads.length > 0 && (
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-5xl">
            <h2 className="text-3xl font-bold text-center mb-2">
              <T k="general.activeThreads" />
            </h2>
            <p className="text-center text-muted-foreground mb-8">
              See what the community is exploring
            </p>
            <div className="space-y-3">
              {publicThreads.map((thread) => (
                <ThreadRow key={thread.id} thread={thread} />
              ))}
            </div>
            <div className="text-center mt-6">
              <Link href="/threads">
                <Button variant="outline"><T k="general.viewAll" /></Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Community Covenant */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold mb-2"><T k="covenant.title" /></h2>
          <p className="text-muted-foreground mb-8">
            <T k="covenant.subtitle" />
          </p>
          <div className="grid sm:grid-cols-2 gap-4 text-left">
            {[
              "covenant.1",
              "covenant.2",
              "covenant.3",
              "covenant.4",
              "covenant.5",
              "covenant.6",
            ].map((key) => (
              <div
                key={key}
                className="flex items-start gap-2 p-3 rounded-lg bg-background border"
              >
                <span className="text-primary mt-0.5 font-bold">
                  &#10003;
                </span>
                <span className="text-sm"><T k={key} /></span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      {!session && (
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold mb-4">
              <T k="cta.title" />
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              <T k="cta.desc" />
            </p>
            <Link href="/auth/signin">
              <Button size="lg"><T k="cta.button" /></Button>
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
