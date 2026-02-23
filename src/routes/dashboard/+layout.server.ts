import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { billingService } from '$lib/server/billing';

export const load: LayoutServerLoad = async ({ locals }) => {
  const user = locals.user;
  if (!user || (user.role !== 'MANAGER' && user.role !== 'SUPERVISOR')) {
    throw redirect(303, '/auth/login');
  }

  const org = user.organization;
  const billingInfo = {
    isActive: billingService.isActive(org),
    isTrialExpired: billingService.isTrialExpired(org),
    trialDaysRemaining: billingService.getTrialDaysRemaining(org),
    planType: org.planType,
    subscriptionStatus: org.subscriptionStatus
  };

  return { user, billingInfo };
};
