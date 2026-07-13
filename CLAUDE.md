# CLAUDE.md

Guidance for AI assistants (and humans) working in this repo. Read
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) first.

## What this is
Discovery Commons — an open research platform (Next.js 14 + Prisma + NextAuth).
Live at https://discovery-commons.vercel.app on Vercel + Supabase free tiers ($0).

## Workflow (important)
- **Commit directly to `main` and push** — no feature branches, no PRs (solo
  prototype). `main` **auto-deploys to the live site**, so:
- **Always `npx tsc --noEmit` and `npm run build` (green) before pushing.**
- **Schema changes:** new columns must be **nullable** and pushed to Supabase
  *before* the dependent code deploys. Run against the **Session pooler (5432)**:
  `DATABASE_PROVIDER=postgresql npm run prisma:provider && npx prisma db push`,
  then `git checkout src/prisma/schema.prisma` and `npm run db:generate` to
  restore the local SQLite client. Never re-seed prod (triggers block it).
- End commit messages with the Co-Authored-By trailer.

## Conventions
- **Single source of truth for enums/config:** `src/lib/types.ts` (contribution
  types, disciplines, credit dimensions, visibility, method-applies-to).
- **API input validation:** Zod in `src/lib/validations.ts`.
- **Access control:** always via `src/lib/access-control.ts` — never re-implement
  visibility checks inline. RLS is intentionally NOT used (Prisma bypasses it).
- **Schema portability:** arrays are `Json` (not `String[]`), no native enums, so
  one schema runs on SQLite (local) and Postgres (prod). Don't break this.
- **Per-type extras:** store in `Contribution.metadata` (JSON) — no migration
  needed. See `buildMetadata()` in the contributions API.
- **Visuals are text-based & reproducible:** ` ```chart `, ` ```embed `, Markdown
  `![](url)`. Reference external media; never upload files (prototype). See
  [docs/media-and-data.md](docs/media-and-data.md).
- **Server components read; `/api` routes write.** Client components are small
  and marked `"use client"`.

## Do-not-break invariants
- JWT session strategy (not database) — required by `next-auth/middleware`.
- Immutability: `contentHash`, `created_at`, credit hashes/timestamps, and sealed
  content are immutable (prod triggers + app discipline).
- Visibility only widens; `public` is terminal; `sealed → private` is forbidden.

## Don't delete
Dormant Phase-2 code (AI Reviewer, ORCID, Replication, ResearchObject, public API
v2, 9-dim credit) is intentionally kept for the production path — see
[docs/ROADMAP.md](docs/ROADMAP.md).

## Where things live
`src/app` routes · `src/components` UI · `src/lib` logic · `src/prisma` schema +
seed + triggers · `scripts/prisma-provider.mjs` provider swap · `docs/` the docs.
