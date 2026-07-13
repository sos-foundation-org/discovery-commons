import Link from "next/link";
import { AvatarBadge } from "@/components/ui/avatar-badge";
import { DisciplineBadge } from "@/components/thread/discipline-badge";
import { DISCIPLINE_CONFIG, type Discipline } from "@/lib/types";
import { timeAgo } from "@/lib/utils";

export interface ThreadRowData {
  id: string;
  title: string;
  description: string;
  discipline: string | null;
  currentStage: string;
  updatedAt: Date;
  domainTags: unknown;
  creator: {
    id: string;
    displayName: string | null;
    name: string | null;
    image?: string | null;
  };
  _count: { contributions: number };
}

// Shared forum-style thread row — used on the threads feed and the home page.
export function ThreadRow({ thread }: { thread: ThreadRowData }) {
  const disc = thread.discipline
    ? DISCIPLINE_CONFIG[thread.discipline as Discipline]
    : null;
  const author = thread.creator.displayName || thread.creator.name || "Anonymous";
  const tags = Array.isArray(thread.domainTags)
    ? (thread.domainTags as string[])
    : [];

  return (
    <Link href={`/threads/${thread.id}`} className="group block">
      <article className="relative overflow-hidden rounded-xl border bg-card py-4 pl-5 pr-5 transition-all hover:border-primary/40 hover:shadow-sm">
        <span
          className={`absolute inset-y-0 left-0 w-1 ${disc?.dot ?? "bg-border"}`}
          aria-hidden
        />
        <div className="flex items-start gap-3">
          <AvatarBadge
            name={author}
            seed={thread.creator.id}
            image={thread.creator.image}
            size="md"
            className="mt-0.5 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-semibold leading-snug tracking-tight transition-colors group-hover:text-primary">
                {thread.title}
              </h2>
              <DisciplineBadge
                discipline={thread.discipline}
                className="hidden shrink-0 sm:inline-flex"
              />
            </div>
            <p className="mt-1 line-clamp-2 text-[15px] leading-relaxed text-muted-foreground">
              {thread.description}
            </p>
            <div className="mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted-foreground">
              <span className="font-medium text-foreground/80">{author}</span>
              <span aria-hidden>·</span>
              <span className="capitalize">{thread.currentStage}</span>
              <span aria-hidden>·</span>
              <span>
                {thread._count.contributions} contribution
                {thread._count.contributions !== 1 ? "s" : ""}
              </span>
              <span aria-hidden>·</span>
              <span>{timeAgo(thread.updatedAt)}</span>
              {tags.slice(0, 3).map((tag) => (
                <span key={tag} className="rounded bg-muted px-1.5 py-0.5">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
