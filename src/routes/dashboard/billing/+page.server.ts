import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';

export const load: PageServerLoad = async ({ locals }) => {
  if (locals.user!.role !== 'MANAGER') {
    throw redirect(303, '/dashboard');
  }

  const org = locals.user!.organization;

  const [workerCount, propertyCount, subscription] = await Promise.all([
    db.user.count({ where: { organizationId: org.id, role: 'WORKER' } }),
    db.property.count({ where: { organizationId: org.id } }),
    db.subscription.findUnique({ where: { organizationId: org.id } })
  ]);

  return {
    org: {
      name: org.name,
      planType: org.planType,
      subscriptionStatus: org.subscriptionStatus,
      trialEndsAt: org.trialEndsAt,
      maxWorkers: org.maxWorkers,
      maxProperties: org.maxProperties
    },
    workerCount,
    propertyCount,
    subscription
  };
};
