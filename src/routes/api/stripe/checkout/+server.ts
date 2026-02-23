import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getStripeClient } from '$lib/server/stripe';
import { env } from '$lib/server/env';
import { db } from '$lib/server/db';
import { apiError, ForbiddenError, ValidationError } from '$lib/server/errors';

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    if (!locals.user || locals.user.role !== 'MANAGER') {
      throw new ForbiddenError();
    }
    const { plan } = await request.json();
    if (!plan || !['STARTER', 'PRO'].includes(plan)) {
      throw new ValidationError('Invalid plan');
    }

    const org = locals.user.organization;
    const stripe = getStripeClient();

    let customerId = org.stripeCustomerId ?? null;
    if (!customerId) {
      const customer = await stripe.customers.create({
        name: org.name,
        email: locals.user.email ?? undefined,
        metadata: { organizationId: org.id }
      });
      customerId = customer.id;
      await db.organization.update({
        where: { id: org.id },
        data: { stripeCustomerId: customerId }
      });
    }

    const priceId = plan === 'PRO' ? env.STRIPE_PRICE_PRO : env.STRIPE_PRICE_STARTER;
    if (!priceId) throw new ValidationError('Stripe price is not configured');

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      client_reference_id: org.id,
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: env.BILLING_TRIAL_DAYS
      },
      success_url:
        env.STRIPE_CHECKOUT_SUCCESS_URL ??
        `${env.PUBLIC_BASE_URL ?? 'http://localhost:5173'}/dashboard/billing?success=1`,
      cancel_url:
        env.STRIPE_CHECKOUT_CANCEL_URL ??
        `${env.PUBLIC_BASE_URL ?? 'http://localhost:5173'}/dashboard/billing?canceled=1`
    });

    return json({ ok: true, url: session.url });
  } catch (e) {
    return apiError(e);
  }
};
