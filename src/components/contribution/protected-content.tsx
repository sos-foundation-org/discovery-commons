"use client";

import { useEffect, useRef } from "react";

/**
 * Wraps gated content with copy/select protection and access logging.
 * Not bulletproof (nothing client-side is), but raises the barrier
 * significantly over raw text.
 */
export function ProtectedContent({
  contributionId,
  children,
}: {
  contributionId: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const logged = useRef(false);

  // Log access on first render
  useEffect(() => {
    if (!logged.current) {
      logged.current = true;
      fetch("/api/content-access-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contributionId, action: "view" }),
      }).catch(() => {});
    }
  }, [contributionId]);

  const handleCopy = (e: React.ClipboardEvent) => {
    e.preventDefault();
    // Log the attempt
    fetch("/api/content-access-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contributionId, action: "copy_attempt" }),
    }).catch(() => {});
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  return (
    <div
      ref={ref}
      onCopy={handleCopy}
      onContextMenu={handleContextMenu}
      className="select-none"
      style={{ WebkitUserSelect: "none", userSelect: "none" }}
    >
      {children}
    </div>
  );
}
