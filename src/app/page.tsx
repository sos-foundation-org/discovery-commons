import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThreadRow } from "@/components/thread/thread-row";

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
            Open research platform &mdash; all backgrounds welcome
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl mb-6">
            The Antilibrary of Science
          </h1>
          <p className="text-xl text-muted-foreground mb-2 max-w-2xl mx-auto">
            What you don&apos;t know matters more than what you do.
          </p>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Whether you&apos;re a field naturalist, a theoretical physicist, or
            a curious citizen &mdash; share your observations and ideas, build
            on others&apos; unknowns, and watch discoveries evolve
            transparently. Every insight is SHA-256 protected from the moment
            you type it.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            {session ? (
              <>
                <Link href="/threads">
                  <Button size="lg">Browse Threads</Button>
                </Link>
                <Link href="/threads/new">
                  <Button size="lg" variant="outline">
                    Start a Thread
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/auth/signin">
                  <Button size="lg">Get Started &mdash; Free</Button>
                </Link>
                <a href="#how-it-works">
                  <Button size="lg" variant="outline">
                    How It Works
                  </Button>
                </a>
              </>
            )}
          </div>

          {/* Stats */}
          <div className="flex justify-center gap-8 mt-12">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats[0]}</div>
              <div className="text-xs text-muted-foreground">Threads</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats[1]}</div>
              <div className="text-xs text-muted-foreground">Contributions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats[2]}</div>
              <div className="text-xs text-muted-foreground">Contributors</div>
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
                Science&apos;s greatest asset is what it hasn&apos;t figured out yet
              </h2>
              <p className="text-muted-foreground mb-4">
                Nassim Taleb&apos;s &ldquo;antilibrary&rdquo; is the collection of
                unread books &mdash; representing what we don&apos;t yet know. In
                science, the unasked questions and untested hypotheses are where
                breakthroughs hide.
              </p>
              <p className="text-muted-foreground">
                Discovery Commons is the first platform where a thoughtful
                question earns the same credit as a published result &mdash; and
                where a birdwatcher&apos;s field note can spark a collaboration
                with a university lab. Traditional citizen science asks
                volunteers to collect data. Here, your insights have their own
                value: they can seed academic partnerships, inspire new research
                directions, or even be licensed commercially. Every
                contribution is hashed, timestamped, and permanently attributed.
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
            How Discovery Works
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Four steps from curiosity to credited discovery
          </p>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                step: "1",
                title: "Ask a Question",
                desc: "Start a thread with an unusual question — whether it comes from a research lab, a forest trail, or your grandmother's bookshelf. The weirder the better.",
                color: "from-blue-500/20 to-blue-600/20",
              },
              {
                step: "2",
                title: "Build Together",
                desc: "Others add hypotheses, data, simulations, statistics, interpretations. Each step advances the thread and earns credit.",
                color: "from-green-500/20 to-green-600/20",
              },
              {
                step: "3",
                title: "Protect Priority",
                desc: "Every contribution gets a SHA-256 hash. Seal ideas you're not ready to share — reveal when ready.",
                color: "from-amber-500/20 to-amber-600/20",
              },
              {
                step: "4",
                title: "Graduate Visibility",
                desc: "Start private, share with your circle, open to community, or go fully public. You control the pace.",
                color: "from-purple-500/20 to-purple-600/20",
              },
            ].map((item) => (
              <div key={item.step} className="relative">
                <div
                  className={`rounded-xl bg-gradient-to-br ${item.color} p-6 border h-full`}
                >
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold mb-3">
                    {item.step}
                  </div>
                  <h3 className="font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
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
                <CardTitle className="text-lg">Structured Discovery</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Contributions follow a natural path: Question, Hypothesis,
                  Data &amp; Simulation (parallel), Statistics, Interpretation, Insight.
                  Every step is credited and timestamped.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="text-2xl font-mono text-primary mb-2">
                  SHA-256
                </div>
                <CardTitle className="text-lg">
                  Anti-Scooping Protection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Every contribution gets a SHA-256 hash + timestamp. &ldquo;Seal
                  Your Idea&rdquo; lets you prove priority without revealing
                  content.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="text-2xl font-mono text-primary mb-2">
                  Private &rarr; Public
                </div>
                <CardTitle className="text-lg">Graduated Visibility</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Start private, share with your trusted circle, or go fully
                  public — and seal ideas you&rsquo;re not ready to reveal. You
                  control who sees what, when.
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
            Why Discovery Commons?
          </h2>
          <p className="text-center text-muted-foreground mb-10 max-w-2xl mx-auto">
            Traditional science rewards only finished papers. We reward every
            step of the journey.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
              <CardContent className="pt-6">
                <div className="text-3xl mb-3">&#x1F512;</div>
                <h3 className="font-semibold mb-2">Priority Without Risk</h3>
                <p className="text-sm text-muted-foreground">
                  Seal your idea with SHA-256 before anyone sees it. When
                  you&apos;re ready, reveal the content &mdash; the timestamp
                  proves you had it first.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
              <CardContent className="pt-6">
                <div className="text-3xl mb-3">&#x1F91D;</div>
                <h3 className="font-semibold mb-2">
                  Cross-Boundary Collaboration
                </h3>
                <p className="text-sm text-muted-foreground">
                  A field naturalist&apos;s observation can spark a
                  collaboration with a university lab. No PhD required &mdash;
                  every background brings something new.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800">
              <CardContent className="pt-6">
                <div className="text-3xl mb-3">&#x2696;</div>
                <h3 className="font-semibold mb-2">Fair Credit, Always</h3>
                <p className="text-sm text-muted-foreground">
                  Every contribution is credited across nine dimensions &mdash;
                  idea, data, method, analysis, validation &mdash; not just
                  &ldquo;first author vs. last author.&rdquo;
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
              Active Threads
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
                <Button variant="outline">View All Threads</Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Community Covenant */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold mb-2">Community Covenant</h2>
          <p className="text-muted-foreground mb-8">
            Every member agrees to these principles
          </p>
          <div className="grid sm:grid-cols-2 gap-4 text-left">
            {[
              "Credit where credit is due",
              "Hash before you share",
              "Good faith feedback",
              "Graduated openness",
              "No scooping",
              "Report violations",
            ].map((principle) => (
              <div
                key={principle}
                className="flex items-start gap-2 p-3 rounded-lg bg-background border"
              >
                <span className="text-primary mt-0.5 font-bold">
                  &#10003;
                </span>
                <span className="text-sm">{principle}</span>
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
              Your next great question is waiting
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join a community where curiosity is currency &mdash; no PhD
              required. Every observation, question, and insight is protected
              from the moment you type it.
            </p>
            <Link href="/auth/signin">
              <Button size="lg">Create Your Free Account</Button>
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
