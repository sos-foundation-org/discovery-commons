import Link from "next/link";
import {
  ArrowDown,
  Eye,
  Globe,
  Handshake,
  HelpCircle,
  Lock,
  Scale,
  ShieldCheck,
  Users,
} from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Disclosure } from "@/components/ui/disclosure";
import { ThreadRow } from "@/components/thread/thread-row";
import { T } from "@/components/t";

/** Four steps of "How Discovery Works": short visible line + folded detail. */
const HOW_STEPS = [
  {
    n: "01",
    Icon: HelpCircle,
    titleKey: "how.step1.title",
    shortKey: "how.step1.short",
    summaryKey: "how.step1.more",
    descKey: "how.step1.desc",
  },
  {
    n: "02",
    Icon: Users,
    titleKey: "how.step2.title",
    shortKey: "how.step2.short",
    summaryKey: "how.step2.more",
    descKey: "how.step2.desc",
  },
  {
    n: "03",
    Icon: Lock,
    titleKey: "how.step3.title",
    shortKey: "how.step3.short",
    summaryKey: "how.step3.more",
    descKey: "how.step3.desc",
  },
  {
    n: "04",
    Icon: Eye,
    titleKey: "how.step4.title",
    shortKey: "how.step4.short",
    summaryKey: "how.step4.more",
    descKey: "how.step4.desc",
  },
];

/**
 * "Why / what you get" — the old Features and Why blocks merged: each card keeps
 * the full text of both originals, folded into one disclosure.
 */
