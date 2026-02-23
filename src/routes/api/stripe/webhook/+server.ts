import type { RequestHandler } from './$types';
import { env } from '$lib/server/env';
import { getStripeClient } from '$lib/server/stripe';
import { syncSubscriptionFromStripe } from '$lib/server/billing/stripe-sync';
import { db } from '$lib/server/db';

export const POST: RequestHandler = async ({ request }) => {
  const signature = request.headers.get('stripe-signature');
  if (!signature || !env.STRIPE_WEBHOOK_SECRET) {
    return new Response('Missing signature', { status: 400 });
  }

  const stripe = getStripeClient();
  const body = await request.text();
  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('[SBA:stripe]', { error: (err as Error).message });
    return new Response('Invalid signature', { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        const customerId = session.customer as string;
        const orgId = session.client_reference_id as string | undefined;
        if (orgId) {
          await db.organization.update({
            where: { id: orgId },
            data: { stripeCustomerId: customerId }
          });
        }
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        await syncSubscriptionFromStripe(event.data.object as any);
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as any;
        const subscriptionId = invoice.subscription as string | null;
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          await syncSubscriptionFromStripe(subscription);
        }
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error('[SBA:stripe]', { error: (err as Error).message, type: event.type });
    return new Response('Webhook error', { status: 500 });
  }

  return new Response('ok');
};
