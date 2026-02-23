# Database Schema — SBA

See `prisma/schema.prisma` for the authoritative source.

## Entity Relationship Summary

```
Organization (1) ─── (many) User
Organization (1) ─── (many) Property
Organization (1) ─── (many) ChecklistTemplate
Organization (1) ─── (many) WorkOrder
Organization (1) ─── (many) SmsMessage

ChecklistTemplate (1) ─── (many) ChecklistItemTemplate
Property (1) ─── (many) WorkOrder
WorkOrder (1) ─── (0..1) ChecklistRun
ChecklistRun (1) ─── (many) ChecklistItemRun
ChecklistItemRun (1) ─── (many) Attachment
```

## Key Tables

### Organization
Central multi-tenant boundary. All data is scoped by `organizationId`.

### User
- `role: MANAGER | WORKER`
- Managers have `email + passwordHash`
- Workers have `phone` (for SMS), no password

### WorkOrder
- Links Property + Template + assigned User
- `magicToken` — JWT for worker access (stored in DB to allow revocation)
- `tokenExpiresAt` — mirrors JWT expiry for DB-level checks

### ChecklistRun
- Created when a worker is assigned (from template items)
- `startedAt` set when worker first opens the link
- `completedAt` set when all items are non-PENDING

### SmsMessage
- Audit log of all sent SMS
- Pruned to last 50 per organization
- `provider: "console" | "twilio"`
- `externalId` — Twilio SID if real send

## Indexes (auto-created by Prisma)
- `Organization.slug` — unique
- `User.email` — unique
- `WorkOrder.magicToken` — unique
- `ChecklistRun.workOrderId` — unique
