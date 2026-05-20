# FormCraft

A full-stack form builder SaaS. Create, publish, and analyse forms with a drag-and-drop builder, real-time analytics, email notifications, and a public explore page.

## Demo

| Credential | Value |
|---|---|
| Email | `demo@formcraft.dev` |
| Password | `Demo@1234` |

Five sample forms are pre-seeded (3 public, 2 unlisted) with realistic responses and view counts.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Monorepo | Turborepo + pnpm workspaces |
| Frontend | Next.js 16 (App Router, Turbopack) |
| Backend | Express + tRPC v11 |
| Database | PostgreSQL + Drizzle ORM |
| Auth | NextAuth v5 (JWT) |
| Email | Resend + React Email |
| Charts | Recharts |
| QR Codes | qrcode.react |
| Rate limiting | Upstash Redis (in-memory fallback) |
| Styling | Tailwind CSS + shadcn/ui |

---

## Project Structure

```
formcraft-starter/
├── apps/
│   ├── web/          # Next.js frontend (port 3000)
│   └── api/          # Express + tRPC server (port 3001)
├── packages/
│   ├── database/     # Drizzle schema, migrations, seed
│   ├── trpc/         # tRPC router definitions
│   ├── email/        # React Email templates + Resend
│   ├── schemas/      # Shared Zod schemas
│   ├── utils/        # Shared utilities
│   └── services/     # Shared services
```

---

## Features

- **Form builder** — drag-and-drop field ordering, 10 field types, conditional logic
- **Theming** — 10 preset themes, custom colours, fonts, border radii, button styles
- **Analytics** — response trend (30-day line chart), field-level stats (bar chart), top referrers
- **Responses** — paginated table with expand/collapse, date filters, CSV export
- **Email notifications** — new-response alert to form owner, submission confirmation to respondent
- **Custom slugs** — change the public URL for any form
- **Expiry dates** — forms automatically stop accepting responses after a set date
- **Password protection** — gate forms behind a password (bcrypt-hashed)
- **QR code** — download SVG QR code for any form from the settings page
- **Clone** — duplicate a form with all its fields
- **Explore page** — browse public forms with full-text search and featured section
- **Rate limiting** — 5 submissions per IP per hour per form

---

## Local Development

### Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL 15+ (or use the included `docker-compose.yml`)

### Setup

```bash
# 1. Clone and install
git clone <repo-url>
cd formcraft-starter
pnpm install

# 2. Start Postgres
docker-compose up -d

# 3. Copy and fill environment files
cp .env.example apps/web/.env.local
cp .env.example apps/api/.env
# Edit both files with your DATABASE_URL, AUTH_SECRET, etc.

# 4. Push schema and seed demo data
pnpm --filter @formcraft/db db:push
pnpm --filter @formcraft/db seed

# 5. Start everything
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) and log in with the demo credentials above.

### Environment Variables

See [`.env.example`](.env.example) for all variables. Required ones:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTH_SECRET` | 32-char random secret (`openssl rand -hex 32`) |
| `NEXT_PUBLIC_APP_URL` | Frontend URL (default: `http://localhost:3000`) |

Optional (graceful fallbacks in dev):

| Variable | Description | Fallback |
|---|---|---|
| `RESEND_API_KEY` | Resend API key for email | Logs to console |
| `EMAIL_FROM` | Sender address | `FormCraft <noreply@formcraft.dev>` |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis URL for rate limiting | In-memory |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis token | In-memory |

---

## Deployment

### Frontend → Vercel

1. Import the repo in Vercel
2. Set **Root Directory** to `apps/web`
3. Add all environment variables
4. Deploy — `apps/web/vercel.json` configures the build automatically

### API → Railway

1. Create a new Railway project, connect the repo
2. Set **Root Directory** to `.` (monorepo root)
3. Add all environment variables + `PORT=3001`
4. Railway reads `apps/api/railway.json` for build and start commands

### Database → Neon / Supabase / Railway Postgres

Run migrations after provisioning:

```bash
DATABASE_URL=<prod-url> pnpm --filter @formcraft/db db:push
DATABASE_URL=<prod-url> pnpm --filter @formcraft/db seed
```

---

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start web + api in watch mode |
| `pnpm build` | Build all apps and packages |
| `pnpm --filter @formcraft/db studio` | Open Drizzle Studio |
| `pnpm --filter @formcraft/db seed` | Seed demo data |
| `pnpm --filter @formcraft/web lint` | Lint frontend |
