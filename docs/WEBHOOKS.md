# Webhooks

## Stripe
Endpoint: `POST /api/stripe/webhook`
Signature verified with `STRIPE_WEBHOOK_SECRET`.

Events:
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`

## Twilio
Endpoint: `POST /api/sms/twilio/status`
Signature verified with `TWILIO_AUTH_TOKEN`.

Updates SMS status and error details.
