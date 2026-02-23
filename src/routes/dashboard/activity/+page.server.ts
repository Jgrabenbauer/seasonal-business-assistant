import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { parsePaginationParams } from '$lib/utils';

export const load: PageServerLoad = async ({ locals, url }) => {
  const { skip, limit, page } = parsePaginationParams(url, 50);

  const [logs, total] = await Promise.all([
    db.activityLog.findMany({
      where: { organizationId: locals.user!.organizationId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        user: { select: { name: true, role: true } }
      }
    }),
    db.activityLog.count({ where: { organizationId: locals.user!.organizationId } })
  ]);

  return {
    logs,
    page,
    totalPages: Math.max(1, Math.ceil(total / limit))
  };
};
