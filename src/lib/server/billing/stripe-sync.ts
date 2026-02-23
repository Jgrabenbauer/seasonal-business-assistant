import type Stripe from 'stripe';
import { db } from '../db';
import { env } from '../env';

export async function syncSubscriptionFromStripe(subscription: Stripe.Subscription) {
  const customerId =
    typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer.id;

  const org = await db.organization.findFirst({
    where: { stripeCustomerId: customerId }
  });
  if (!org) return;

  const priceId =
    subscription.items.data[0]?.price.id ?? env.STRIPE_PRICE_STARTER ?? 'unknown';
  const status = mapStripeStatus(subscription.status);

  const sub = await db.subscription.upsert({
    where: { organizationId: org.id },
    update: {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      priceId,
      status,
      currentPeriodEnd: subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000)
        : null,
      trialEndsAt: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      gracePeriodEndsAt: status === 'PAST_DUE'
        ? new Date(Date.now() + env.BILLING_GRACE_DAYS * 24 * 60 * 60 * 1000)
        : null
    },
    create: {
      organizationId: org.id,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      priceId,
      status,
      currentPeriodEnd: subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000)
        : null,
      trialEndsAt: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      gracePeriodEndsAt: status === 'PAST_DUE'
        ? new Date(Date.now() + env.BILLING_GRACE_DAYS * 24 * 60 * 60 * 1000)
        : null
    }
  });

  const planType = priceId === env.STRIPE_PRICE_PRO ? 'PRO' : 'STARTER';
  const limits =
    planType === 'PRO'
      ? { maxWorkers: 999, maxProperties: -1 }
      : { maxWorkers: 5, maxProperties: 3 };

  await db.organization.update({
    where: { id: org.id },
    data: {
      subscriptionStatus: status,
      planType,
      gracePeriodEndsAt: sub.gracePeriodEndsAt,
      trialEndsAt: sub.trialEndsAt ?? org.trialEndsAt,
      ...limits
    }
  });
}

export function mapStripeStatus(status: Stripe.Subscription.Status) {
  switch (status) {
    case 'trialing':
      return 'TRIAL';
    case 'active':
      return 'ACTIVE';
    case 'incomplete':
    case 'incomplete_expired':
      return 'INCOMPLETE';
    case 'past_due':
    case 'unpaid':
      return 'PAST_DUE';
    case 'canceled':
      return 'CANCELLED';
    default:
      return 'PAST_DUE';
  }
}
