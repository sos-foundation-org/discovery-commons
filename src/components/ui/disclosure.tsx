import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Progressive disclosure: a short, scannable summary with the full detail one
 * click away. Built on native <details>, so it works without client JS and is
 * keyboard/screen-reader accessible by default (Enter/Space toggles, state is
 * announced). Use it to shorten a page without dropping the substance.
 */
export function Disclosure({
  summary,
  children,
  defaultOpen = false,
  className = "",
}: {
  /** The visible one-liner. Keep it short enough to scan. */
  summary: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
}) {
  return (
    <details open={defaultOpen} className={`group ${className}`}>
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-md text-sm font-medium text-foreground marker:content-none hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 [&::-webkit-details-marker]:hidden">
        <ChevronDown
          aria-hidden
          strokeWidth={1.5}
          className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none"
        />
        {summary}
      </summary>
      <div className="mt-2 space-y-3 pl-6 text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
    </details>
  );
}
