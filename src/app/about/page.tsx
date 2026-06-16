import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "About — Discovery Commons",
};

export default function AboutPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      {/* Hero */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          The Antilibrary of Science
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Nassim Taleb&apos;s &ldquo;antilibrary&rdquo; is the collection of
          unread books — what you don&apos;t yet know matters more than what you
          do. Discovery Commons is the antilibrary for science: a place where
          unanswered questions, half-formed hypotheses, and early observations
          are first-class contributions.
        </p>
      </div>

      {/* Placeholder image */}
      <div className="w-full h-48 rounded-lg bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-orange-500/20 flex items-center justify-center mb-12 border">
        <p className="text-sm text-muted-foreground">
          Illustration: A growing network of interconnected ideas
        </p>
      </div>

      {/* Seven-stage contribution model */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">
          How Discovery Works: Seven Stages
        </h2>
        <p className="text-muted-foreground mb-6">
          Traditional science values only final answers. We value the entire
          journey. Every contribution advances a thread through natural stages
          of the research process:
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              stage: "Question",
              color: "bg-blue-100 dark:bg-blue-950",
              border: "border-blue-300 dark:border-blue-800",
              text: "text-blue-800 dark:text-blue-200",
              description:
                'The research question or problem statement. "What if birdsong complexity correlates with local biodiversity information density?"',
            },
            {
              stage: "Hypothesis",
              color: "bg-yellow-100 dark:bg-yellow-950",
              border: "border-yellow-300 dark:border-yellow-800",
              text: "text-yellow-800 dark:text-yellow-200",
              description:
                'Proposed explanations or theories. "Soundscape complexity indexes ecosystem information content."',
            },
            {
              stage: "Data",
              color: "bg-green-100 dark:bg-green-950",
              border: "border-green-300 dark:border-green-800",
              text: "text-green-800 dark:text-green-200",
              description:
                'Raw data, measurements, observations, collected evidence. Parallel with Simulation — threads with both are strongest.',
            },
            {
              stage: "Simulation",
              color: "bg-cyan-100 dark:bg-cyan-950",
              border: "border-cyan-300 dark:border-cyan-800",
              text: "text-cyan-800 dark:text-cyan-200",
              description:
                "Computational models, agent-based simulations, Monte Carlo runs. Parallel with Data — having both is the gold standard.",
            },
            {
              stage: "Statistics",
              color: "bg-purple-100 dark:bg-purple-950",
              border: "border-purple-300 dark:border-purple-800",
              text: "text-purple-800 dark:text-purple-200",
              description:
                "Statistical analysis results, hypothesis tests, p-values, confidence intervals, effect sizes.",
            },
            {
              stage: "Interpretation",
              color: "bg-amber-100 dark:bg-amber-950",
              border: "border-amber-300 dark:border-amber-800",
              text: "text-amber-800 dark:text-amber-200",
              description:
                "What the data, statistics, or simulations mean — connecting empirical findings back to theory.",
            },
            {
              stage: "Insight",
              color: "bg-orange-100 dark:bg-orange-950",
              border: "border-orange-300 dark:border-orange-800",
              text: "text-orange-800 dark:text-orange-200",
              description:
                "Higher-level synthesis, cross-domain connections, breakthrough ideas. Every step is credited and hashed.",
            },
          ].map((item) => (
            <Card
              key={item.stage}
              className={`${item.color} ${item.border} border`}
            >
              <CardHeader className="pb-2">
                <CardTitle className={`text-lg ${item.text}`}>
                  {item.stage}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-sm ${item.text} opacity-80`}>
                  {item.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Placeholder image */}
      <div className="w-full h-36 rounded-lg bg-gradient-to-r from-green-500/20 to-teal-500/20 flex items-center justify-center mb-12 border">
        <p className="text-sm text-muted-foreground">
          Diagram: Question &rarr; Hypothesis &rarr; Data / Simulation &rarr;
          Statistics &rarr; Interpretation &rarr; Insight
        </p>
      </div>

      {/* Anti-scooping */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">
          Priority Protection: Hash Before You Share
        </h2>
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <p className="text-muted-foreground mb-4">
              Every contribution is automatically timestamped and hashed with
              SHA-256 the moment you submit it. This creates an immutable,
              cryptographic proof that you had the idea at that exact time.
            </p>
            <p className="text-muted-foreground mb-4">
              For ideas you&apos;re not ready to share, use{" "}
              <strong>Seal &amp; Reveal</strong>: submit a sealed contribution
              where only the hash is visible. When you&apos;re ready, unseal it
              — the timestamp proves you had the idea before anyone else saw it.
            </p>
            <div className="flex gap-2">
              <Badge>Automatic Hashing</Badge>
              <Badge variant="secondary">Seal &amp; Reveal</Badge>
              <Badge variant="outline">Timestamped</Badge>
            </div>
          </div>
          <div className="rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center p-6 border">
            <div className="text-center">
              <p className="font-mono text-xs text-muted-foreground mb-2">
                SHA-256 Example
              </p>
              <p className="font-mono text-xs break-all">
                a7ffc6f8bf1ed766...
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Your idea, proven at timestamp
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Graduated visibility */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Graduated Visibility</h2>
        <p className="text-muted-foreground mb-6">
          You control who sees your contributions. Visibility only goes up, never
          down — once you share more broadly, you can&apos;t take it back.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          {[
            {
              level: "L0",
              label: "Private",
              desc: "Only you can see it",
              color: "bg-gray-100 dark:bg-gray-900",
            },
            {
              level: "L1",
              label: "Inner Circle",
              desc: "Your trusted collaborators",
              color: "bg-blue-50 dark:bg-blue-950",
            },
            {
              level: "L2",
              label: "Community",
              desc: "All signed-in members",
              color: "bg-green-50 dark:bg-green-950",
            },
            {
              level: "L3",
              label: "Public",
              desc: "Anyone on the internet",
              color: "bg-orange-50 dark:bg-orange-950",
            },
          ].map((v, i) => (
            <div
              key={v.level}
              className={`flex-1 rounded-lg p-4 ${v.color} border text-center`}
            >
              <Badge variant="outline" className="mb-2">
                {v.level}
              </Badge>
              <p className="font-medium text-sm">{v.label}</p>
              <p className="text-xs text-muted-foreground">{v.desc}</p>
              {i < 3 && (
                <p className="text-muted-foreground mt-2 hidden sm:block">
                  &rarr;
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Community Covenant */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Community Covenant</h2>
        <p className="text-muted-foreground mb-6">
          Every member agrees to these principles when they join. This
          isn&apos;t a legal document — it&apos;s a shared commitment to how we
          work together.
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            {
              title: "Credit Where Credit Is Due",
              desc: "Every contribution is attributed and timestamped. Building on someone's work? Cite them.",
            },
            {
              title: "Hash Before You Share",
              desc: "Your SHA-256 hash is your proof of priority. The system generates it automatically.",
            },
            {
              title: "Good Faith Feedback",
              desc: "Critique ideas, not people. Method reviews and stat reviews strengthen the work.",
            },
            {
              title: "Graduated Openness",
              desc: "Start private, share when ready. Respect others' visibility choices.",
            },
            {
              title: "No Scooping",
              desc: "Using someone's sealed idea before they reveal it violates trust and community norms.",
            },
            {
              title: "Report Violations",
              desc: "If you see covenant violations, report them. The community depends on collective enforcement.",
            },
          ].map((principle) => (
            <Card key={principle.title}>
              <CardContent className="pt-4">
                <h3 className="font-semibold text-sm mb-1">
                  {principle.title}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {principle.desc}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Placeholder image */}
      <div className="w-full h-36 rounded-lg bg-gradient-to-r from-indigo-500/20 to-pink-500/20 flex items-center justify-center mb-12 border">
        <p className="text-sm text-muted-foreground">
          Photo: Diverse researchers collaborating around a shared whiteboard
        </p>
      </div>

      {/* CTA */}
      <section className="text-center py-8">
        <h2 className="text-2xl font-bold mb-4">Ready to Contribute?</h2>
        <p className="text-muted-foreground mb-6">
          Join a community where your questions matter as much as your answers.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/threads">
            <Button size="lg">Browse Threads</Button>
          </Link>
          <Link href="/auth/signin">
            <Button size="lg" variant="outline">
              Get Started
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
