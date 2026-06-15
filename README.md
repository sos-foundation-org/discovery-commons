# Discovery Commons

**The Antilibrary of Science — where great questions are as valuable as great answers.**

## Vision

Discovery Commons reimagines how scientific knowledge is built. Instead of only surfacing finished work, DC creates a living, transparent record of the discovery process — from initial questions through observations, hypotheses, evidence gathering, and insights. The most valuable things here are the questions nobody has answered yet.

## Core Principles

- **Transparent Attribution**: Every contribution is timestamped and credited
- **Anti-Scooping by Design**: SHA-256 hash + timestamp proves priority; "Seal Your Idea" lets you register priority without revealing content
- **Layered Visibility**: 🔒 Private → 👥 Inner Circle → 🌐 Community → 🌍 Public
- **Structured Discovery**: Contributions follow Question → Observation → Hypothesis → Evidence → Insight
- **AI-Augmented**: Claude API identifies knowledge gaps and suggests literature
- **Progressive Trust**: Earn community trust through quality contributions

## Tech Stack

- **Framework**: Next.js 14+ (App Router) — TypeScript full-stack
- **Database**: PostgreSQL (Supabase) + Prisma ORM
- **Auth**: NextAuth.js (Google/GitHub OAuth)
- **Frontend**: React + Tailwind CSS
- **AI**: Claude API (@anthropic-ai/sdk)
- **Cache**: Redis (Upstash)
- **Deployment**: Vercel / Railway

## Project Structure

```
discovery-commons/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Auth routes
│   │   ├── (main)/             # Main app pages
│   │   │   ├── threads/
│   │   │   ├── sealed/
│   │   │   ├── profile/
│   │   │   └── admin/
│   │   └── api/                # API route handlers
│   ├── components/             # React components
│   │   ├── ui/                 # Base UI
│   │   ├── thread/             # Thread components
│   │   ├── contribution/       # Contribution components
│   │   ├── seal/               # Seal flow
│   │   └── evolution-map/      # DAG visualization
│   ├── lib/                    # Utilities (db, auth, hash, ai, cache)
│   └── prisma/                 # Schema + migrations
├── tests/                      # Unit / integration / e2e
├── docs/                       # Technical documentation
├── public/                     # Static assets
└── docker-compose.yml
```

## Operator

Sustainability of Sustainability Foundation — a 501(c)(3) public charity (EIN: 41-3097632), Cambridge, MA.

## Seed Topics

1. Information extraction reproducibility and soundscape research
2. Human brain resolution leaving temporal traces in high-dimensional universes
3. Complex system emergence as information propagation in high-dimensional spaces

## Status

🚧 **Phase 0 — Planning & Architecture** (current)

## License

Code: AGPL-3.0 (see LICENSE)
User content: CC BY-NC 4.0 (default) or CC BY 4.0 (user choice)

---

*Part of the [SOS Foundation](https://github.com/sos-foundation) ecosystem.*