const VALUE_CARDS = [
  {
    Icon: ShieldCheck,
    titleKey: "why.priority.title",
    shortKey: "why.priority.short",
    summaryKey: "why.priority.more",
    details: [
      { labelKey: null as string | null, descKey: "why.priority.desc" },
      { labelKey: "feat.antiscooping.title", descKey: "feat.antiscooping.desc" },
    ],
  },
  {
    Icon: Scale,
    titleKey: "why.credit.title",
    shortKey: "why.credit.short",
    summaryKey: "why.credit.more",
    details: [
      { labelKey: null as string | null, descKey: "why.credit.desc" },
      { labelKey: "feat.structured.title", descKey: "feat.structured.desc" },
    ],
  },
  {
    Icon: Globe,
    titleKey: "why.open.title",
    shortKey: "why.open.short",
    summaryKey: "why.open.more",
    details: [
      { labelKey: "feat.visibility.title", descKey: "feat.visibility.desc" },
      { labelKey: "why.collab.title", descKey: "why.collab.desc" },
    ],
  },
];

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
      {/* Tighter vertical padding on phones — the desktop 96px + next
          section's 64px left a ~160px empty band under the stats on mobile. */}
      <section className="pt-16 pb-10 sm:py-24 px-4 relative overflow-hidden dc-hero dc-hero-image">
        <div
          className="dc-hero-scrim absolute inset-0 bg-gradient-to-b from-background/70 via-background/55 to-background/80"
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
          <p className="text-sm font-medium text-foreground/80 mb-4 max-w-2xl mx-auto">
            <T k="home.tagline" />
          </p>
          {/* Short version stays visible; the full paragraph is one click away. */}
          <p className="text-lg text-muted-foreground mb-4 max-w-2xl mx-auto">
            <T k="home.descriptionShort" />
          </p>
          <div className="mb-8 flex justify-center">
            <Disclosure
              className="max-w-xl text-left"
              summary={<T k="home.descriptionMore" />}
            >
              <p className="max-w-[65ch]">
                <T k="home.description" />
              </p>
            </Disclosure>
          </div>
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
              <div className="text-2xl font-bold tabular-nums">{stats[0]}</div>
              <div className="text-xs text-muted-foreground"><T k="home.threads" /></div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold tabular-nums">{stats[1]}</div>
              <div className="text-xs text-muted-foreground"><T k="home.contributions" /></div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold tabular-nums">{stats[2]}</div>
              <div className="text-xs text-muted-foreground"><T k="home.contributors" /></div>
            </div>
          </div>
        </div>
      </section>

      {/* Map of the Unknown — concept + the four-step flow */}
      <section className="py-16 sm:py-24 px-4 border-t">
        <div className="container mx-auto max-w-4xl">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">
                <T k="anti.title" />
              </h2>
              <p className="max-w-[65ch] leading-relaxed text-muted-foreground mb-6">
                <T k="anti.p1" />
              </p>
              <div className="space-y-3">
                <Disclosure summary={<T k="anti.mapSummary" />}>
                  <p className="max-w-[65ch]">
                    <T k="anti.p1More" />
                  </p>
                </Disclosure>
                <Disclosure summary={<T k="anti.p2Summary" />}>
                  <p className="max-w-[65ch]">
                    <T k="anti.p2" />
                  </p>
                </Disclosure>
              </div>
            </div>
            {/* Concept flow: Map the Unknown → … → Enable New Discoveries */}
            <div className="rounded-xl border border-border/60 bg-muted/40 p-6 flex items-center justify-center min-h-[240px]">
              <div className="w-full max-w-xs">
                <p className="mb-4 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <T k="map.flowLabel" />
                </p>
                <ol className="flex flex-col items-center">
                  {[1, 2, 3, 4].map((step) => (
                    <li key={step} className="flex w-full flex-col items-center">
                      <div className="flex w-full items-center gap-3 rounded-lg border border-border/60 bg-card px-4 py-2.5 text-sm font-medium">
                        <span className="shrink-0 text-xs font-semibold tabular-nums text-muted-foreground">
                          {step}
                        </span>
                        <T k={`map.flow.${step}`} />
                      </div>
                      {step < 4 && (
                        <ArrowDown
                          aria-hidden
                          strokeWidth={1.5}
                          className="my-1 h-4 w-4 text-muted-foreground"
                        />
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works — one scannable line per step, detail folded away */}
      <section id="how-it-works" className="py-16 sm:py-24 px-4 bg-muted/50">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-center mb-3">
            <T k="how.title" />
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            <T k="how.subtitle" />
          </p>
          <div className="grid md:grid-cols-4 gap-6">
            {HOW_STEPS.map(({ n, Icon, titleKey, shortKey, summaryKey, descKey }) => (
              <div
                key={n}
                className="flex h-full flex-col rounded-xl border border-border/60 bg-card p-6"
              >
                <div className="mb-4 flex items-center gap-3">
                  <span className="rounded-lg bg-muted p-2">
                    <Icon
                      aria-hidden
                      strokeWidth={1.5}
                      className="h-5 w-5 text-primary"
                    />
                  </span>
                  <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                    {n}
                  </span>
                </div>
                <h3 className="text-base font-semibold tracking-tight mb-2">
                  <T k={titleKey} />
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground mb-4">
                  <T k={shortKey} />
                </p>
                <div className="mt-auto">
                  <Disclosure summary={<T k={summaryKey} />}>
                    <p className="max-w-[65ch]">
                      <T k={descKey} />
                    </p>
                  </Disclosure>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Map of the Unknown — the old Features + Why blocks, merged */}
      <section className="py-16 sm:py-24 px-4">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-center mb-3">
            <T k="why.title" />
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            <T k="why.subtitle" />
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {VALUE_CARDS.map(({ Icon, titleKey, shortKey, summaryKey, details }) => (
              <div
                key={titleKey}
                className="flex h-full flex-col rounded-xl border border-border/60 bg-card p-6"
              >
                <span className="mb-4 w-fit rounded-lg bg-muted p-2">
                  <Icon
                    aria-hidden
                    strokeWidth={1.5}
                    className="h-6 w-6 text-primary"
                  />
                </span>
                <h3 className="text-lg font-semibold tracking-tight mb-2">
                  <T k={titleKey} />
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground mb-4">
                  <T k={shortKey} />
                </p>
                <div className="mt-auto">
                  <Disclosure summary={<T k={summaryKey} />}>
                    {details.map(({ labelKey, descKey }) => (
                      <div key={descKey}>
                        {labelKey && (
                          <p className="font-medium text-foreground">
                            <T k={labelKey} />
                          </p>
                        )}
                        <p className="max-w-[65ch]">
                          <T k={descKey} />
                        </p>
                      </div>
                    ))}
                  </Disclosure>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Active Threads */}
      {publicThreads.length > 0 && (
        <section className="py-16 sm:py-24 px-4 border-t">
          <div className="container mx-auto max-w-5xl">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-center mb-2">
              <T k="general.activeThreads" />
            </h2>
            <p className="text-center text-muted-foreground mb-8">
              <T k="general.seeThread" />
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

      {/* Community Covenant — one line here; the full nine points live on /about */}
      <section className="py-10 px-4 border-t bg-muted/50">
        <div className="container mx-auto flex max-w-3xl flex-col items-center justify-center gap-3 sm:flex-row">
          <Handshake
            aria-hidden
            strokeWidth={1.5}
            className="h-5 w-5 shrink-0 text-muted-foreground"
          />
          <p className="max-w-[65ch] text-center text-sm leading-relaxed text-muted-foreground sm:text-left">
            <T k="covenant.homeLine" />
          </p>
          <Link
            href="/about"
            className="shrink-0 text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            <T k="covenant.readAll" />
          </Link>
        </div>
      </section>

      {/* Final CTA */}
      {!session && (
        <section className="py-16 sm:py-24 px-4">
          <div className="container mx-auto max-w-3xl text-center">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">
              <T k="cta.title" />
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-[65ch] mx-auto">
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
