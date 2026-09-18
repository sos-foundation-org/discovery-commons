"use client";

// Last-resort boundary for errors in the root layout itself. It replaces the
// whole document, so it can't rely on providers or globals.css — keep it
// self-contained with inline styles.
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
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
          Something went wrong
        </h1>
        <p style={{ marginTop: 16, color: "#6b7280", maxWidth: 420 }}>
          Discovery Commons hit an unexpected error. Please try again.
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
            Try again
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
            Back to Home
          </a>
        </div>
      </body>
    </html>
  );
}
