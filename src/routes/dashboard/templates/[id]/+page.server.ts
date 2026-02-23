import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';

export const load: PageServerLoad = async ({ params, locals }) => {
  const template = await db.checklistTemplate.findFirst({
    where: { id: params.id, organizationId: locals.user!.organizationId },
    include: { items: { orderBy: { sortOrder: 'asc' } } }
  });
  if (!template) throw error(404, 'Template not found');
  return { template };
};

export const actions: Actions = {
  add_item: async ({ request, params, locals }) => {
    const data = await request.formData();
    const title = (data.get('title') as string)?.trim();
    const description = (data.get('description') as string)?.trim() || null;
    const photoRequired = data.get('photoRequired') === 'on';

    if (!title) return fail(400, { error: 'Item title is required' });

    const template = await db.checklistTemplate.findFirst({
      where: { id: params.id, organizationId: locals.user!.organizationId },
      include: { _count: { select: { items: true } } }
    });
    if (!template) return fail(404, { error: 'Template not found' });

    await db.checklistItemTemplate.create({
      data: {
        templateId: params.id,
        title,
        description,
        photoRequired,
        sortOrder: template._count.items
      }
    });

    return { success: true };
  },

  delete_item: async ({ request, params, locals }) => {
    const data = await request.formData();
    const itemId = data.get('itemId') as string;

    const template = await db.checklistTemplate.findFirst({
      where: { id: params.id, organizationId: locals.user!.organizationId }
    });
    if (!template) return fail(404, { error: 'Not found' });

    await db.checklistItemTemplate.delete({ where: { id: itemId, templateId: params.id } });
    return { success: true };
  },

  rename: async ({ request, params, locals }) => {
    const data = await request.formData();
    const name = (data.get('name') as string)?.trim();
    if (!name) return fail(400, { error: 'Name required' });

    const template = await db.checklistTemplate.findFirst({
      where: { id: params.id, organizationId: locals.user!.organizationId }
    });
    if (!template) return fail(404, { error: 'Not found' });

    await db.checklistTemplate.update({ where: { id: params.id }, data: { name } });
    return { success: true };
  }
};
