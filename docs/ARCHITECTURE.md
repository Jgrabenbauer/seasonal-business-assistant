# Architecture — SBA

## Overview

```
Browser (Manager)          Browser (Worker - Mobile)
      │                              │
      ▼                              ▼
┌─────────────┐             ┌────────────────┐
│  /dashboard │             │  /w/[token]    │
│  (SSR)      │             │  (SSR + fetch) │
└──────┬──────┘             └───────┬────────┘
       │                            │
       ▼                            ▼
┌──────────────────────────────────────────┐
│           SvelteKit Server               │
│  hooks.server.ts → auth session inject   │
│  /api/checklist PATCH                    │
│  /api/uploads/*                          │
│  /api/stripe/*                           │
│  /api/sms/twilio/status                  │
└──────┬───────────────────────────────────┘
       │
   ┌───┴────────────────────────────┐
   │                                │
   ▼                                ▼
┌──────────┐                ┌──────────────┐
│ Prisma   │                │ Storage      │
│ (PG)     │                │ Local / S3   │
└──────────┘                └──────────────┘
       │
       ▼
┌──────────────────┐
│ SMS Provider     │
│ Console (default)│
│ Twilio (opt)     │
└──────────────────┘

┌──────────────────┐
│ Email Provider   │
│ Resend (opt)     │
└──────────────────┘

┌──────────────────┐
│ Background Jobs  │
│ pg-boss + worker │
└──────────────────┘
```

## Request Flow

### Manager Login
1. `POST /auth/login` form action
2. Verify password with bcrypt
3. Sign JWT session token (7d)
4. Set `sba_session` cookie (httpOnly, sameSite=lax)
5. Redirect to `/dashboard`

### Worker Checklist Access
1. Manager assigns worker → `signWorkerToken(workOrderId)` → JWT (48h)
2. Token stored in `WorkOrder.magicToken`
3. SMS sent via short link: `https://app.example.com/s/[token]` (expiring + tracked)
4. Worker opens link → `verifyWorkerToken(token)` → loads work order
5. `ChecklistRun` marked `startedAt`, `WorkOrder` → `IN_PROGRESS`
6. Worker taps items → `PATCH /api/checklist/[runId]/item/[itemId]`
7. All items done → `ChecklistRun.completedAt` + `WorkOrder.status = COMPLETED`

## Key Design Decisions

### No Worker Accounts
Workers access via signed JWT links. Zero friction for field workers. Trade-off: link sharing is possible but acceptable for this use case.

### SMS Abstraction
`SmsProvider` interface with console (dev) and Twilio (prod) implementations. Factory function `getSmsProvider()` uses env vars. Zero code changes to switch providers.

### Billing + Stripe
Stripe Checkout + Billing Portal for subscriptions. Webhooks sync `Subscription` and `Organization` status and enforce grace period.

### Jobs
pg-boss runs background jobs for SMS, email, and expiration tasks. Worker process: `npm run jobs:worker`.

### Presigned Uploads
S3-compatible presigned PUT uploads keep binary data out of app servers and allow direct client upload with validation.
### Storage Abstraction
`uploadFile()` switches between local filesystem and S3 based on `STORAGE_PROVIDER` env var. Local dev works with no cloud setup.

### Invitations
Managers invite workers/supervisors by email. `InviteToken` tracks status and expiry.

### Form Actions for CRUD
SvelteKit form actions provide progressive enhancement — forms work without JavaScript. Critical for field worker reliability.

### SSR for Manager Dashboard
Full SSR ensures fast initial loads on mobile, no client-side data fetching overhead for manager views.
