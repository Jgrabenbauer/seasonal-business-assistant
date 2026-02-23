import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { requirePro } from '$lib/server/feature-gate';
import { BillingError } from '$lib/server/errors';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
  if (locals.user!.role !== 'MANAGER') {
    throw redirect(303, '/dashboard');
  }
  const org = await db.organization.findUnique({
    where: { id: locals.user!.organizationId }
  });
  return { org };
};

export const actions: Actions = {
  update: async ({ request, locals }) => {
    if (locals.user!.role !== 'MANAGER') {
      return fail(403, { error: 'Only managers can update settings' });
    }
    try {
      requirePro(locals.user!.organization, 'Branding');
    } catch (e) {
      if (e instanceof BillingError) {
        return fail(402, { error: e.message });
      }
      throw e;
    }
    const data = await request.formData();
    const brandName = (data.get('brandName') as string)?.trim() || null;
    const brandAccentColor = (data.get('brandAccentColor') as string)?.trim() || null;
    const brandLogoUrl = (data.get('brandLogoUrl') as string)?.trim() || null;
    const brandContactInfo = (data.get('brandContactInfo') as string)?.trim() || null;
    const smsEnabled = data.get('smsEnabled') === 'on';
    const slaDefaultOffsetHoursRaw = (data.get('slaDefaultOffsetHours') as string) ?? '0';
    const slaDefaultOffsetHours = Math.max(0, parseInt(slaDefaultOffsetHoursRaw, 10) || 0);
    const verificationRequired = data.get('verificationRequired') === 'on';

    await db.organization.update({
      where: { id: locals.user!.organizationId },
      data: {
        brandName,
        brandAccentColor,
        brandLogoUrl,
        brandContactInfo,
        smsEnabled,
        slaDefaultOffsetHours,
        verificationRequired
      }
    });

    return { success: true };
  }
};
