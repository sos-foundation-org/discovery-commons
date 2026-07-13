import Link from "next/link";

export const metadata = {
  title: "Terms of Service — Discovery Commons",
};

export default function TermsPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-10 prose prose-sm dark:prose-invert">
      <h1>Terms of Service</h1>
      <p className="text-muted-foreground">Effective date: July 2, 2026</p>
      <p className="text-muted-foreground">
        Discovery Commons is a non-commercial research prototype operated by the
        Sustainability of Sustainability Foundation, a 501(c)(3) public charity.
        By using it you agree to these terms.
      </p>

      <h2>Alpha status</h2>
      <p>
        This is an early prototype provided <strong>as-is</strong>, without
        warranties of any kind. Features may change or break, and data may be
        reset during the alpha period. Do not rely on it as your only record of
        important work.
      </p>

      <h2>Your content</h2>
      <p>
        You retain ownership of the content you post. By posting, you grant the
        Foundation a non-exclusive license to store and display that content in
        accordance with the visibility setting you choose for it. Publicly shared
        contributions are made available to the community under the{" "}
        <Link href="/legal/cla">Contributor License</Link>.
      </p>

      <h2>Priority hashes are evidence, not legal claims</h2>
      <p>
        Each contribution receives a SHA-256 hash and server timestamp. This
        provides <strong>evidence</strong> that specific content existed at a
        recorded time. It is <strong>not</strong> a legal patent-priority claim,
        a notarization, or a trusted third-party timestamp. For formal
        intellectual-property protection, consult a qualified attorney.
      </p>

      <h2>Acceptable use</h2>
      <p>
        You agree to follow the Community Covenant described on the{" "}
        <Link href="/about">About</Link> page: contribute in good faith, credit
        others, and do not post unlawful, harmful, or infringing material. We may
        remove content or suspend accounts that violate these terms.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, the Foundation is not liable for
        any indirect or consequential damages arising from use of this prototype,
        including loss of data or loss of priority.
      </p>

      <h2>Governing law &amp; changes</h2>
      <p>
        These terms are governed by the laws of the Commonwealth of Massachusetts,
        USA. We may update them; material changes will be noted on this page.
      </p>

      <p className="text-xs text-muted-foreground">
        See also our <Link href="/legal/privacy">Privacy Policy</Link>.
      </p>
    </div>
  );
}
