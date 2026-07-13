# Discovery Commons

**The Antilibrary of Science** — an open, non-commercial research platform where a
thoughtful *question* earns the same credit as a published result. Every
contribution is SHA-256 hashed and timestamped for priority protection, and
authors control visibility per-contribution (private / shared / public / sealed).

🌐 **Live:** https://discovery-commons.vercel.app
🏛️ Operated by the Sustainability of Sustainability Foundation (501(c)(3)).
📄 Code: AGPL-3.0 · Public contributions: CC BY 4.0 (see [/legal/cla](https://discovery-commons.vercel.app/legal/cla)).

---

## What it is

Research happens as **Threads** (lines of inquiry, tagged by discipline). People
add typed **Contributions** that build a thread from a question toward insight:

```
Question → Hypothesis → Data / Simulation → Statistics → Interpretation → Insight
                         (+ Method, Replication as cross-cutting types)
```

Distinctive mechanics:
- **Per-contribution visibility** — `private` · `shared` (collaborators) · `public` · `sealed`.
- **Seal → Reveal** — hide content while publishing its SHA-256 hash + timestamp
  (anti-scooping); revealing re-verifies the hash proving the content is unchanged.
- **Credit** across dimensions (prototype: idea / data / method / analysis / validation).
- **Public verification** — anyone can check a hash at `/verify/[hash]`.
- **Reproducible media** — ` ```chart ` (SVG), ` ```embed ` (YouTube/Vimeo),
  Markdown images, and raw-data links — all stored as text (see
  [docs/media-and-data.md](docs/media-and-data.md)).

## Tech stack

| | |
|---|---|
| Framework | Next.js 14 (App Router) + TypeScript + Tailwind |
| Auth | NextAuth (Google OAuth, **JWT sessions**) |
| ORM / DB | Prisma · **SQLite locally**, **Supabase PostgreSQL in production** |
| Hosting | Vercel (Hobby) — auto-deploys from `main` |
| Cost | **$0** (Vercel + Supabase free tiers) |

## Quick start (local)

```bash
npm install
npm run db:seed        # SQLite (file:./dev.db) + demo data
npm run dev            # http://localhost:3000
```

Local dev uses **SQLite** and a **dev credentials login** (any email signs you in;
`admin@discoverycommons.org` is the seeded admin "Ping"). No Google keys needed
locally. See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md).

## Documentation

| Doc | For |
|---|---|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Data model, visibility/seal, credits, access control, auth, dual-DB |
| [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) | Local setup, commands, conventions, how to extend |
| [docs/USAGE.md](docs/USAGE.md) | End-user / alpha-tester guide |
| [docs/media-and-data.md](docs/media-and-data.md) | Images, video, charts, raw-data links |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Status + remaining phases and plans |
| [DEPLOY.md](DEPLOY.md) | Supabase + Google OAuth + Vercel deployment |
| [SECURITY_AUDIT.md](SECURITY_AUDIT.md) | Security review notes |

## Repository layout

```
src/
  app/            Next.js routes (pages under /, API under /api)
  components/     UI (ui/ thread/ contribution/ credit/ profile/ …)
  lib/            auth, db, hash, access-control, credits, types, validations
  prisma/         schema.prisma, seed.ts, triggers.sql (prod), dev.db (local)
scripts/          prisma-provider.mjs (SQLite⇄Postgres provider swap)
docs/             architecture / development / usage / roadmap / media
public/           images/ (hero) · avatars/ (36 selectable icons)
.github/workflows keepalive.yml (Supabase anti-sleep)
```

## Status

Alpha, live, in active development. What's done and what's next is tracked in
[docs/ROADMAP.md](docs/ROADMAP.md).
