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

      <h2>Your intellectual property</h2>

      <h3>Ownership</h3>
      <p>
        Discovery Commons and the Sustainability of Sustainability Foundation
        do <strong>not</strong> claim ownership of your contributions. Your
        work remains yours.
      </p>

      <h3>What the platform does with your content</h3>
      <p>
        By posting on Discovery Commons, you grant the Foundation a limited,
        non-exclusive right to:
      </p>
      <ul>
        <li>
          <strong>Store, display, and index</strong> your content according to
          the visibility and license settings you choose — this is necessary
          for the platform to function (search, feeds, thread pages).
        </li>
        <li>
          <strong>Generate technical representations</strong> of your content
          (such as summaries, keywords, embeddings, and structured metadata)
          for the sole purpose of enabling platform features: search,
          discovery, recommendation, and classification. These representations
          are internal to the platform infrastructure and are not published or
          distributed as standalone works.
        </li>
        <li>
          <strong>Exercise the rights granted by the license you selected.</strong>{" "}
          For example, if you choose CC BY 4.0, the platform — like any member
          of the public — may use that content in ways the CC BY license
          permits (with attribution). If you choose All Rights Reserved, the
          platform does not gain any additional usage rights beyond storing,
          displaying, and generating the technical representations described
          above.
        </li>
      </ul>
      <p>
        The Foundation does <strong>not</strong> separately sell, sublicense,
        or commercially exploit your All Rights Reserved or NonCommercial
        content. Any future integration with affiliated infrastructure (such as
        research databases or API services) that goes beyond what your chosen
        license already permits will require your explicit, separate opt-in
        consent at that time.
      </p>

      <h2>Research contributions &amp; licensing</h2>
      <ul>
        <li>
          <strong>You keep ownership</strong> of and authorship credit for
          everything you post.
        </li>
        <li>
          Each contribution carries a <strong>license</strong> you choose at
          the time of posting. The default depends on your access mode:
        </li>
      </ul>

      <h3>License defaults by access mode</h3>
      <table>
        <thead>
          <tr>
            <th>Access mode</th>
            <th>Default license</th>
            <th>Can change?</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Free &amp; Open (public)</td>
            <td>
              <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">
                CC BY 4.0
              </a>
            </td>
            <td>You may choose any CC license at posting time</td>
          </tr>
          <tr>
            <td>Priced</td>
            <td>All Rights Reserved</td>
            <td>You may change to any CC license (opening up) at any time</td>
          </tr>
          <tr>
            <td>Collaboration</td>
            <td>DC Collaboration License</td>
            <td>Relicensed when collaboration completes</td>
          </tr>
          <tr>
            <td>Private / Shared / Sealed</td>
            <td>No license granted</td>
            <td>License applies only when content is visible to others</td>
          </tr>
        </tbody>
      </table>

      <h3>Irrevocability of Creative Commons licenses</h3>
      <p>
        All Creative Commons licenses are <strong>irrevocable</strong> per the
        CC legal code. Once you publish a contribution under CC BY 4.0, you
        cannot later change it to &ldquo;All Rights Reserved&rdquo; or add
        NonCommercial / NoDerivatives restrictions. You can, however, stop
        distributing the work — but anyone who already received it under the
        CC license retains their rights. The platform shows a confirmation
        dialog whenever you select an irrevocable license.
      </p>
      <p>
        You <strong>can</strong> always open up: All Rights Reserved &rarr; any
        CC license. You just cannot restrict after opening.
      </p>

      <h3>Available license types</h3>
      <ul>
        <li><strong>CC BY 4.0</strong> — Attribution. Anyone may use, even commercially.</li>
        <li><strong>CC BY-SA 4.0</strong> — Attribution-ShareAlike. Derivatives must use the same license.</li>
        <li><strong>CC BY-NC 4.0</strong> — Attribution-NonCommercial. No commercial use.</li>
        <li><strong>CC BY-NC-SA 4.0</strong> — NonCommercial + ShareAlike.</li>
        <li><strong>CC BY-ND 4.0</strong> — Attribution-NoDerivatives. No modifications.</li>
        <li><strong>CC BY-NC-ND 4.0</strong> — Most restrictive. Non-commercial, no modifications.</li>
        <li><strong>All Rights Reserved</strong> — Traditional copyright. Others need your explicit permission.</li>
        <li><strong>DC Collaboration License</strong> — Shared with accepted collaborators under the DC Collaboration Covenant.</li>
      </ul>

      <h2>Attribution &amp; credit</h2>
      <p>
        The platform records credit across multiple dimensions (idea, data,
        method, analysis, validation, and more). This attribution travels with
        your work; reuse under any CC license must preserve it.</p>

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
