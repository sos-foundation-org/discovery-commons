"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VISIBILITY_LABELS, type VisibilityLevel } from "@/lib/types";

const DOMAIN_SUGGESTIONS = [
  "ecology",
  "acoustics",
  "neuroscience",
  "physics",
  "complex systems",
  "information theory",
  "methodology",
  "education",
  "cosmology",
  "philosophy",
  "biology",
  "mathematics",
];

export default function NewThreadPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<VisibilityLevel>("L0");
  const [domainTags, setDomainTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const toggleTag = (tag: string) => {
    setDomainTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
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
        body: JSON.stringify({ title, description, visibility, domainTags }),
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
      <h1 className="text-3xl font-bold mb-8">Start a New Thread</h1>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>What are you curious about?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Does soundscape complexity predict species richness?"
                maxLength={200}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                {title.length}/200 characters
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Description
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the line of inquiry. What's the question? Why does it matter? What do we already know?"
                rows={6}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Markdown supported
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Domain Tags
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {DOMAIN_SUGGESTIONS.map((tag) => (
                  <Badge
                    key={tag}
                    variant={domainTags.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={customTag}
                  onChange={(e) => setCustomTag(e.target.value)}
                  placeholder="Add custom tag..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCustomTag();
                    }
                  }}
                  className="max-w-xs"
                />
                <Button type="button" variant="outline" onClick={addCustomTag}>
                  Add
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Who can see this?
              </label>
              <div className="flex gap-2">
                {(["L0", "L1", "L2", "L3"] as VisibilityLevel[]).map((v) => (
                  <Button
                    key={v}
                    type="button"
                    variant={visibility === v ? "default" : "outline"}
                    size="sm"
                    onClick={() => setVisibility(v)}
                  >
                    {VISIBILITY_LABELS[v]}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                You can increase visibility later, but cannot decrease it.
              </p>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || !title || !description || domainTags.length === 0}
              className="w-full"
              size="lg"
            >
              {isSubmitting ? "Creating..." : "Create Thread"}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
