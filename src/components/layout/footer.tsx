import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="grid sm:grid-cols-3 gap-8">
          <div>
            <h3 className="font-semibold mb-3">Discovery Commons</h3>
            <p className="text-sm text-muted-foreground">
              The Antilibrary of Science — where great questions are as
              valuable as great answers.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-3">Platform</h3>
            <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
              <Link href="/threads" className="hover:text-foreground transition-colors">
                Browse Threads
              </Link>
              <Link href="/about" className="hover:text-foreground transition-colors">
                About
              </Link>
              <Link href="/sealed" className="hover:text-foreground transition-colors">
                Seal Your Ideas
              </Link>
            </nav>
          </div>
          <div>
            <h3 className="font-semibold mb-3">Legal</h3>
            <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
              <Link href="/legal/terms" className="hover:text-foreground transition-colors">
                Terms of Service
              </Link>
              <Link href="/legal/privacy" className="hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
              <Link href="/legal/cla" className="hover:text-foreground transition-colors">
                Contributor License
              </Link>
            </nav>
          </div>
        </div>
        <div className="mt-8 pt-4 border-t text-center text-xs text-muted-foreground">
          <p>
            Operated by{" "}
            <strong>Sustainability of Sustainability Foundation</strong> — a
            501(c)(3) public charity (EIN 41-3097632, Massachusetts)
          </p>
          <p className="mt-1">
            All contributions are timestamped and SHA-256 hashed for priority
            protection. Code licensed under AGPL-3.0.
          </p>
        </div>
      </div>
    </footer>
  );
}
