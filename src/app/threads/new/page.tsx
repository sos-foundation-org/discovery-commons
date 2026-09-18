"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/components/language-provider";
import {
  THREAD_VISIBILITY,
  getVisibleDisciplines,
  DISCIPLINE_CONFIG,
  type VisibilityLevel,
  type Discipline,
} from "@/lib/types";

const VISIBLE_DISCIPLINES = getVisibleDisciplines();

const DOMAIN_SUGGESTIONS = [
  "ecology",
  "acoustics",
  "physics",
  "complex systems",
  "information theory",
  "methodology",
  "cosmology",
  "philosophy",
  "biology",
  "mathematics",
  "geology",
  "astronomy",
  "taxonomy",
  "natural history",
  "literature",
  "archaeology",
];

export default function NewThreadPage() {
  const router = useRouter();
  const { t, te } = useI18n();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<VisibilityLevel>("private");
  const [discipline, setDiscipline] = useState<Discipline | "">("");
  const [domainTags, setDomainTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const toggleTag = (tag: string) => {
    setDomainTags((prev) =>
      prev.includes(tag) ? prev.filter((x) => x !== tag) : [...prev, tag]
    );
  };

  const addCustomTag = () => {
    const tag = customTag.trim().toLowerCase();
    if (tag && !domainTags.includes(tag)) {
      setDomainTags((prev) => [...prev, tag]);
      setCustomTag("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          visibility,
          domainTags,
          ...(discipline ? { discipline } : {}),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create thread");
        return;
      }

      const thread = await res.json();
      router.push(`/threads/${thread.id}`);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">{t("newThread.title")}</h1>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>{t("newThread.curious")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm" role="alert">
                {te(error)}
              </div>
            )}

            <div>
              <label htmlFor="thread-title" className="block text-sm font-medium mb-2">{t("newThread.titleLabel")}</label>
              <Input
                id="thread-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t("newThread.titlePlaceholder")}
                maxLength={200}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                {t("newThread.chars", { n: title.length })}
              </p>
            </div>

            <div>
              <label htmlFor="thread-description" className="block text-sm font-medium mb-2">
                {t("newThread.descLabel")}
              </label>
              <Textarea
                id="thread-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("newThread.descPlaceholder")}
                rows={6}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                {t("common.markdown")}
              </p>
            </div>

            <div>
              <p id="thread-discipline-label" className="block text-sm font-medium mb-2">
                {t("newThread.discipline")}
              </p>
              <div className="flex flex-wrap gap-2" role="group" aria-labelledby="thread-discipline-label">
                {VISIBLE_DISCIPLINES.map((d) => {
                  const cfg = DISCIPLINE_CONFIG[d];
                  const active = discipline === d;
                  return (
                    <button
                      key={d}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setDiscipline(active ? "" : d)}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all ${cfg.badge} ${
                        active
                          ? "ring-2 ring-ring ring-offset-1"
                          : "opacity-75 hover:opacity-100"
                      }`}
                    >
                      <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
                      {t(`disc.${d}`)}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {t("newThread.disciplineHint")}
              </p>
            </div>

            <div>
              <p id="thread-tags-label" className="block text-sm font-medium mb-2">
                {t("newThread.tags")}
              </p>
              <div className="flex flex-wrap gap-2 mb-2" role="group" aria-labelledby="thread-tags-label">
                {DOMAIN_SUGGESTIONS.map((tag) => (
                  <Badge
                    key={tag}
                    variant={domainTags.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer"
                    role="button"
                    tabIndex={0}
                    aria-pressed={domainTags.includes(tag)}
                    onClick={() => toggleTag(tag)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        toggleTag(tag);
                      }
                    }}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={customTag}
                  onChange={(e) => setCustomTag(e.target.value)}
                  placeholder={t("newThread.customTag")}
                  aria-label={t("newThread.customTag")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCustomTag();
                    }
                  }}
                  className="max-w-xs"
                />
                <Button type="button" variant="outline" onClick={addCustomTag}>
                  {t("common.add")}
                </Button>
              </div>
            </div>

            <div>
              <p id="thread-visibility-label" className="block text-sm font-medium mb-2">
                {t("newThread.who")}
              </p>
              <div className="flex gap-2" role="group" aria-labelledby="thread-visibility-label">
                {THREAD_VISIBILITY.map((v) => (
                  <Button
                    key={v}
                    type="button"
                    variant={visibility === v ? "default" : "outline"}
                    size="sm"
                    aria-pressed={visibility === v}
                    onClick={() => setVisibility(v)}
                  >
                    {t(`vis.${v}`)}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {t("newThread.visHint")}
              </p>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || !title || !description || domainTags.length === 0}
              className="w-full"
              size="lg"
            >
              {isSubmitting ? t("newThread.creating") : t("newThread.create")}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
