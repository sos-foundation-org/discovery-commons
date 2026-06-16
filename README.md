# Discovery Commons

**The Antilibrary of Science** — a collaborative research platform where great questions are as valuable as great answers.

Discovery Commons reimagines how early-stage scientific ideas are shared, attributed, and built upon. Every contribution is SHA-256 hashed and timestamped for priority protection, with graduated visibility controls that let researchers share at their own pace.

## Features

### Core Discovery
- **Structured threads** — Lines of inquiry progress through stages: Question → Hypothesis → Data/Simulation (parallel) → Statistics → Interpretation → Insight
- **Layered contributions** — 7 contribution types (question, data, statistics, simulation, interpretation, hypothesis, insight) with weighted credit scoring
- **Stage progression** — Visual stage stepper with automatic and manual advancement by thread creators
- **Domain tagging** — Organize threads by research domain with search and filtering

### Priority Protection
- **SHA-256 hashing** — Every contribution receives a content hash + timestamp at creation
- **Seal-then-reveal** — Register the hash of an idea without revealing content; unseal when ready to share
- **Immutable audit trail** — Original hashes are preserved through edits via versioning
- **Verifiable proofs** — Public hash verification endpoints for any contribution or sealed registration

### Graduated Visibility
- **L0 (Private)** — Only you can see it
- **L1 (Inner Circle)** — Shared with your trusted circle members
- **L2 (Community)** — Visible to all logged-in users
- **L3 (Public)** — Open to everyone
- One-way upgrade only — visibility can be increased but never decreased

### Collaboration
- **Trusted circles** — Invite collaborators by email for L1 visibility sharing
- **Comment/review system** — 6 comment types (endorsement, question, critique, suggestion, method review, stat review) with anonymous option
- **Threaded comments** — Up to 3 levels of nesting
- **Notifications** — Real-time notification bell with 30s polling, notifications page with mark-as-read

### Credit & Attribution
- **Discovery Credit Score** — Weighted scoring (Question: 1, Hypothesis: 2, Data: 3, Simulation: 3, Statistics: 3, Interpretation: 4, Insight: 5)
- **Credit dashboard** — Visual breakdown by contribution type with bar charts
- **Export** — Download credit history as CSV or JSON
- **Community covenant** — 6 principles members agree to

### Search & Discovery
- **Full-text search** — Search threads by title, description, and domain tags
- **Multi-filter** — Filter by stage, visibility level, and domain tag simultaneously
- **URL-based state** — Search results are shareable via URL query parameters

## Tech Stack

- **Framework**: Next.js 14 (App Router, Server + Client Components)
- **Language**: TypeScript
- **Database**: SQLite (via Prisma ORM) — swap to PostgreSQL for production
- **Auth**: NextAuth.js with Credentials Provider (dev), OAuth-ready for production
- **Styling**: Tailwind CSS
- **Validation**: Zod
- **Hashing**: Web Crypto API (SHA-256)

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Setup

```bash
# Clone the repository
git clone <repo-url>
cd discovery-commons

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your NEXTAUTH_SECRET (any random string for dev)

# Set up the database
npx prisma db push

# Seed the database (optional — creates demo users and threads)
npx prisma db seed

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Environment Variables

```
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"
```

### Dev Authentication

In development mode, the app uses a credentials provider. Sign in with any email — a user account is automatically created. No OAuth configuration needed.

## Project Structure

```
src/
├── app/
│   ├── api/                    # 21 API routes
│   │   ├── auth/               # NextAuth
│   │   ├── threads/            # Thread CRUD, visibility, stage advancement
│   │   ├── contributions/      # Contribution CRUD, comments, unseal, verify
│   │   ├── sealed/             # Seal registration, reveal, verify
│   │   ├── credits/            # Credit export (CSV/JSON)
│   │   ├── notifications/      # Notification list and mark-as-read
│   │   ├── trusted-circle/     # Circle member management
│   │   └── users/              # User profile, credits, covenant, trusted circle
│   ├── about/                  # About page with platform philosophy
│   ├── auth/signin/            # Sign-in page
│   ├── notifications/          # Notification center
│   ├── profile/                # Credit dashboard and user stats
│   ├── sealed/                 # Seal-then-reveal interface
│   ├── settings/               # Trusted circle management
│   ├── threads/                # Thread listing with search/filters
│   │   ├── new/                # Create thread form
│   │   └── [threadId]/         # Thread detail with contributions
│   ├── layout.tsx              # Root layout with navbar and footer
│   ├── not-found.tsx           # Custom 404 page
│   └── page.tsx                # Landing page
├── components/
│   ├── contribution/           # ContributionForm, CommentSection, UnsealButton
│   ├── layout/                 # Footer
│   ├── thread/                 # ThreadFilters, StageAdvance, VisibilityUpgrade
│   ├── ui/                     # Button, Card, Badge, Input, Textarea, Toaster
│   ├── navbar.tsx              # Global navbar with notification bell
│   └── providers.tsx           # SessionProvider wrapper
├── lib/
│   ├── auth.ts                 # NextAuth config
│   ├── db.ts                   # Prisma client
│   ├── hash.ts                 # SHA-256 hashing utilities
│   ├── types.ts                # Type definitions and config constants
│   ├── utils.ts                # Date formatting, timeAgo, cn()
│   └── validations.ts          # Zod schemas
└── prisma/
    └── schema.prisma           # Database schema
```

## Architecture

- **10 pages**: Landing, threads list, thread detail, new thread, sealed ideas, profile, settings, notifications, about, sign-in
- **21 API routes**: Full CRUD for threads, contributions, comments, seals, notifications, trusted circles, user profile, credits
- **15 components**: Reusable UI components for forms, thread management, and layout
- **Middleware**: Protects authenticated routes (`/threads/new`, `/sealed`, `/profile`, `/notifications`, `/settings`, `/admin/*`)

## Known TODOs

- **Per-contribution circle restriction** — L1 circle selection UI exists on the contribution form, but per-contribution visibility filtering is not yet enforced server-side (all circle members can see all L1 content for now)
- **OAuth providers** — Currently dev-only credentials auth; add Google/GitHub/ORCID for production
- **Email notifications** — Currently in-app only; add email digest option
- **Rate limiting** — No rate limiting on API routes
- **File attachments** — No file upload support for contributions
- **Real-time updates** — Polling-based notifications; could upgrade to WebSockets/SSE
- **Admin panel** — Admin routes exist in middleware but no admin UI built yet
- **Tests** — No test suite yet
- **PostgreSQL migration** — Currently using SQLite; swap `provider` in schema.prisma and adjust Json field queries for production

## Operator

Sustainability of Sustainability Foundation — a 501(c)(3) public charity (EIN: 41-3097632), Cambridge, MA.

## License

Code: AGPL-3.0
