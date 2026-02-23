import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { parsePaginationParams } from '$lib/utils';
import { logActivity } from '$lib/server/activity-log';

export const load: PageServerLoad = async ({ locals, url }) => {
  const { skip, limit, page } = parsePaginationParams(url, 25);

  const where = { organizationId: locals.user!.organizationId };

  const [templates, total] = await Promise.all([
    db.checklistTemplate.findMany({
      where,
      orderBy: { name: 'asc' },
      skip,
      take: limit,
      include: { _count: { select: { items: true } } }
    }),
    db.checklistTemplate.count({ where })
  ]);

  return { templates, page, totalPages: Math.max(1, Math.ceil(total / limit)) };
};

export const actions: Actions = {
  create: async ({ request, locals }) => {
    const data = await request.formData();
    const name = (data.get('name') as string)?.trim();
    if (!name) return fail(400, { error: 'Template name is required' });

    const template = await db.checklistTemplate.create({
      data: { name, organizationId: locals.user!.organizationId }
    });

    logActivity({
      organizationId: locals.user!.organizationId,
      userId: locals.user!.id,
      actionType: 'TEMPLATE_CREATED',
      entityType: 'ChecklistTemplate',
      entityId: template.id,
      metadata: { name }
    });

    return { success: true };
  }
};
