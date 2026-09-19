import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { T } from "@/components/t";
import { RichT } from "./rich-t";

export const metadata = {
  title: "About — Discovery Commons",
};

export default function AboutPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      {/* Hero */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          <T k="home.title" />
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          <T k="site.about.intro1" />
        </p>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mt-4">
          <T k="site.about.intro2" />
        </p>
      </div>

      {/* Placeholder image */}
      <div className="w-full h-48 rounded-lg bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-orange-500/20 flex items-center justify-center mb-12 border">
        <p className="text-sm text-muted-foreground">
          <T k="site.about.illus" />
        </p>
      </div>

      {/* Seven-stage contribution model */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">
          <T k="site.about.stagesTitle" />
        </h2>
        <p className="text-muted-foreground mb-6">
          <T k="site.about.stagesIntro" />
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              stage: "question",
              color: "bg-blue-100 dark:bg-blue-950",
              border: "border-blue-300 dark:border-blue-800",
              text: "text-blue-800 dark:text-blue-200",
            },
            {
              stage: "hypothesis",
              color: "bg-yellow-100 dark:bg-yellow-950",
              border: "border-yellow-300 dark:border-yellow-800",
              text: "text-yellow-800 dark:text-yellow-200",
            },
            {
              stage: "data",
              color: "bg-green-100 dark:bg-green-950",
              border: "border-green-300 dark:border-green-800",
              text: "text-green-800 dark:text-green-200",
            },
            {
              stage: "simulation",
              color: "bg-cyan-100 dark:bg-cyan-950",
              border: "border-cyan-300 dark:border-cyan-800",
              text: "text-cyan-800 dark:text-cyan-200",
            },
            {
              stage: "statistics",
              color: "bg-purple-100 dark:bg-purple-950",
              border: "border-purple-300 dark:border-purple-800",
              text: "text-purple-800 dark:text-purple-200",
            },
            {
              stage: "interpretation",
              color: "bg-amber-100 dark:bg-amber-950",
              border: "border-amber-300 dark:border-amber-800",
              text: "text-amber-800 dark:text-amber-200",
            },
            {
              stage: "insight",
              color: "bg-orange-100 dark:bg-orange-950",
              border: "border-orange-300 dark:border-orange-800",
              text: "text-orange-800 dark:text-orange-200",
            },
          ].map((item) => (
            <Card
              key={item.stage}
              className={`${item.color} ${item.border} border`}
            >
              <CardHeader className="pb-2">
                <CardTitle className={`text-lg ${item.text}`}>
                  <T k={`type.${item.stage}`} />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-sm ${item.text} dark:opacity-80`}>
                  <T k={`site.about.stage.${item.stage}`} />
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Placeholder image */}
      <div className="w-full h-36 rounded-lg bg-gradient-to-r from-green-500/20 to-teal-500/20 flex items-center justify-center mb-12 border">
        <p className="text-sm text-muted-foreground">
          <T k="site.about.diagram" />
        </p>
      </div>

      {/* Anti-scooping */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">
          <T k="site.about.priorityTitle" />
        </h2>
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <p className="text-muted-foreground mb-4">
              <T k="site.about.priorityP1" />
            </p>
            <p className="text-muted-foreground mb-4">
              <RichT
                k="site.about.priorityP2"
                parts={{
                  sealReveal: (
                    <strong>
                      <T k="site.about.sealReveal" />
                    </strong>
                  ),
                }}
              />
            </p>
            <div className="flex gap-2">
              <Badge>
                <T k="site.about.badgeAuto" />
              </Badge>
              <Badge variant="secondary">
                <T k="site.about.sealReveal" />
              </Badge>
              <Badge variant="outline">
                <T k="site.about.badgeTimestamped" />
              </Badge>
            </div>
          </div>
          <div className="rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center p-6 border">
            <div className="text-center">
              <p className="font-mono text-xs text-muted-foreground mb-2">
                <T k="site.about.shaExample" />
              </p>
              <p className="font-mono text-xs break-all">
                a7ffc6f8bf1ed766...
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                <T k="site.about.shaProven" />
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Graduated visibility */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">
          <T k="feat.visibility.title" />
        </h2>
        <p className="text-muted-foreground mb-6">
          <T k="site.about.visIntro" />
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          {[
            {
              level: "private",
              color: "bg-gray-100 dark:bg-gray-900",
            },
            {
              level: "shared",
              color: "bg-blue-50 dark:bg-blue-950",
            },
            {
              level: "public",
              color: "bg-orange-50 dark:bg-orange-950",
            },
          ].map((v, i, arr) => (
            <div
              key={v.level}
              className={`flex-1 rounded-lg p-4 ${v.color} border text-center`}
            >
              <p className="font-medium text-sm">
                <T k={`vis.${v.level}`} />
              </p>
              <p className="text-xs text-muted-foreground">
                <T k={`site.about.visDesc.${v.level}`} />
              </p>
              {i < arr.length - 1 && (
                <p className="text-muted-foreground mt-2 hidden sm:block">
                  &rarr;
                </p>
              )}
            </div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground mt-4">
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
      </section>

      {/* Credit timestamps: publishing establishes priority */}
      <section id="credit-timestamps" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-bold mb-6">
          <T k="site.about.creditTitle" />
        </h2>
        <p className="text-muted-foreground mb-6">
          <RichT
            k="site.about.creditIntro"
            parts={{
              public: (
                <strong>
                  <T k="site.about.publicWord" />
                </strong>
              ),
            }}
          />
        </p>
        <div className="grid sm:grid-cols-2 gap-6">
          <Card className="border-amber-300 dark:border-amber-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">
                <T k="site.about.sealCardTitle" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
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
            </CardContent>
          </Card>
          <Card className="border-green-300 dark:border-green-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">
                <T k="site.about.publishCardTitle" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
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
            </CardContent>
          </Card>
        </div>
        <p className="text-sm text-muted-foreground mt-4">
          <RichT
            k="site.about.path"
            parts={{
              seal: (
                <strong>
                  <T k="site.about.sealWord" />
                </strong>
              ),
              publish: (
                <strong>
                  <T k="site.about.publishWord" />
                </strong>
              ),
            }}
          />
        </p>
      </section>

      {/* Community Covenant */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">
          <T k="covenant.title" />
        </h2>
        <p className="text-muted-foreground mb-6">
          <T k="site.about.covenantIntro" />
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <Card key={n}>
              <CardContent className="pt-4">
                <h3 className="font-semibold text-sm mb-1">
                  <T k={`site.about.cov.${n}.title`} />
                </h3>
                <p className="text-xs text-muted-foreground">
                  <T k={`site.about.cov.${n}.desc`} />
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Placeholder image */}
      <div className="w-full h-36 rounded-lg bg-gradient-to-r from-indigo-500/20 to-pink-500/20 flex items-center justify-center mb-12 border">
        <p className="text-sm text-muted-foreground">
          <T k="site.about.photo" />
        </p>
      </div>

      {/* CTA */}
      <section className="text-center py-8">
        <h2 className="text-2xl font-bold mb-4">
          <T k="site.about.ctaTitle" />
        </h2>
        <p className="text-muted-foreground mb-6">
          <T k="site.about.ctaDesc" />
        </p>
        <div className="flex gap-4 justify-center">
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
