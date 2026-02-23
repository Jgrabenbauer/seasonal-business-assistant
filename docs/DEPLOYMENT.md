# Deployment — SBA

## Vercel (Recommended)

### Prerequisites
- Vercel account
- A Postgres database (Vercel Postgres recommended)

### First Deploy (Vercel Postgres)

1. Create a Vercel Postgres database
- In Vercel Dashboard: `Storage` -> `Create` -> `Postgres`
- Copy the `DATABASE_URL` from the database connection panel

2. Set environment variables in Vercel
- Required:
  - `DATABASE_URL`
  - `SESSION_SECRET` (min 32 chars)
  - `MAGIC_LINK_SECRET` (min 32 chars)
  - `PUBLIC_BASE_URL` (e.g. `https://yourapp.vercel.app`)
- Optional (Twilio, S3, Stripe, Resend): see the table below

3. Deploy
- Connect the repo in Vercel and deploy
- Vercel will run `npm install` and `npm run build`

4. Run migrations (manual)
- Run this locally or in CI with `DATABASE_URL` pointing at Vercel Postgres:

```bash
npx prisma migrate deploy
```

5. Seed (optional)

```bash
node -e "require('./prisma/seed')"
```

### Background Jobs (pg-boss)

Vercel serverless functions are not suitable for long-running workers. Run the
worker as a separate service on a long-running host (Render/Railway/VM/etc):

```bash
npm run jobs:worker
```

The worker must use the same `DATABASE_URL` as the web app.

### Subsequent Deploys

- Deploy via Vercel UI or Git push
- Run migrations manually when schema changes

## Docker Compose (Local / Self-Hosted)

```bash
# Copy and fill in secrets
cp .env.example .env

# Build and start
docker-compose up --build

# Run migrations (first time)
docker-compose exec app npx prisma migrate deploy

# Seed
docker-compose exec app node -e "require('./prisma/seed')"
```

App available at `http://localhost:3000`.

## Environment Variables Reference

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `SESSION_SECRET` | Yes | — | JWT signing secret (min 32 chars) |
| `MAGIC_LINK_SECRET` | Yes | — | Worker link JWT secret (min 32 chars) |
| `PUBLIC_BASE_URL` | Yes | `http://localhost:5173` | Full URL for SMS links |
| `NODE_ENV` | No | `development` | Set to `production` in prod |
| `SMS_PROVIDER` | No | `console` | `console` or `twilio` |
| `TWILIO_ACCOUNT_SID` | If twilio | — | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | If twilio | — | Twilio auth token |
| `TWILIO_FROM_NUMBER` | If twilio | — | Twilio phone number |
| `TWILIO_STATUS_CALLBACK_URL` | If twilio | — | Status webhook URL |
| `STORAGE_PROVIDER` | No | `local` | `local` or `s3` |
| `S3_REGION` | If s3 | — | AWS region |
| `S3_BUCKET` | If s3 | — | S3 bucket name |
| `S3_ENDPOINT` | No | — | S3-compatible endpoint |
| `S3_FORCE_PATH_STYLE` | No | — | Use path style for MinIO |
| `AWS_ACCESS_KEY_ID` | If s3 | — | AWS access key |
| `AWS_SECRET_ACCESS_KEY` | If s3 | — | AWS secret key |
| `STRIPE_SECRET_KEY` | If billing | — | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | If billing | — | Stripe webhook signing secret |
| `STRIPE_PRICE_STARTER` | If billing | — | Stripe price ID |
| `STRIPE_PRICE_PRO` | If billing | — | Stripe price ID |
| `STRIPE_CHECKOUT_SUCCESS_URL` | If billing | — | Checkout success redirect |
| `STRIPE_CHECKOUT_CANCEL_URL` | If billing | — | Checkout cancel redirect |
| `STRIPE_PORTAL_RETURN_URL` | If billing | — | Billing portal return URL |
| `BILLING_TRIAL_DAYS` | No | `14` | Trial length in days |
| `BILLING_GRACE_DAYS` | No | `7` | Grace period after payment failure |
| `RESEND_API_KEY` | If email | — | Resend API key |
| `RESEND_FROM_EMAIL` | If email | — | From address |
