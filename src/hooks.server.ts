import type { Handle } from '@sveltejs/kit';
import { getSessionUser, COOKIE_NAME } from '$lib/server/auth';
import { checkRateLimit } from '$lib/server/rate-limit';
import { ensureSchedules } from '$lib/server/jobs/scheduler';
// Import env to trigger ENV validation at startup
import '$lib/server/env';

export const handle: Handle = async ({ event, resolve }) => {
  // Rate limit /auth/* and /api/* routes: 60 req/min per IP
  const path = event.url.pathname;
  if (path.startsWith('/auth/') || path.startsWith('/api/')) {
    const ip = event.request.headers.get('x-forwarded-for') ?? event.getClientAddress();
    const allowed = checkRateLimit(`rate:${ip}`, { windowMs: 60_000, max: 60 });
    if (!allowed) {
      return new Response('Too Many Requests', { status: 429 });
    }
  }

  const token = event.cookies.get(COOKIE_NAME);
  event.locals.user = await getSessionUser(token);
  ensureSchedules().catch((e) => console.error('[SBA:jobs]', e));

  const start = Date.now();
  const response = await resolve(event);
  const duration = Date.now() - start;

  const { method } = event.request;
  const status = response.status;
  const userId = event.locals.user?.id;

  if (process.env.NODE_ENV !== 'production') {
    console.log(`[SBA:req] ${method} ${path} ${status} ${duration}ms`);
  } else {
    console.log(
      JSON.stringify({ level: 'info', method, path, status, duration, userId: userId ?? null })
    );
  }

  return response;
};
