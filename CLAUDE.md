# SBA — Claude Reference

## Project

Seasonal Business Assistant: mobile-first work order + checklist platform for Cape Cod seasonal property managers.

## Stack

- SvelteKit 2 + TypeScript
- Prisma 5 + PostgreSQL
- Skeleton UI 2 (Tailwind-based)
- Adapter: `@sveltejs/adapter-node`
- Deploy target: Fly.io

## Commands

```bash
npm run dev            # Dev server on :5173
npm run build          # Production build
npm run db:migrate     # Prisma migrate dev
npm run db:seed        # Seed demo data
npm run test           # All tests (vitest)
npm run test:unit      # Unit tests
npm run test:integration  # Requires DATABASE_URL
```

## Key Architecture

### Auth
- Manager login: email + password → JWT session cookie (`sba_session`, 7d)
- Worker access: JWT magic link token (48h), no account required
- `src/hooks.server.ts` injects `locals.user` on every request
- `src/routes/dashboard/+layout.server.ts` guards all manager routes

### SMS
- Default: `ConsoleSmsProvider` — logs to terminal, writes to `SmsMessage` DB table
- Production: `TwilioSmsProvider` — set `SMS_PROVIDER=twilio` + Twilio env vars
- Factory: `getSmsProvider()` in `src/lib/server/sms/index.ts`
- View last 50 messages at `/dashboard/sms-outbox`
 - Delivery callbacks: `/api/sms/twilio/status` updates message status
 - Queue: `queueSms()` in `src/lib/server/sms/service.ts`

### Storage
- Default: local filesystem (`static/uploads/`)
- Production: S3 via `STORAGE_PROVIDER=s3` + AWS env vars
- Factory: `uploadFile()` in `src/lib/server/storage.ts`
 - Presigned uploads via `/api/uploads/presign` + `/api/uploads/complete`

### Billing
- Stripe subscription with 14-day trial and Billing Portal
- Webhook: `/api/stripe/webhook` updates `Subscription` + `Organization`
- Checkout: `/api/stripe/checkout`
- Portal: `/api/stripe/portal`

### Jobs
- Background jobs via `pg-boss`
- Worker: `npm run jobs:worker`
- Scheduled jobs: subscription grace expiry + invite expiry

### Email
- Provider: Resend
- Queue: `queueEmail()` in `src/lib/server/email/service.ts`

### Worker Flow
1. Manager creates work order with checklist template
2. Manager assigns worker → generates JWT magic token → sends SMS
3. Worker opens `/w/[token]` → sees mobile checklist
4. Worker taps items to complete, optionally uploads photos
5. All items done → work order auto-completes

### Checklist API
- `PATCH /api/checklist/[runId]/item/[itemId]` — update item status
- `POST /api/upload` — multipart photo upload

## Data Model (key relationships)

```
Organization
  → Users (MANAGER | WORKER)
  → Properties
  → ChecklistTemplates → ChecklistItemTemplates
  → WorkOrders
       → ChecklistRun → ChecklistItemRuns → Attachments
  → SmsMessages
  → Subscription
  → InviteTokens
  → ShortLinks
```

## Logging Convention

```typescript
console.log('[SBA:sms]', { provider, to });
console.error('[SBA:error]', { route, error: e.message });
```

## Error Handling

- Route errors: `throw error(404, 'message')` from `@sveltejs/kit`
- Form actions: `return fail(400, { error: 'message' })`
- API routes: `return json({ ok: false, error }, { status: 400 })`
- Never expose stack traces in production

## Demo Data

After `npm run db:seed`:
- Manager: `sarah@capecodstays.com` / `demo1234`
- Workers: Mike Cleaner, Tom Maintenance
- Properties: Nauset Cottage, Harbor View Inn, Wellfleet Retreat
- Template: Standard Turnover (8 items)
- 1 open work order with magic link (printed to console)

## Extension Roadmap

1. Staffing module (schedules, availability)
2. Guest messaging (check-in/check-out SMS)
3. Repeat templates (auto-generate weekly orders)
4. PWA with push notifications
5. Supervisor role (view-only dashboard)
