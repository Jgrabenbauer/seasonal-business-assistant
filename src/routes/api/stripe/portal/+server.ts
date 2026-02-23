import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getStripeClient } from '$lib/server/stripe';
import { env } from '$lib/server/env';
import { apiError, ForbiddenError, ValidationError } from '$lib/server/errors';

export const POST: RequestHandler = async ({ locals }) => {
  try {
    if (!locals.user || locals.user.role !== 'MANAGER') {
      throw new ForbiddenError();
    }
    const org = locals.user.organization;
    if (!org.stripeCustomerId) {
      throw new ValidationError('No Stripe customer found');
    }

    const stripe = getStripeClient();
    const portal = await stripe.billingPortal.sessions.create({
      customer: org.stripeCustomerId,
      return_url:
        env.STRIPE_PORTAL_RETURN_URL ??
        `${env.PUBLIC_BASE_URL ?? 'http://localhost:5173'}/dashboard/billing`
    });
    return json({ ok: true, url: portal.url });
  } catch (e) {
    return apiError(e);
  }
};
