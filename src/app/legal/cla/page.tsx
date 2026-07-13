import Link from "next/link";

export const metadata = {
  title: "Contributor License — Discovery Commons",
};

export default function ContributorLicensePage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-10 prose prose-sm dark:prose-invert">
      <h1>Contributor License</h1>
      <p className="text-muted-foreground">Effective date: July 2, 2026</p>
      <p className="text-muted-foreground">
        Discovery Commons is an open research commons. This page explains the
        licensing of both the research contributions posted on the platform and
        the platform&rsquo;s source code.
      </p>

      <h2>Research contributions</h2>
      <ul>
        <li>
          You keep ownership of and authorship credit for everything you post.
        </li>
        <li>
          When a contribution becomes <strong>public</strong>, you license it to
          the public under{" "}
          <a
            href="https://creativecommons.org/licenses/by/4.0/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Creative Commons Attribution 4.0 (CC BY 4.0)
          </a>{" "}
          — others may build on it, provided they credit you.
        </li>
        <li>
          <strong>Private, shared, and sealed</strong> contributions are{" "}
          <strong>not</strong> licensed to anyone. A sealed contribution exposes
          only its hash and timestamp; its content stays yours until you choose
          to reveal it.
        </li>
      </ul>

      <h2>Attribution &amp; credit</h2>
      <p>
        The platform records credit across four dimensions (idea, data, analysis,
        validation). This attribution travels with your work; reuse under CC BY
        4.0 must preserve it.
      </p>

      <h2>Source code</h2>
      <p>
        The Discovery Commons codebase is licensed under{" "}
        <strong>AGPL-3.0</strong>. Code contributions are accepted under the same
        license.
      </p>

      <p className="text-xs text-muted-foreground">
        This is a prototype policy and may be refined before general availability.
        See the <Link href="/legal/terms">Terms of Service</Link> and{" "}
        <Link href="/legal/privacy">Privacy Policy</Link>.
      </p>
    </div>
  );
}
