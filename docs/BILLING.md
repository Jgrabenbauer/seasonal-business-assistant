# Billing — Stripe

## Plans
- Starter (default)
- Pro

## Trial + Grace
- Trial: 14 days (`BILLING_TRIAL_DAYS`)
- Grace after payment failure: 7 days (`BILLING_GRACE_DAYS`)

## Setup
Env vars:
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_STARTER`
- `STRIPE_PRICE_PRO`
- `STRIPE_CHECKOUT_SUCCESS_URL`
- `STRIPE_CHECKOUT_CANCEL_URL`
- `STRIPE_PORTAL_RETURN_URL`

## Endpoints
- `POST /api/stripe/checkout` → Checkout Session URL
- `POST /api/stripe/portal` → Billing Portal URL
- `POST /api/stripe/webhook` → subscription sync

## Webhooks
Events:
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`

Webhook sync updates:
- `Subscription` table
- `Organization.subscriptionStatus`, `planType`

## Feature Gating
`requirePro()` guards:
- Analytics dashboard
- External notifications
- White-label branding
