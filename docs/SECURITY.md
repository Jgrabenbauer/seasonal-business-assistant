# Security — SBA

## Authentication

### Manager Sessions
- Password hashed with bcrypt (cost factor 12)
- Session token: JWT signed with `SESSION_SECRET` (HS256, 7d expiry)
- Cookie: `httpOnly`, `sameSite=lax`, `secure` in production
- Session validated on every request via `hooks.server.ts`

### Worker Magic Links
- JWT signed with `MAGIC_LINK_SECRET` (HS256, 48h expiry)
- Contains only `workOrderId` and `type: "worker"` — no PII
- Stored in DB (`WorkOrder.magicToken`) for potential revocation
- Link is single-use by convention (no revocation in MVP)

## Authorization

- All dashboard routes require `locals.user.role === 'MANAGER'`
- All org-scoped queries filter by `organizationId` to prevent cross-tenant data access
- Workers can only access checklist items/uploads for their assigned work order (by token)

## Input Validation

- Form inputs validated server-side (not just client-side)
- File uploads: type and size validation before storage
- API route: status enum validated against allowlist
- Prisma parameterizes all queries (no SQL injection risk)

## Secrets Management

- Never commit `.env` files
- Use `fly secrets set` for production secrets
- Minimum secret length: 32 characters
- Rotate `SESSION_SECRET` invalidates all sessions

## Production Checklist

- [ ] Set `SESSION_SECRET` (min 32 chars, random)
- [ ] Set `MAGIC_LINK_SECRET` (min 32 chars, random, different from SESSION_SECRET)
- [ ] Set `NODE_ENV=production` (enables secure cookies)
- [ ] Use HTTPS (`force_https = true` in fly.toml)
- [ ] Set `STORAGE_PROVIDER=s3` for persistent uploads
- [ ] Configure S3 bucket with appropriate access policies

## Known Limitations (MVP)

- Magic links are not single-use (worker can reload page)
- No rate limiting on login or SMS endpoints
- No CSRF protection (SvelteKit form actions use SameSite cookie which mitigates CSRF)
- Upload URLs are publicly accessible if URL is known
