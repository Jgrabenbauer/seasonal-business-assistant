# Deployment — SBA

## Fly.io (Recommended)

### Prerequisites
- [Fly CLI](https://fly.io/docs/hands-on/install-flyctl/) installed
- `fly auth login`

### First Deploy

```bash
# 1. Initialize Fly app
fly launch --no-deploy

# 2. Create Postgres database
fly postgres create --name sba-db --region bos

# 3. Attach database (sets DATABASE_URL secret automatically)
fly postgres attach sba-db

# 4. Set required secrets
fly secrets set \
  SESSION_SECRET="$(openssl rand -base64 32)" \
  MAGIC_LINK_SECRET="$(openssl rand -base64 32)" \
  PUBLIC_BASE_URL="https://sba-mvp.fly.dev"

# 5. (Optional) Set Twilio secrets
fly secrets set \
  SMS_PROVIDER=twilio \
  TWILIO_ACCOUNT_SID=ACxxx \
  TWILIO_AUTH_TOKEN=xxx \
  TWILIO_FROM_NUMBER=+1xxxxxxxxxx \
  TWILIO_STATUS_CALLBACK_URL="https://yourapp.fly.dev/api/sms/twilio/status"

# 6. (Optional) Set S3 secrets
fly secrets set \
  STORAGE_PROVIDER=s3 \
  S3_REGION=us-east-1 \
  S3_BUCKET=sba-uploads \
  S3_ENDPOINT="https://s3.amazonaws.com" \
  S3_FORCE_PATH_STYLE=false \
  AWS_ACCESS_KEY_ID=xxx \
  AWS_SECRET_ACCESS_KEY=xxx

# 7. (Optional) Stripe + Resend
fly secrets set \
  STRIPE_SECRET_KEY=sk_live_xxx \
  STRIPE_WEBHOOK_SECRET=whsec_xxx \
  STRIPE_PRICE_STARTER=price_xxx \
  STRIPE_PRICE_PRO=price_xxx \
  STRIPE_CHECKOUT_SUCCESS_URL="https://yourapp.fly.dev/dashboard/billing?success=1" \
  STRIPE_CHECKOUT_CANCEL_URL="https://yourapp.fly.dev/dashboard/billing?canceled=1" \
  STRIPE_PORTAL_RETURN_URL="https://yourapp.fly.dev/dashboard/billing" \
  RESEND_API_KEY=re_xxx \
  RESEND_FROM_EMAIL="SBA <no-reply@yourdomain.com>"

# 8. Deploy
fly deploy

# 9. Run migrations
fly ssh console -C "npx prisma migrate deploy"

# 10. Seed (optional)
fly ssh console -C "node -e \"require('./prisma/seed')\""

# 11. Start background worker (separate process)
# Example on Fly: add a worker process in fly.toml
# Command: npm run jobs:worker
```

### Subsequent Deploys

```bash
fly deploy
# Migrations run automatically via CMD in Dockerfile (or add to entrypoint)
```

### Viewing Logs

```bash
fly logs
fly logs --app sba-mvp
```

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
