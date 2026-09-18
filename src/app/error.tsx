"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/language-provider";

// Route-level error boundary — renders inside the root layout (navbar/footer
// stay visible). Styled to match not-found.tsx.
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useI18n();
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-5xl font-bold tracking-tight">{t("error.title")}</h1>
      <p className="mt-4 max-w-md text-muted-foreground">
        {t("error.desc")}
      </p>
      <div className="mt-8 flex gap-4">
        <Button onClick={() => reset()}>{t("error.retry")}</Button>
        <Link href="/">
          <Button variant="outline">{t("notFound.home")}</Button>
        </Link>
      </div>
    </div>
  );
}
