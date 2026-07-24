"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PublishButtonProps {
  contributionId: string;
  /** The contribution body — a short preview is shown in the confirm dialog. */
  content: string;
  /** Human-readable contribution type, e.g. "Hypothesis". */
  typeLabel: string;
  /** Title of the thread this contribution belongs to. */
  threadTitle: string;
}

const PREVIEW_CHARS = 200;

// Publishes a not-yet-public contribution (private|shared → public). Publishing
// records the credit timestamp and is irreversible, so it goes through an
// enhanced single-step confirmation with a content preview + an explicit
// acknowledgement checkbox (Web Prototype §3B.7). Deliberately NOT a
// type-to-confirm gate: publishing is an exposure, not a destructive action, and
// DC wants to encourage — not suppress — sharing.
export function PublishButton({
  contributionId,
  content,
  typeLabel,
  threadTitle,
}: PublishButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [ack, setAck] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const preview =
    content.length > PREVIEW_CHARS
      ? content.slice(0, PREVIEW_CHARS).trimEnd() + "…"
      : content;

  const close = () => {
    setOpen(false);
    setAck(false);
    setError("");
  };

  const handlePublish = async () => {
    setIsLoading(true);
    setError("");
    const res = await fetch(`/api/contributions/${contributionId}/publish`, {
      method: "POST",
    }).catch(() => null);

    if (res?.ok) {
      router.refresh();
      return;
    }
    const data = await res?.json().catch(() => null);
    setError(data?.error || "Failed to publish");
    setIsLoading(false);
  };

  return (
    <>
      <Button
        size="sm"
        variant="default"
        onClick={() => setOpen(true)}
        // Layer-3 contextual hint (Web Prototype §3B.7): just-in-time reminder.
        title="Publishing will record your credit timestamp"
        className="gap-1 bg-green-600 text-xs hover:bg-green-700"
      >
        <Globe className="h-3.5 w-3.5" />
        Publish
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="publish-dialog-title"
          onClick={close}
        >
          <div
            className="w-full max-w-lg rounded-lg border bg-background p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="publish-dialog-title" className="mb-4 text-lg font-semibold">
              Ready to publish?
            </h2>

            {/* Content preview — guards against publishing the wrong item. */}
            <div className="mb-4 rounded-md border bg-muted/40 p-3">
              <p className="mb-1 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{typeLabel}</span>
                {"  ·  in "}
                {threadTitle}
              </p>
              <p className="whitespace-pre-wrap text-sm text-foreground/90">
                {preview}
              </p>
            </div>

            <div className="mb-4 text-sm text-muted-foreground">
              <p className="mb-1 font-medium text-foreground">
                Once public:
              </p>
              <ul className="list-disc space-y-0.5 pl-5">
                <li>Anyone can see this contribution&apos;s full content.</li>
                <li>
                  This moment is recorded as your{" "}
                  <span className="font-medium text-foreground">
                    credit timestamp
                  </span>
                  .
                </li>
              </ul>
            </div>

            <label className="mb-5 flex cursor-pointer items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={ack}
                onChange={(e) => setAck(e.target.checked)}
                className="mt-0.5 h-4 w-4"
              />
              <span>I understand publishing cannot be undone.</span>
            </label>

            {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={close} disabled={isLoading}>
                Reconsider
              </Button>
              <Button
                onClick={handlePublish}
                disabled={!ack || isLoading}
                className="gap-1 bg-green-600 hover:bg-green-700"
              >
                <Globe className="h-4 w-4" />
                {isLoading ? "Publishing…" : "Publish contribution"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
