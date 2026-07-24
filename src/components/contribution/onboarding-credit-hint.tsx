"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Info, X } from "lucide-react";

const STORAGE_KEY = "dc_onboard_credit_ts";

// Layer-1 onboarding education (Web Prototype §3B.7): a one-time, dismissible
// hint shown near the contribution form the first time a signed-in author lands
// on a thread. Persisted in localStorage so it never nags after dismissal —
// deliberately lightweight (no user-metadata round-trip) for the prototype.
export function OnboardingCreditHint() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setShow(true);
    } catch {
      // localStorage unavailable (private mode, etc.) — just skip the hint.
    }
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="mb-3 flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm dark:border-blue-900 dark:bg-blue-950/50">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
      <p className="flex-1 text-blue-900 dark:text-blue-200">
        On Discovery Commons, your{" "}
        <span className="font-medium">credit timestamp</span> only takes effect
        when you publish a contribution — not when you create or seal it.{" "}
        <Link href="/about#credit-timestamps" className="underline">
          Learn more
        </Link>
      </p>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
