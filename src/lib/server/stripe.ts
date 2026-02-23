import Stripe from 'stripe';
import { env } from './env';

export function getStripeClient() {
  if (!env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  return new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });
}

export function isStripeEnabled() {
  return Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_WEBHOOK_SECRET);
}
