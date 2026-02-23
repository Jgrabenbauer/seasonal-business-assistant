import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { parsePaginationParams } from '$lib/utils';

export const load: PageServerLoad = async ({ locals, url }) => {
  const { skip, limit, page } = parsePaginationParams(url, 50);

  const where = { organizationId: locals.user!.organizationId };

  const [messages, total] = await Promise.all([
    db.smsMessage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    }),
    db.smsMessage.count({ where })
  ]);

  return { messages, page, totalPages: Math.max(1, Math.ceil(total / limit)) };
};
