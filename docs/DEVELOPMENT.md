# Development guide

## Prerequisites
- Node 18+ and npm. No Docker/Postgres needed locally — dev uses **SQLite**.

## Setup
```bash
npm install            # also runs prisma generate (sqlite)
npm run db:seed        # creates dev.db + demo data
npm run dev            # http://localhost:3000  (Turbopack)
```
`.env` (local) needs only:
```
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="any-dev-secret"
```
With no `GOOGLE_CLIENT_ID`, a **dev login** appears at `/auth/signin`: enter any
email to sign in. Use `admin@discoverycommons.org` to become the seeded admin.

## Scripts
| Command | Does |
|---|---|
| `npm run dev` | Dev server (SQLite) |
| `npm run build` | Swaps provider (per `DATABASE_PROVIDER`) → generate → `next build` |
| `npm run db:seed` | Reset/seed demo data (`src/prisma/seed.ts`) |
| `npm run db:push` | Push schema to the DB in `DATABASE_URL` |
| `npm run db:generate` | Regenerate Prisma client for the current provider |
| `npm run db:studio` | Prisma Studio |
| `npm run prisma:provider` | Rewrite the datasource provider from `DATABASE_PROVIDER` |

## Golden rules
- **Always `npx tsc --noEmit` (and ideally `npm run build`) before pushing.**
  `main` auto-deploys to the live site — there is no PR gate (solo prototype;
  commit directly to `main`).
- **Schema changes must be pushed to production** *before* the code that uses
  them deploys. New columns should be **nullable**. See [DEPLOY.md](../DEPLOY.md).
- After deploying (which leaves the local schema on `postgresql`), run
  `npm run db:generate` to switch the local Prisma client back to SQLite.
- Keep the schema **portable**: arrays as `Json` (not `String[]`), no native
  enums, so one schema serves SQLite + Postgres.

## Project structure
```
src/app/            routes — page.tsx (server components) + api/**/route.ts
src/components/      ui/ (primitives) + feature folders (thread/ contribution/ …)
src/lib/            auth · db · hash · access-control · credits · types · validations · utils
src/prisma/         schema.prisma · seed.ts · triggers.sql · dev.db
scripts/            prisma-provider.mjs
```
`src/lib/types.ts` is the single source for enums/config (contribution types,
disciplines, credit dimensions, visibility). `src/lib/validations.ts` holds Zod
schemas for API input.

## How to extend

**Add a contribution type** → `src/lib/types.ts`: add to `CONTRIBUTION_TYPES` +
`CONTRIBUTION_TYPE_CONFIG` (label/icon/color/description), map it in
`CREDIT_TYPE_MAP` (`src/lib/credits.ts`), add a Lucide icon in
`src/components/contribution/type-icon.tsx`, and (if it should advance the
pipeline) `STAGE_LEVEL`/`STAGE_ORDER`.

**Add a discipline** → add to `DISCIPLINES` + `DISCIPLINE_CONFIG` (label + Tailwind
badge/dot colors). It flows to the picker and `DisciplineBadge` automatically.

**Add per-type structured data** → extend `Contribution.metadata` (JSON) — no
migration needed. Validate in `createContributionSchema`, assemble in
`buildMetadata()` (`src/app/api/contributions/route.ts`), render on the card.

**Add a new visual block** → extend the fenced-block splitter in
`src/components/contribution/contribution-content.tsx` and add a renderer
(see `simple-chart.tsx` / `embed-block.tsx`). Keep it text-based and reproducible.

**Add a page** → `src/app/<route>/page.tsx`. If it needs auth, add the path to the
`matcher` in `src/middleware.ts`. Protected pages read `getSession()` from
`src/lib/auth.ts`.

## Testing changes
There is no automated test suite yet (see ROADMAP). Verify by: `tsc --noEmit`,
`npm run build`, and exercising the flow locally (dev login → create thread →
contribute → seal/reveal → verify hash).

## Gotchas learned in production
- Prisma engine DLL locks on Windows: stop `npm run dev` before `prisma generate`.
- Supabase free direct connection needs IPv6 — use the **Session pooler (5432)**
  for `db push` on IPv4 networks; the **Transaction pooler (6543, `?pgbouncer=true`)**
  for the app at runtime.
- Immutability triggers block re-seeding production — seed *before* applying
  triggers; never re-seed prod after.
