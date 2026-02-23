import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';

export const GET: RequestHandler = async ({ params }) => {
  const record = await db.shortLink.findUnique({ where: { token: params.token } });
  if (!record) return new Response('Not found', { status: 404 });
  if (record.purpose !== 'WORKER_MAGIC_LINK') {
    return new Response('Invalid link', { status: 400 });
  }
  if (record.expiresAt && new Date() > record.expiresAt) {
    return new Response('Expired', { status: 410 });
  }

  if (!record.usedAt) {
    await db.shortLink.update({
      where: { id: record.id },
      data: { usedAt: new Date() }
    });
  }

  return new Response(null, {
    status: 302,
    headers: { Location: record.target }
  });
};
