"use client";

import Link from "next/link";
import { T } from "@/components/t";
import { useT } from "@/components/language-provider";

const ORG_URL = "https://sos-commons.vercel.app/";

export function Footer() {
  const t = useT();
  // "Operated by {org} — …": split so each language can place the link.
  const [operatedBefore, operatedAfter = ""] = t("site.footer.operatedBy").split("{org}");

  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="grid sm:grid-cols-3 gap-8">
          <div>
            <h3 className="font-semibold mb-3">Discovery Commons</h3>
            <p className="text-sm text-muted-foreground">
              <T k="footer.desc" />
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-3"><T k="footer.platform" /></h3>
            <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
              <Link href="/threads" className="hover:text-foreground transition-colors">
                <T k="home.browseThreads" />
              </Link>
              <Link href="/about" className="hover:text-foreground transition-colors">
                <T k="nav.about" />
              </Link>
              <Link href="/sealed" className="hover:text-foreground transition-colors">
                <T k="footer.sealIdeas" />
              </Link>
              <a
                href="https://forms.gle/g4suToFzzHDaVuUr6"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                <T k="footer.contact" />
              </a>
            </nav>
          </div>
          <div>
            <h3 className="font-semibold mb-3"><T k="footer.legal" /></h3>
            <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
              <Link href="/legal/terms" className="hover:text-foreground transition-colors">
                <T k="footer.terms" />
              </Link>
              <Link href="/legal/privacy" className="hover:text-foreground transition-colors">
                <T k="footer.privacy" />
              </Link>
              <Link href="/legal/cla" className="hover:text-foreground transition-colors">
                <T k="footer.cla" />
              </Link>
            </nav>
          </div>
        </div>
        <div className="mt-8 pt-4 border-t text-center text-xs text-muted-foreground">
          <div className="flex items-center justify-center gap-2">
            <a
              href="https://sos-commons.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Sustainability of Sustainability Foundation"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/SOS-LOGO_v2.svg"
                alt={t("site.footer.logoAlt")}
                className="h-7 w-auto"
              />
            </a>
            <p>
              {operatedBefore}
              <a
                href={ORG_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold underline hover:text-foreground"
              >
                Sustainability of Sustainability Foundation
              </a>
              {operatedAfter}
            </p>
          </div>
          <p className="mt-1">
            <T k="site.footer.hashNote" />
          </p>
        </div>
      </div>
    </footer>
  );
}
