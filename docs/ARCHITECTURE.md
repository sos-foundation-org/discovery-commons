# Architecture

Reference for how Discovery Commons is built. Source of truth for the concepts;
read alongside `src/prisma/schema.prisma` and `src/lib/`.

- [Overview](#overview)
- [Data model](#data-model)
- [Visibility & the seal/reveal lifecycle](#visibility--the-sealreveal-lifecycle)
- [Access control](#access-control)
- [Credit system](#credit-system)
- [Auth & sessions](#auth--sessions)
- [Hashing & verification](#hashing--verification)
- [Contribution types, disciplines, media](#contribution-types-disciplines-media)
- [Dual-database strategy](#dual-database-strategy)
- [Integrity triggers (production)](#integrity-triggers-production)
- [Dormant Phase-2 subsystems](#dormant-phase-2-subsystems)

---

## Overview

Next.js 14 App Router. Pages are **server components** that query the DB via
Prisma and render; interactive bits are small **client components**. There is no
separate backend — API routes under `src/app/api/**` handle mutations.

```
Browser ──► Next.js (Vercel serverless) ──► Prisma ──► Postgres (Supabase)
             │  server components (read)
             │  /api routes (write)
             └─ NextAuth (Google OAuth, JWT)
```

Access control and business rules live in the **app layer** (`src/lib`), not in
the database. The database enforces only *immutability* (via triggers, prod).

## Data model

19 Prisma models. The core graph:

```
User ──< Thread ──< Contribution ──< Comment
              │           │
              │           ├─ ContributionVersion (edit history)
              │           ├─ ContributionShare   (extra viewers)
              │           └─ SealedRegistration   (legacy seal record)
              ├─ ThreadCollaborator (shared-thread members)
              └─ CreditV2 / Credit  (attribution)
```

Key domain models (`src/prisma/schema.prisma`):

- **User** — profile, `trustLevel`, `image` (avatar: Google URL or `/avatars/NN.png`), ORCID fields.
- **Thread** — `title`, `description`, `visibility` (private/shared/public),
  `discipline` (colored badge), `domainTags` (JSON array), `currentStage`,
  `verificationBadge`, `doi`.
- **Contribution** — `type`, `content` (Markdown), `contentHash`, `visibility`
  (private/shared/public/sealed), `sealedAt`/`revealedAt`, `parentId` (tree),
  `metadata` (JSON: `methodAppliesTo`, `dataUrl`, …).
- **ThreadCollaborator** — `(threadId, userId, role)`; grants `shared` access.
- **ContributionShare** — per-contribution extra viewers.
- **Comment** — typed (endorsement/critique/…), threaded via `parentId`.
- **CreditV2** — append-only credit rows (dimension, weight, hash, timestamp).
- **VisibilityLog** — audit trail of visibility changes.

> **Conventions.** Scalar-list-free (arrays are `Json`, not `String[]`) and no
> native enums, so the *same* schema runs on SQLite and Postgres — see
> [Dual-database strategy](#dual-database-strategy). Column names use `@map`
> snake_case; the triggers reference those DB names.

## Visibility & the seal/reveal lifecycle

Threads: `private | shared | public`. Contributions add `sealed`.

| Level | Who sees it |
|---|---|
| `private` | author (thread: creator + collaborators) |
| `shared` | thread collaborators + per-contribution shares |
| `public` | anyone, including logged-out visitors |
| `sealed` | **hash + timestamp public; content author-only** |

Rules (also enforced by prod triggers):
- A contribution is gated by **both** its own and its thread's visibility.
- Visibility only widens: `public` is terminal; `sealed → private` is forbidden.
- **Seal** (`POST /api/contributions/[id]/seal`): private|shared → sealed, stamps `sealedAt`; content becomes immutable.
- **Reveal** (`POST /api/contributions/[id]/reveal`): sealed → shared|public, stamps `revealedAt`, and **re-verifies `SHA-256(content)` against the stored hash** (409 if it no longer matches) — proving the revealed content is exactly what was sealed.

## Access control

Canonical helper: **`src/lib/access-control.ts`**.

- `checkContributionAccess(id, userId)` — loads and evaluates.
- `evaluateContributionAccess(contribution, userId)` — pure function; used when
  the thread + collaborators are already loaded (batch rendering).

Returns `{ canView, canViewContent, canEdit }`. `canView && !canViewContent`
means *sealed for a non-author* → the card shows the hash, masks the content.

> **Why app-layer, not Supabase RLS:** the app authenticates with NextAuth and
> connects through Prisma as the database owner, which **bypasses RLS**. RLS
> policies keyed on `auth.uid()` would do nothing. So visibility is enforced in
> code; the DB triggers only guard immutability (which Prisma cannot bypass).

## Credit system

Two coexisting layers:
- **`Credit`** (v1) — one row per contribution, keyed by contribution type;
  drives the "Discovery Credit Score" on `/profile`.
- **`CreditV2`** — append-only, dimension-based; drives dashboards, the thread
  distribution, and public profiles.

Prototype uses a **5-dimension** subset — `idea / data / method / analysis /
validation` (`PROTOTYPE_CREDIT_DIMENSIONS` in `src/lib/types.ts`). Contribution
type → dimension mapping is `CREDIT_TYPE_MAP` in `src/lib/credits.ts`.
`generateCredits()` writes CreditV2 rows on contribution create; `summarizeCredits()`
aggregates by dimension. The full **9-dim** config is retained for production.

## Auth & sessions

`src/lib/auth.ts` (NextAuth). **JWT session strategy** (not database) — required
so `next-auth/middleware` (Edge) can authorize protected routes by decoding the
JWT. The `jwt` callback stamps `id`, `trustLevel`, `displayName`, `image` onto
the token **once at sign-in**; the `session` callback reads them from the token
(no DB query per request).

- **Production:** Google OAuth, basic scopes (`openid email profile`), app in
  *Production* (no 7-day limit). `middleware.ts` protects
  `/threads/new /sealed /profile /notifications /settings /admin/*`.
- **Local dev:** a `CredentialsProvider` (enabled only when `NODE_ENV=development`
  and no `GOOGLE_CLIENT_ID`) upserts a user by email — sign in as anyone.

## Hashing & verification

`src/lib/hash.ts`. `generatePriorityHash(userId, content, timestamp)` =
`SHA-256(userId|content|ISO)`. Stored on the contribution as `contentHash` and
immutable. `/verify/[hash]` (public, no auth) looks up a hash, shows its
timestamp/author, and re-computes the hash from stored content to confirm
integrity — content shown only if the contribution is public.

## Contribution types, disciplines, media

- **Types** (`CONTRIBUTION_TYPE_CONFIG`): question, hypothesis, data, simulation,
  statistics, interpretation, insight, **methodology (Method)**, replication.
  Each has a label, Lucide icon (`TypeIcon`), and color. `Method` is standalone
  and records `metadata.methodAppliesTo` (data_collection/analysis/simulation).
- **Disciplines** (`DISCIPLINE_CONFIG`): 9 colored top-level fields on a thread.
- **Stages**: the canonical Q→H→D/S→I progression (`STAGE_LEVEL`); Method &
  Replication are valid types but don't advance the stage.
- **Media / visualization**: see [docs/media-and-data.md](media-and-data.md).
  Bodies render as Markdown (`ContributionContent`); ` ```chart ` and ` ```embed `
  fenced blocks become SVG charts / video iframes; `metadata.dataUrl` links raw data.

## Dual-database strategy

Prisma's `datasource provider` can't be an env var, so
**`scripts/prisma-provider.mjs`** rewrites it at build time from
`DATABASE_PROVIDER` (`sqlite` default, `postgresql` on Vercel). Wired into
`postinstall` and `build`. Because the schema avoids Postgres-only features, one
file serves both engines. The one query that differs (JSON-array `domainTags`
filter) branches on `DATABASE_PROVIDER` in `src/app/api/threads/route.ts`.

## Integrity triggers (production)

`src/prisma/triggers.sql` (Postgres only — SQLite has no such triggers, so local
dev relies on the app layer). Applied once via the Supabase SQL editor after
`prisma db push`. They enforce: immutable `content_hash` / `created_at` / credit
hashes+timestamps; sealed content can't change; visibility can't downgrade; and
no deletes on hash-bearing tables. See [DEPLOY.md](../DEPLOY.md).

## Dormant Phase-2 subsystems

Built earlier, intentionally **not** part of the prototype UX, kept for the
production path (do not delete): AI Reviewer (`src/lib/ai/*`, `/api/v2/threads/*/ai`),
ORCID linking (`/api/v2/auth/orcid/*`), Replication, ResearchObject/SDG, the
public API (`/api/v2/public/*`), and the 9-dimension credit config. Enabling them
is a production-phase decision — see [docs/ROADMAP.md](ROADMAP.md).
