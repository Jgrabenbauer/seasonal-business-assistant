# Seasonal Business Assistant (SBA)

A mobile-first operations platform for Cape Cod seasonal business operators. Manage turnover/maintenance work orders, assign workers via SMS magic links, and track checklist completion from any device.

## Quickstart

```bash
# 1. Install dependencies
npm install

# 2. Copy env file and fill in secrets
cp .env.example .env

# 3. Start Postgres
docker-compose up -d db

# 4. Run migrations and seed
npm run db:migrate
npm run db:seed

# 5. Start dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

**Demo credentials:** `sarah@capecodstays.com` / `demo1234`

## Stack

- **SvelteKit** — SSR framework
- **TypeScript** — Type safety
- **Prisma** — ORM + migrations
- **PostgreSQL** — Database
- **Skeleton UI** — Component library (Tailwind-based)
- **pdf-lib** — PDF export
- **bcryptjs** — Password hashing
- **jsonwebtoken** — Session + magic link tokens

## Key Features

- **Work Orders** — Create, assign, and track turnover/maintenance jobs
- **Checklist Templates** — Reusable checklists attached to work orders
- **Worker Magic Links** — SMS-delivered, no-login-required worker experience
- **Mobile-First UI** — Large tap targets, offline detection
- **Photo Uploads** — Camera-friendly, stored locally or in S3
- **PDF Export** — Download work order reports
- **SMS Outbox** — View last 50 messages (console or Twilio)

## Commands

```bash
npm run dev          # Development server
npm run build        # Production build
npm run db:migrate   # Run Prisma migrations
npm run db:seed      # Seed demo data
npm run test         # Run all tests
npm run test:unit    # Unit tests only
npm run test:integration  # Integration tests (requires DB)
```

## Deployment (Fly.io)

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for full instructions.

```bash
fly launch
fly postgres create --name sba-db
fly postgres attach sba-db
fly secrets set SESSION_SECRET=... MAGIC_LINK_SECRET=...
fly deploy
```

## Environment Variables

See [.env.example](.env.example) for all required variables.
