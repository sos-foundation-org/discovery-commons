import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — Discovery Commons",
};

export default function PrivacyPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-10 prose prose-sm dark:prose-invert">
      <h1>Privacy Policy</h1>
      <p className="text-muted-foreground">Effective date: July 2, 2026</p>
      <p className="text-muted-foreground">
        Discovery Commons is a non-commercial research prototype operated by the
        Sustainability of Sustainability Foundation, a 501(c)(3) public charity.
        This policy describes what we collect and why. It will be reviewed before
        any general-availability launch.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Account data</strong> — when you sign in with Google we receive
          your name, email address, and profile picture (basic OAuth scopes:{" "}
          <code>openid</code>, <code>email</code>, <code>profile</code>). We do
          not access your Google Drive, contacts, or any other data.
        </li>
        <li>
          <strong>Content you create</strong> — threads, contributions, comments,
          and the visibility/sharing settings you choose for each.
        </li>
        <li>
          <strong>Integrity metadata</strong> — a SHA-256 hash and server
          timestamp are recorded for every contribution (this is the core
          anti-scooping feature).
        </li>
      </ul>

      <h2>How we use it</h2>
      <ul>
        <li>To operate the platform and attribute your contributions to you.</li>
        <li>
          To enforce the visibility you choose (private, shared, public, or
          sealed) — see the <Link href="/about">visibility model</Link>.
        </li>
      </ul>
      <p>
        We do <strong>not</strong> sell your data, show ads, or run third-party
        advertising/analytics trackers.
      </p>

      <h2>Where it lives</h2>
      <p>
        Data is stored in Supabase (PostgreSQL), encrypted at rest and in transit.
        Authentication uses a session cookie only; we do not use tracking cookies.
      </p>

      <h2>Your choices</h2>
      <ul>
        <li>
          You control the visibility of everything you post. Note that once
          content is made public it may have been seen or copied, so visibility
          changes are not fully reversible.
        </li>
        <li>
          You may request access to, or deletion of, your account data by
          contacting us. Some contribution hashes/timestamps may be retained in
          anonymized form to preserve the integrity of the public record.
        </li>
      </ul>

      <h2>Contact</h2>
      <p>
        Sustainability of Sustainability Foundation (EIN 41-3097632,
        Massachusetts). Questions: reach out via the project&rsquo;s GitHub
        repository.
      </p>

      <p className="text-xs text-muted-foreground">
        This prototype is provided as-is for a limited alpha. See the{" "}
        <Link href="/legal/terms">Terms of Service</Link>.
      </p>
    </div>
  );
}
