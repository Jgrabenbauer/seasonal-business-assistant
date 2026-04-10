import type { RequestHandler } from './$types';
import { repairLoopbackUrl } from '$lib/server/base-url';
import { db } from '$lib/server/db';

export const GET: RequestHandler = async ({ params, url }) => {
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

  const target = repairLoopbackUrl(record.target, url);
  if (target !== record.target) {
    await db.shortLink.update({
      where: { id: record.id },
      data: { target }
    });
  }

  return new Response(null, {
    status: 302,
    headers: { Location: target }
  });
};
