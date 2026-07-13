# Roadmap & status

Last updated: 2026-07-03. The prototype is **live** at
https://discovery-commons.vercel.app on Vercel + Supabase (free tiers, $0).

## ✅ Done (prototype)

- **Infra / deploy** — dual-provider Prisma (SQLite local / Supabase Postgres
  prod), build-time provider swap, Postgres immutability triggers, keepalive
  GitHub Action, Vercel auto-deploy from `main`, `$0` running cost.
- **Auth** — Google OAuth (basic scopes, production mode), JWT sessions, dev
  credentials login for local.
- **Threads & contributions** — CRUD, 9 typed contributions incl. first-class
  **Method**, Q→H→D/S→I stage pipeline, SHA-256 hashing + timestamps.
- **Per-contribution visibility** — private/shared/public/**sealed**; app-layer
  access control (`access-control.ts`).
- **Seal → Reveal** — hash-verified reveal, seal an existing contribution.
- **Collaborators** — invite/remove per thread; shared-visibility access.
- **Credit** — 5-dimension prototype model (idea/data/method/analysis/validation),
  dashboards, thread distribution, public profiles.
- **Comments** — typed + threaded.
- **Public pages** — home feed, threads, thread detail, `/profile/[userId]`,
  `/verify/[hash]`, `/legal/{privacy,terms,cla}`.
- **UI** — forum-style readable design (ThreadRow, avatar system, colored type
  icons, disciplines with colors), real Markdown rendering, theme + hero image.
- **Media / viz** — ` ```chart ` (SVG), ` ```embed ` (YouTube/Vimeo), Markdown
  images, Data `dataUrl` links. See [media-and-data.md](media-and-data.md).
- **Docs** — this set (README, ARCHITECTURE, DEVELOPMENT, USAGE, DEPLOY, media).

## 🔧 Remaining prototype polish (small, no new architecture)

- [ ] **Color/design rollout** to `profile`, `credits`, `sealed`, `settings`,
      `notifications`, `about` (forum language applied to threads + home so far).
- [ ] **ContributionShare UI** — model + access-control already support per-
      contribution sharing to specific users; needs a share endpoint + button.
- [ ] **Keepalive secrets** — add `SUPABASE_URL` / `SUPABASE_ANON_KEY` repo
      secrets and run the action once (DEPLOY.md §4).
- [ ] **Custom domain** (optional) — e.g. `dc.sosfoundation.org` (Vercel Domains).
- [ ] **Empty/loading states & error toasts** pass for polish.
- [ ] **Automated tests** — none yet; add unit tests for `access-control`,
      `hash`, `credits`, and an e2e smoke for seal→reveal.

## 🧭 Planned features (need design before building)

- [ ] **Richer visualization** — Vega-Lite (` ```vega-lite `) for statistical
      charts and Mermaid (` ```mermaid `) for diagrams/infographics, lazy-loaded
      (bundle cost). Optional first-class `visualization` contribution type.
- [ ] **Raw-data, deeper** — dataset format/licence metadata, file checksums,
      multiple files, a code→data execution story.
- [ ] **Media uploads** — Supabase Storage for users who can't self-host images,
      with size/type limits (prototype is link-only by design).
- [ ] **Notifications** — richer types; email digests (mind Supabase email limits).
- [ ] **Search** — currently title/description contains; consider full-text.

## 🚀 Production phase (from the architecture brief)

Deferred, dormant code already exists for several of these (see ARCHITECTURE
§"Dormant Phase-2 subsystems"). Turning them on is a production decision:

- **9-dimension credit** (add method/communication/curation/resource/mentorship
  back into the prototype's 5 dims).
- **ORCID** login/linking; **DOI** minting (DataCite) for research objects.
- **AI features** — Reviewer / Assistant / Translator (`src/lib/ai/*`); needs a
  budget ceiling (Claude API) — deliberately off in the prototype.
- **Research Objects / SDG** and the **public API v2**.
- **Replication** system and **verification badges** surfaced in the UX.
- **Trusted timestamping (TSA)** — replace server-timestamp trust with a third-
  party RFC-3161 timestamp for legally stronger priority evidence.
- **Scale/ops** — Supabase Pro (backups, no auto-pause), Vercel Pro if the
  non-commercial Hobby terms become an issue; Cloudflare Pages is the $0 fallback.
- **L0–L3 visibility mapping** — prototype private/shared/public/sealed maps to
  the production L0–L3 model (see the architecture brief §5).

## ⚠️ Known limitations / tech debt

- **Two credit systems** coexist (`Credit` v1 by type + `CreditV2` by dimension);
  unify in production.
- **`SealedRegistration`** (legacy standalone seal) coexists with the newer
  `Contribution.visibility='sealed'`; the `/sealed` page uses the legacy path.
- **RLS is intentionally unused** (NextAuth+Prisma bypasses it) — access control
  is app-layer. Any future Supabase-client access must re-derive authorization.
- **No automated tests / CI** beyond the build.
- **Prod seed data is frozen** by immutability triggers — new demo/content must be
  created via the app, not re-seeded.
