import { Fragment } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Disclosure } from "@/components/ui/disclosure";
import { T } from "@/components/t";
import { RichT } from "./rich-t";
import { AboutImage } from "./about-image";
import {
  BadgeCheck,
  BarChart3,
  Bot,
  BookOpen,
  ChevronRight,
  Clock,
  Cpu,
  Database,
  Eye,
  Flag,
  Globe,
  Hash,
  HelpCircle,
  Lightbulb,
  Lock,
  MessageSquare,
  RefreshCw,
  Scale,
  ShieldAlert,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import growingNetwork from "../../../public/images/growing-network.png";
import stageDiagram from "../../../public/images/question-hypothesis-data.png";
import shaExample from "../../../public/images/sha256-example.png";
import buildingTogether from "../../../public/images/building-an-idea-together.png";
import privateIcon from "../../../public/images/private.png";
import sharedIcon from "../../../public/images/shared.png";
import publicIcon from "../../../public/images/public.png";

export const metadata = {
  title: "About — Map of the Unknown",
};

/** Shared surface for the page's figures: one radius, one hairline border. */
const FIGURE = "overflow-hidden rounded-xl border border-border/60";
/** Body copy stays inside a comfortable measure. */
const MEASURE = "max-w-[65ch] text-base leading-relaxed text-muted-foreground";
const H2 = "text-2xl font-bold tracking-tight sm:text-3xl";
const SECTION = "mb-16 sm:mb-24";

/**
 * The seven contribution stages. The colour coding survives as a 2px left
 * border in each stage's hue; the surface itself stays neutral, and `more`
 * marks the stages whose detail is folded into a disclosure.
 */
const STAGES: {
  stage: string;
  icon: LucideIcon;
  accent: string;
  more?: "eg" | "pair";
}[] = [
  {
    stage: "question",
    icon: HelpCircle,
    accent: "border-l-blue-500",
    more: "eg",
  },
  {
    stage: "hypothesis",
    icon: Lightbulb,
    accent: "border-l-yellow-500",
    more: "eg",
  },
  {
    stage: "data",
    icon: Database,
    accent: "border-l-green-600",
    more: "pair",
  },
  {
    stage: "simulation",
    icon: Cpu,
    accent: "border-l-cyan-600",
    more: "pair",
  },
  { stage: "statistics", icon: BarChart3, accent: "border-l-purple-500" },
  { stage: "interpretation", icon: BookOpen, accent: "border-l-amber-500" },
  { stage: "insight", icon: Sparkles, accent: "border-l-orange-500" },
];

const VISIBILITY: { level: string; image: typeof privateIcon }[] = [
  { level: "private", image: privateIcon },
  { level: "shared", image: sharedIcon },
  { level: "public", image: publicIcon },
];

/** Covenant items 1–9, in dictionary order. */
const COVENANT: LucideIcon[] = [
  BadgeCheck,
  Hash,
  MessageSquare,
  Eye,
  ShieldAlert,
  Flag,
  Scale,
  RefreshCw,
  Bot,
];

export default function AboutPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-12 sm:py-16">
      {/* 1. Intro — the long "who can contribute" paragraph folds away. */}
      <header className={SECTION}>
        <h1 className="text-4xl font-bold tracking-tight">
          <T k="home.title" />
        </h1>
        <p className="mt-6 max-w-[65ch] text-lg leading-relaxed text-muted-foreground">
          <T k="site.about.intro1" />
        </p>
        <div className="mt-6 max-w-[65ch]">
          <Disclosure summary={<T k="site.about.intro2Disc" />}>
            <p className="leading-relaxed">
              <T k="site.about.intro2" />
            </p>
          </Disclosure>
        </div>
        <figure className={`mt-10 ${FIGURE}`}>
          <AboutImage src={growingNetwork} altKey="site.about.illus" priority />
        </figure>
      </header>

      {/* 2. How a contribution grows */}
      <section className={SECTION}>
        <h2 className={H2}>
          <T k="site.about.stagesTitle" />
        </h2>
        <p className={`mt-4 ${MEASURE}`}>
          <T k="site.about.stagesIntro" />
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {STAGES.map(({ stage, icon: Icon, accent, more }) => (
            <Card
              key={stage}
              className={`rounded-xl border-l-2 ${accent} transition-colors duration-200 hover:bg-muted/40 motion-reduce:transition-none`}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <Icon
                    aria-hidden
                    strokeWidth={1.5}
                    className="h-5 w-5 shrink-0 text-muted-foreground"
                  />
                  <h3 className="text-base font-semibold tracking-tight">
                    <T k={`type.${stage}`} />
                  </h3>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  <T k={`site.about.stage.${stage}`} />
                </p>
                {more && (
                  <div className="mt-3">
                    <Disclosure
                      summary={
                        <T
                          k={
                            more === "eg"
                              ? "site.about.stageEg"
                              : "site.about.stagePair"
                          }
                        />
                      }
                    >
                      <p className="leading-relaxed">
                        <T k={`site.about.stageMore.${stage}`} />
                      </p>
                    </Disclosure>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <figure className={`mt-8 ${FIGURE}`}>
          <AboutImage src={stageDiagram} altKey="site.about.diagram" />
        </figure>
      </section>

      {/* 3. Priority, sealing and credit — the former "Anti-scooping" and
          "Credit timestamps" sections merged; the id keeps /about#credit-timestamps
          deep links (used by the contribution UI) working. */}
      <section id="credit-timestamps" className={`${SECTION} scroll-mt-24`}>
        <h2 className={H2}>
          <T k="site.about.priorityTitle" />
        </h2>
        <p className={`mt-4 ${MEASURE}`}>
          <T k="site.about.priorityLead" />
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          <Badge className="gap-1.5">
            <Hash aria-hidden strokeWidth={1.5} className="h-3.5 w-3.5" />
            <T k="site.about.badgeAuto" />
          </Badge>
          <Badge variant="secondary" className="gap-1.5">
            <Lock aria-hidden strokeWidth={1.5} className="h-3.5 w-3.5" />
            <T k="site.about.sealReveal" />
          </Badge>
          <Badge variant="outline" className="gap-1.5">
            <Clock aria-hidden strokeWidth={1.5} className="h-3.5 w-3.5" />
            <T k="site.about.badgeTimestamped" />
          </Badge>
        </div>

        <figure className="mt-8 rounded-xl border border-border/60 bg-muted/40 p-4">
          <AboutImage
            src={shaExample}
            altKey="site.about.shaExample"
            sizes="(max-width: 640px) 88vw, 640px"
            className="mx-auto h-auto w-full max-w-xl rounded-lg"
          />
        </figure>

        <div className="mt-8 divide-y divide-border/60 rounded-xl border border-border/60">
          <div className="p-5">
            <Disclosure summary={<T k="site.about.hashDisc" />}>
              <p className="leading-relaxed">
                <T k="site.about.priorityP1" />
              </p>
            </Disclosure>
          </div>
          <div className="p-5">
            <Disclosure summary={<T k="site.about.sealDisc" />}>
              <p className="leading-relaxed">
                <RichT
                  k="site.about.priorityP2"
                  parts={{
                    sealReveal: (
                      <strong className="text-foreground">
                        <T k="site.about.sealReveal" />
                      </strong>
                    ),
                  }}
                />
              </p>
            </Disclosure>
          </div>
          <div className="p-5">
            {/* Open by default: /about#credit-timestamps is deep-linked from
                the contribution cards, so arrivals should land on the text. */}
            <Disclosure summary={<T k="site.about.creditTitle" />} defaultOpen>
              <p className="leading-relaxed">
                <RichT
                  k="site.about.creditIntro"
                  parts={{
                    public: (
                      <strong className="text-foreground">
                        <T k="site.about.publicWord" />
                      </strong>
                    ),
                  }}
                />
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-border/60 bg-muted/40 p-4">
                  <div className="flex items-center gap-2">
                    <Lock
                      aria-hidden
                      strokeWidth={1.5}
                      className="h-4 w-4 shrink-0 text-muted-foreground"
                    />
                    <h3 className="text-sm font-semibold tracking-tight text-foreground">
                      <T k="site.about.sealCardTitle" />
                    </h3>
                  </div>
                  <p className="mt-2 leading-relaxed">
                    <RichT
                      k="site.about.sealCardBody"
                      parts={{
                        quote: (
                          <em>
                            <T k="site.about.sealQuote" />
                          </em>
                        ),
                        not: (
                          <strong className="text-foreground">
                            <T k="site.about.not" />
                          </strong>
                        ),
                      }}
                    />
                  </p>
                </div>
                <div className="rounded-lg border border-border/60 bg-muted/40 p-4">
                  <div className="flex items-center gap-2">
                    <Globe
                      aria-hidden
                      strokeWidth={1.5}
                      className="h-4 w-4 shrink-0 text-muted-foreground"
                    />
                    <h3 className="text-sm font-semibold tracking-tight text-foreground">
                      <T k="site.about.publishCardTitle" />
                    </h3>
                  </div>
                  <p className="mt-2 leading-relaxed">
                    <RichT
                      k="site.about.publishCardBody"
                      parts={{
                        ts: (
                          <strong className="text-foreground">
                            <T k="publish.point2b" />
                          </strong>
                        ),
                      }}
                    />
                  </p>
                </div>
              </div>
            </Disclosure>
          </div>
          <div className="p-5">
            <Disclosure summary={<T k="site.about.pathDisc" />}>
              <p className="leading-relaxed">
                <RichT
                  k="site.about.path"
                  parts={{
                    seal: (
                      <strong className="text-foreground">
                        <T k="site.about.sealWord" />
                      </strong>
                    ),
                    publish: (
                      <strong className="text-foreground">
                        <T k="site.about.publishWord" />
                      </strong>
                    ),
                  }}
                />
              </p>
            </Disclosure>
          </div>
        </div>
      </section>

      {/* 4. Graduated visibility */}
      <section className={SECTION}>
        <h2 className={H2}>
          <T k="feat.visibility.title" />
        </h2>
        <p className={`mt-4 ${MEASURE}`}>
          <T k="site.about.visIntro" />
        </p>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-stretch">
          {VISIBILITY.map((v, i) => (
            <Fragment key={v.level}>
              <div className="flex-1 rounded-xl border border-border/60 bg-card p-6 text-center transition-colors duration-200 hover:bg-muted/40 motion-reduce:transition-none">
                {/* Decorative: the label right below names the level. */}
                <div className="mx-auto mb-4 h-20 w-20 overflow-hidden rounded-lg border border-border/60 bg-muted">
                  <AboutImage
                    src={v.image}
                    altKey=""
                    sizes="96px"
                    className="h-full w-full object-cover"
                  />
                </div>
                <p className="text-base font-semibold tracking-tight">
                  <T k={`vis.${v.level}`} />
                </p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  <T k={`site.about.visDesc.${v.level}`} />
                </p>
              </div>
              {i < VISIBILITY.length - 1 && (
                <div className="hidden items-center sm:flex">
                  <ChevronRight
                    aria-hidden
                    strokeWidth={1.5}
                    className="h-5 w-5 text-muted-foreground"
                  />
                </div>
              )}
            </Fragment>
          ))}
        </div>

        <div className="mt-6 rounded-xl border border-border/60 p-5">
          <Disclosure summary={<T k="site.about.sealedDisc" />}>
            <p className="leading-relaxed">
              <RichT
                k="site.about.visSealed"
                parts={{
                  sealed: (
                    <span className="font-medium text-foreground">
                      <T k="vis.sealed" />
                    </span>
                  ),
                }}
              />
            </p>
          </Disclosure>
        </div>
      </section>

      {/* 5. Community Covenant — nine titles stay visible, each description
          folds into its own disclosure. */}
      <section className={SECTION}>
        <h2 className={H2}>
          <T k="covenant.title" />
        </h2>
        <p className={`mt-4 ${MEASURE}`}>
          <T k="site.about.covenantIntro" />
        </p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {COVENANT.map((Icon, idx) => (
            <Card
              key={idx}
              className="rounded-xl transition-colors duration-200 hover:bg-muted/40 motion-reduce:transition-none"
            >
              <CardContent className="p-5">
                <Disclosure
                  summary={
                    <span className="flex items-center gap-2">
                      <Icon
                        aria-hidden
                        strokeWidth={1.5}
                        className="h-4 w-4 shrink-0 text-muted-foreground"
                      />
                      <T k={`site.about.cov.${idx + 1}.title`} />
                    </span>
                  }
                >
                  <p className="leading-relaxed">
                    <T k={`site.about.cov.${idx + 1}.desc`} />
                  </p>
                </Disclosure>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <figure className={`${SECTION} ${FIGURE}`}>
        <AboutImage src={buildingTogether} altKey="site.about.photo" />
      </figure>

      {/* 6. CTA */}
      <section className="pb-8 text-center">
        <h2 className={H2}>
          <T k="site.about.ctaTitle" />
        </h2>
        <p className="mx-auto mt-4 max-w-[55ch] text-base leading-relaxed text-muted-foreground">
          <T k="site.about.ctaDesc" />
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link href="/threads">
            <Button size="lg">
              <T k="home.browseThreads" />
            </Button>
          </Link>
          <Link href="/auth/signin">
            <Button size="lg" variant="outline">
              <T k="site.about.getStarted" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
