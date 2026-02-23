# SMS — Twilio

## Providers
- Console (dev): logs to server console
- Twilio (prod): real SMS delivery

## Env Vars
- `SMS_PROVIDER=twilio`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_FROM_NUMBER`
- `TWILIO_STATUS_CALLBACK_URL`

## Delivery Status
Twilio sends status callbacks to:
- `POST /api/sms/twilio/status`

This updates `SmsMessage.status`, `errorCode`, `errorMessage`, `deliveredAt`.

## Retry Logic
Background job `sms.send` retries failures with exponential backoff:
1m → 5m → 15m → 60m → 6h (max 5 attempts)

## Preferences
- Organization toggle: `Organization.smsEnabled`
- Worker opt-in: `User.smsOptIn`
