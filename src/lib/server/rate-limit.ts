// In-memory sliding window rate limiter.
// NOTE: Single-instance only — resets on deploy/restart.
// For multi-instance scaling, replace Map with a Redis-backed store.

interface WindowEntry {
  count: number;
  windowStart: number;
}

const store = new Map<string, WindowEntry>();

// Prune expired entries every 5 minutes
setInterval(
  () => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now - entry.windowStart > 60_000) {
        store.delete(key);
      }
    }
  },
  5 * 60 * 1000
);

export function checkRateLimit(
  key: string,
  { windowMs, max }: { windowMs: number; max: number }
): boolean {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now - entry.windowStart > windowMs) {
    store.set(key, { count: 1, windowStart: now });
    return true;
  }

  if (entry.count >= max) {
    return false;
  }

  entry.count++;
  return true;
}
