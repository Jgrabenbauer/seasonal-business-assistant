import { env } from './env';

export function captureError(error: unknown, context?: Record<string, unknown>) {
  if (!env.SENTRY_DSN) return;
  // Placeholder for Sentry or similar error monitoring
  console.log('[SBA:monitoring]', { error: (error as Error)?.message, context });
}
