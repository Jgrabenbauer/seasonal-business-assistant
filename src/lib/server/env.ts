import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 characters'),
  MAGIC_LINK_SECRET: z.string().min(32, 'MAGIC_LINK_SECRET must be at least 32 characters'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PUBLIC_BASE_URL: z.string().url().optional(),
  MAGIC_LINK_EXPIRY_HOURS: z.coerce.number().int().positive().default(48),
  SMS_PROVIDER: z.enum(['console', 'twilio']).default('console'),
  STORAGE_PROVIDER: z.enum(['local', 's3']).default('local'),
  S3_BUCKET: z.string().optional(),
  S3_ENDPOINT: z.string().optional(),
  S3_REGION: z.string().optional(),
  S3_FORCE_PATH_STYLE: z.coerce.boolean().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PRICE_STARTER: z.string().optional(),
  STRIPE_PRICE_PRO: z.string().optional(),
  STRIPE_PORTAL_RETURN_URL: z.string().optional(),
  STRIPE_CHECKOUT_SUCCESS_URL: z.string().optional(),
  STRIPE_CHECKOUT_CANCEL_URL: z.string().optional(),
  BILLING_TRIAL_DAYS: z.coerce.number().int().positive().default(14),
  BILLING_GRACE_DAYS: z.coerce.number().int().positive().default(7),
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().optional(),
  PG_BOSS_SCHEMA: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
  TWILIO_STATUS_CALLBACK_URL: z.string().optional()
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  const issues = result.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
  console.error('[SBA:startup] ENV validation failed:\n' + issues);
  process.exit(1);
}

export const env = result.data;
