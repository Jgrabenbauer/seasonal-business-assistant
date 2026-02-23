import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';

export const GET: RequestHandler = async () => {
  try {
    await db.$queryRaw`SELECT 1`;
    return json({ ok: true, db: 'connected', ts: new Date().toISOString() });
  } catch {
    return json({ ok: false, db: 'disconnected', ts: new Date().toISOString() }, { status: 503 });
  }
};
