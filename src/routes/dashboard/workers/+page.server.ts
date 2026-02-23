import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { parsePaginationParams } from '$lib/utils';
import { logActivity } from '$lib/server/activity-log';

export const load: PageServerLoad = async ({ locals, url }) => {
  const { skip, limit, page } = parsePaginationParams(url, 25);

  const where = { organizationId: locals.user!.organizationId, role: 'WORKER' as const };

  const [workers, total] = await Promise.all([
    db.user.findMany({
      where,
      orderBy: { name: 'asc' },
      skip,
      take: limit,
      include: { _count: { select: { assignedTurnovers: true } } }
    }),
    db.user.count({ where })
  ]);

  return { workers, page, totalPages: Math.max(1, Math.ceil(total / limit)) };
};

export const actions: Actions = {
  toggle_sms: async ({ request, locals }) => {
    const data = await request.formData();
    const workerId = data.get('workerId') as string;
    const enabled = data.get('enabled') === 'true';
    const worker = await db.user.findFirst({
      where: { id: workerId, organizationId: locals.user!.organizationId, role: 'WORKER' }
    });
    if (!worker) return fail(404, { error: 'Worker not found' });
    if (!worker.phone) return fail(400, { error: 'Worker has no phone number' });

    await db.user.update({
      where: { id: worker.id },
      data: { smsOptIn: enabled }
    });

    logActivity({
      organizationId: locals.user!.organizationId,
      userId: locals.user!.id,
      actionType: 'WORKER_SMS_PREF_UPDATED',
      entityType: 'User',
      entityId: worker.id,
      metadata: { smsOptIn: enabled }
    });

    return { success: true };
  }
};
