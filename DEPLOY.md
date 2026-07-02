# Deploying Discovery Commons ($0 / Vercel + Supabase Free)

This is the Sprint 1 deployment path from `DC_Web_Prototype_架構設計.md`. Local
dev runs on SQLite; production runs on Supabase PostgreSQL + Vercel. The same
Prisma schema serves both — `scripts/prisma-provider.mjs` swaps the datasource
provider at build time based on `DATABASE_PROVIDER`.

> **Access control note:** who-can-see-what is enforced in the app layer
> (`src/lib/access-control.ts`), not via Supabase RLS. This app uses NextAuth +
> Prisma (connecting as the DB owner), which bypasses RLS. The Postgres triggers
> in `src/prisma/triggers.sql` guard *immutability* (hashes, timestamps, sealed
> content, visibility downgrades) — Prisma cannot bypass those.

---

## 1. Supabase (database)

1. Create a project at https://supabase.com (Free tier). Pick a region near your users.
2. Project Settings → **Database** → **Connection string** → **URI**. You get two:
   - **Direct** (port `5432`) — use for `prisma db push` and applying triggers.
   - **Pooled / Transaction** (port `6543`) — use as the app's `DATABASE_URL` on Vercel.
3. Project Settings → **API**: copy the **Project URL** and **anon public key**.

### Push the schema + triggers (run once, from your machine)

```bash
# point at the DIRECT (5432) connection string
export DATABASE_PROVIDER=postgresql
export DATABASE_URL="postgresql://postgres.<ref>:<pwd>@<host>:5432/postgres?sslmode=require"

npm run prisma:provider          # rewrites schema provider -> postgresql
npx prisma db push               # creates all tables in Supabase
psql "$DATABASE_URL" -f src/prisma/triggers.sql   # immutability triggers

# (optional) seed demo content:
npm run db:seed
```

> On Windows PowerShell use `$env:DATABASE_PROVIDER="postgresql"` etc.
> After running, `git checkout src/prisma/schema.prisma` to restore the local
> (sqlite) provider line if it was modified.

---

## 2. Google OAuth (basic scopes, production mode — no 7-day expiry)

1. https://console.cloud.google.com → create/select a project.
2. **APIs & Services → OAuth consent screen**: User type **External**.
   - Scopes: only `openid`, `email`, `profile` (basic — no verification needed).
   - Publishing status: **In production** (basic scopes need no review, no fee,
     and are not subject to the 7-day refresh-token limit).
3. **Credentials → Create OAuth client ID → Web application**:
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google` (dev)
     - `https://<your-app>.vercel.app/api/auth/callback/google` (prod)
   - Copy the **Client ID** and **Client secret**.

---

## 3. Vercel (hosting)

1. Import the GitHub repo at https://vercel.com. Framework preset: **Next.js**
   (no `vercel.json` needed — `npm run build` already runs the provider swap).
2. **Project → Settings → Environment Variables** (Production):

   | Key | Value |
   |---|---|
   | `DATABASE_PROVIDER` | `postgresql` |
   | `DATABASE_URL` | Supabase **pooled** (6543) URI, `?sslmode=require` |
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://<ref>.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key |
   | `NEXTAUTH_URL` | `https://<your-app>.vercel.app` |
   | `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
   | `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | from step 2 |

3. Deploy. Every push to `main` auto-deploys.

---

## 4. Keepalive (stop Supabase from sleeping)

Supabase Free pauses after ~7 days idle. `.github/workflows/keepalive.yml` pings
it every 5 days. In the GitHub repo → **Settings → Secrets and variables →
Actions**, add:

- `SUPABASE_URL` = `https://<ref>.supabase.co`
- `SUPABASE_ANON_KEY` = anon key

Trigger it once manually (Actions tab → Keep Supabase Alive → Run workflow) to confirm.

---

## Local development (unchanged)

```bash
npm install
npm run dev            # SQLite (file:./dev.db), http://localhost:3000
npm run db:seed        # demo threads incl. sealed/shared/private contributions
```

`DATABASE_PROVIDER` unset ⇒ SQLite, so the committed schema is never modified locally.
