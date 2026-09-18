"use client";

// Renders a ```embed fenced block. Only whitelisted video hosts (YouTube,
// Vimeo) become an iframe; anything else renders as a plain link (never embed
// arbitrary origins — that would be an injection risk). The URL is plain text
// in the contribution, so it is hashed/versioned/reproducible like ```chart.

import { useI18n } from "@/components/language-provider";

// `title` is a dictionary key, translated at render time.
function toEmbed(url: string): { src: string; title: string } | null {
  try {
    const u = new URL(url.trim());
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtube.com" || host === "m.youtube.com") {
      const id = u.searchParams.get("v");
      if (id) return { src: `https://www.youtube.com/embed/${id}`, title: "contribution.youtubeVideo" };
      const m = u.pathname.match(/\/(embed|shorts)\/([\w-]+)/);
      if (m) return { src: `https://www.youtube.com/embed/${m[2]}`, title: "contribution.youtubeVideo" };
    }
    if (host === "youtu.be") {
      const id = u.pathname.slice(1);
      if (id) return { src: `https://www.youtube.com/embed/${id}`, title: "contribution.youtubeVideo" };
    }
    if (host === "vimeo.com") {
      const id = u.pathname.split("/").filter(Boolean)[0];
      if (id && /^\d+$/.test(id))
        return { src: `https://player.vimeo.com/video/${id}`, title: "contribution.vimeoVideo" };
    }
  } catch {
    /* not a URL */
  }
  return null;
}

export function EmbedBlock({ url }: { url: string }) {
  const { t } = useI18n();
  const first = url.trim().split("\n")[0].trim();
  const embed = toEmbed(first);

  if (!embed) {
    // Only http(s) links are clickable — never javascript:, data:, etc.
    if (!/^https?:\/\//i.test(first)) {
      return (
        <span className="my-3 inline-block break-all text-sm text-muted-foreground">
          {first}
        </span>
      );
    }
    return (
      <a
        href={first}
        target="_blank"
        rel="noopener noreferrer"
        className="my-3 inline-flex items-center gap-1 text-sm text-primary underline"
      >
        {first}
      </a>
    );
  }

  return (
    <figure className="my-3 overflow-hidden rounded-xl border bg-black">
      <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
        <iframe
          src={embed.src}
          title={t(embed.title)}
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      </div>
    </figure>
  );
}
