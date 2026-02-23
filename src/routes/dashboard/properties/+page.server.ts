import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { parsePaginationParams } from '$lib/utils';
import { billingService } from '$lib/server/billing';
import { logActivity } from '$lib/server/activity-log';
import { BillingError } from '$lib/server/errors';

export const load: PageServerLoad = async ({ locals, url }) => {
  const { skip, limit, page } = parsePaginationParams(url, 25);

  const where = { organizationId: locals.user!.organizationId };

  const [properties, total] = await Promise.all([
    db.property.findMany({
      where,
      orderBy: { name: 'asc' },
      skip,
      take: limit,
      include: { _count: { select: { turnovers: true } } }
    }),
    db.property.count({ where })
  ]);

  return { properties, page, totalPages: Math.max(1, Math.ceil(total / limit)) };
};

export const actions: Actions = {
  create: async ({ request, locals }) => {
    const data = await request.formData();
    const name = (data.get('name') as string)?.trim();
    const address = (data.get('address') as string)?.trim() || null;
    const notes = (data.get('notes') as string)?.trim() || null;

    if (!name) return fail(400, { error: 'Property name is required' });

    try {
      await billingService.checkPropertyLimit(locals.user!.organization);
    } catch (e) {
      if (e instanceof BillingError) {
        return fail(402, { error: e.message });
      }
      throw e;
    }

    const property = await db.property.create({
      data: { name, address, notes, organizationId: locals.user!.organizationId }
    });

    logActivity({
      organizationId: locals.user!.organizationId,
      userId: locals.user!.id,
      actionType: 'PROPERTY_ADDED',
      entityType: 'Property',
      entityId: property.id,
      metadata: { name, address }
    });

    return { success: true };
  }
};
