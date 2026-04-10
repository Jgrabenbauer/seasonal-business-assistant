import { env } from './env';

const DEFAULT_BASE_URL = 'http://localhost:5173';

export function resolveBaseUrl(origin?: string | URL | null) {
  if (env.PUBLIC_BASE_URL) return env.PUBLIC_BASE_URL;
  if (origin instanceof URL) return origin.origin;
  return origin ?? DEFAULT_BASE_URL;
}
