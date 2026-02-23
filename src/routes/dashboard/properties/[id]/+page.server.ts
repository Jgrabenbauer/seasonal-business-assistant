import { error } from '@sveltejs/kit';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { requirePro } from '$lib/server/feature-gate';
import { BillingError } from '$lib/server/errors';

export const load: PageServerLoad = async ({ params, locals }) => {
  const property = await db.property.findFirst({
    where: { id: params.id, organizationId: locals.user!.organizationId }
  });
  if (!property) throw error(404, 'Property not found');

  const org = await db.organization.findUnique({
    where: { id: locals.user!.organizationId }
  });
  if (!org) throw error(404, 'Organization not found');

  const turnovers = await db.turnover.findMany({
    where: { propertyId: params.id },
    orderBy: { guestArrivalAt: 'desc' },
    include: { assignedTo: true }
  });

  return { property, turnovers, org };
};

export const actions: Actions = {
  update_sla: async ({ request, locals, params }) => {
    if (locals.user!.role !== 'MANAGER') {
      return fail(403, { error: 'Only managers can update property SLA rules' });
    }
    try {
      requirePro(locals.user!.organization, 'SLA overrides');
    } catch (e) {
      if (e instanceof BillingError) {
        return fail(402, { error: e.message });
      }
      throw e;
    }

    const data = await request.formData();
    const slaOffsetRaw = (data.get('slaOffsetHours') as string)?.trim();
    const verificationRequiredRaw = data.get('verificationRequired') as string | null;

    const slaOffsetHours =
      slaOffsetRaw === '' || slaOffsetRaw === null ? null : Math.max(0, parseInt(slaOffsetRaw, 10) || 0);

    const verificationRequired =
      verificationRequiredRaw === '' || verificationRequiredRaw === null
        ? null
        : verificationRequiredRaw === 'on';

    const property = await db.property.findFirst({
      where: { id: params.id, organizationId: locals.user!.organizationId }
    });
    if (!property) return fail(404, { error: 'Property not found' });

    await db.property.update({
      where: { id: params.id },
      data: { slaOffsetHours, verificationRequired }
    });

    return { success: true };
  }
};
