"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  COMMENT_TYPES,
  COMMENT_TYPE_CONFIG,
  type CommentType,
} from "@/lib/types";
import { timeAgoL } from "@/lib/i18n";
import { useI18n } from "@/components/language-provider";

interface Comment {
  id: string;
  content: string;
  commentType: string;
  isAnonymous: boolean;
  createdAt: string;
  author: { id: string; displayName?: string; name?: string };
  children?: Comment[];
}

export function CommentSection({
  contributionId,
}: {
  contributionId: string;
}) {
  const { data: session } = useSession();
  const { t } = useI18n();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchComments = useCallback(async () => {
    setIsLoading(true);
    const res = await fetch(
      `/api/contributions/${contributionId}/comments`
    ).catch(() => null);
    if (res?.ok) setComments(await res.json());
    setIsLoading(false);
  }, [contributionId]);

  useEffect(() => {
    if (isOpen && comments.length === 0) fetchComments();
  }, [isOpen, comments.length, fetchComments]);

  return (
    <div className="mt-3 border-t pt-3">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {isOpen ? t("comments.hide") : t("comments.show")}
      </button>

      {isOpen && (
        <div className="mt-3 space-y-3">
          {isLoading ? (
            <p className="text-xs text-muted-foreground">{t("common.loading")}</p>
          ) : comments.length === 0 ? (
            <p className="text-xs text-muted-foreground">{t("comments.none")}</p>
          ) : (
            comments.map((c) => (
              <CommentItem key={c.id} comment={c} depth={0} />
            ))
          )}

          {session && (
            <CommentForm
              contributionId={contributionId}
              onSubmit={fetchComments}
            />
          )}
        </div>
      )}
    </div>
  );
}

function CommentItem({ comment, depth }: { comment: Comment; depth: number }) {
  const { t, locale } = useI18n();
  const config =
    COMMENT_TYPE_CONFIG[comment.commentType as CommentType] ??
    COMMENT_TYPE_CONFIG.endorsement;

  return (
    <div className={depth > 0 ? "ml-4 pl-3 border-l" : ""}>
      <div className="text-sm">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="outline" className={`text-xs ${config.color}`}>
            {t(
              `commentType.${
                comment.commentType in COMMENT_TYPE_CONFIG
                  ? comment.commentType
                  : "endorsement"
              }`
            )}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {comment.author.displayName || comment.author.name}
          </span>
          <span className="text-xs text-muted-foreground">
            {timeAgoL(comment.createdAt, locale)}
          </span>
        </div>
        <p className="text-sm">{comment.content}</p>
      </div>
      {comment.children?.map((child) => (
        <CommentItem key={child.id} comment={child} depth={depth + 1} />
      ))}
    </div>
  );
}

function CommentForm({
  contributionId,
  parentId,
  onSubmit,
}: {
  contributionId: string;
  parentId?: string;
  onSubmit: () => void;
}) {
  const [content, setContent] = useState("");
  const [commentType, setCommentType] = useState<CommentType>("endorsement");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { t, te } = useI18n();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch(
        `/api/contributions/${contributionId}/comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content, commentType, isAnonymous, parentId }),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to post comment");
        return;
      }

      setContent("");
      setIsAnonymous(false);
      onSubmit();
    } catch {
      setError("Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2 bg-muted/50 rounded-lg p-3">
      {error && (
        <p className="text-xs text-destructive" role="alert">{te(error)}</p>
      )}

      <div className="flex flex-wrap gap-1" role="group" aria-label={t("comments.typeLabel")}>
        {COMMENT_TYPES.map((ct) => {
          return (
            <button
              key={ct}
              type="button"
              aria-pressed={commentType === ct}
              onClick={() => setCommentType(ct)}
              className={`px-2 py-0.5 rounded text-xs border transition-colors ${
                commentType === ct
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border hover:bg-accent"
              }`}
            >
              {t(`commentType.${ct}`)}
            </button>
          );
        })}
      </div>

      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={t("comments.placeholder")}
        aria-label={t("comments.label")}
        rows={2}
        className="text-sm"
      />

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            className="rounded"
          />
          {t("comments.anonymous")}
        </label>
        <Button type="submit" size="sm" disabled={isSubmitting || !content.trim()}>
          {isSubmitting ? t("comments.posting") : t("comments.post")}
        </Button>
      </div>
    </form>
  );
}
