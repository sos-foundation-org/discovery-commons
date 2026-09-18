"use client";

// Last-resort boundary for errors in the root layout itself. It replaces the
// whole document, so it can't rely on providers or globals.css — keep it
// self-contained with inline styles. No LanguageProvider here either, so the
// saved locale is read straight from localStorage.

import { useEffect, useState } from "react";
import { t, SUPPORTED_LOCALES, type Locale } from "@/lib/i18n";

function readSavedLocale(): Locale {
  try {
    const stored = localStorage.getItem("dc-locale");
    if (stored && (SUPPORTED_LOCALES as readonly string[]).includes(stored)) {
      return stored as Locale;
    }
  } catch {
    // storage unavailable — fall through
  }
  return "en";
}

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [locale, setLocale] = useState<Locale>("en");
  useEffect(() => {
    setLocale(readSavedLocale());
  }, []);

  return (
    <html
      lang={locale === "zh-TW" ? "zh-Hant" : locale === "zh-CN" ? "zh-Hans" : "en"}
    >
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 16px",
          textAlign: "center",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <h1 style={{ fontSize: "2.25rem", fontWeight: 700, margin: 0 }}>
          {t("error.title", locale)}
        </h1>
        <p style={{ marginTop: 16, color: "#6b7280", maxWidth: 420 }}>
          {t("site.globalError.desc", locale)}
        </p>
        <div style={{ marginTop: 32, display: "flex", gap: 16 }}>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              padding: "8px 16px",
              borderRadius: 6,
              border: "none",
              background: "#111827",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            {t("error.retry", locale)}
          </button>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/"
            style={{
              padding: "8px 16px",
              borderRadius: 6,
              border: "1px solid #d1d5db",
              color: "inherit",
              textDecoration: "none",
            }}
          >
            {t("notFound.home", locale)}
          </a>
        </div>
      </body>
    </html>
  );
}
