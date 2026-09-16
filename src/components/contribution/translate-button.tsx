"use client";

import { useState } from "react";
import { useI18n } from "@/components/language-provider";

/**
 * Facebook-style "Translate" button for user-generated content.
 * Calls /api/translate with the user's selected locale.
 * Shows translated text inline with a "Show original" toggle.
 */
export function TranslateButton({
  contributionId,
  originalContent,
  onTranslated,
}: {
  contributionId: string;
  originalContent: string;
  onTranslated?: (text: string) => void;
}) {
  const { locale, t } = useI18n();
  const [translation, setTranslation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [error, setError] = useState("");

  // Don't show the button if locale is English and content looks English,
  // or if content is very short
  if (originalContent.length < 20) return null;

  const handleTranslate = async () => {
    if (translation) {
      // Toggle between translated and original
      setShowOriginal(!showOriginal);
      if (!showOriginal && onTranslated) onTranslated(translation);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contributionId,
          targetLocale: locale,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setTranslation(data.translation);
        if (onTranslated) onTranslated(data.translation);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Translation failed");
      }
    } catch {
      setError("Translation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={handleTranslate}
        disabled={loading}
        className="text-xs text-primary hover:underline transition-colors disabled:opacity-50"
      >
        {loading
          ? t("translate.translating")
          : translation && !showOriginal
            ? t("translate.showOriginal")
            : `🌐 ${t("translate.button")}`}
      </button>
      {error && (
        <span className="text-xs text-muted-foreground ml-2">{error}</span>
      )}
    </div>
  );
}
