import { describe, it, expect, vi } from 'vitest';

vi.mock('$lib/server/env', () => ({
  env: { STRIPE_WEBHOOK_SECRET: 'whsec_test' }
}));

vi.mock('$lib/server/stripe', () => ({
  getStripeClient: vi.fn().mockReturnValue({
    webhooks: {
      constructEvent: vi.fn(() => ({
        type: 'customer.subscription.updated',
        data: { object: { id: 'sub_1', customer: 'cus_1', status: 'active', items: { data: [] } } }
      }))
    }
  })
}));

vi.mock('$lib/server/billing/stripe-sync', () => ({
  syncSubscriptionFromStripe: vi.fn()
}));

import { POST } from '../../src/routes/api/stripe/webhook/+server';

describe('stripe webhook', () => {
  it('accepts valid webhook', async () => {
    const res = await POST({
      request: new Request('http://localhost/api/stripe/webhook', {
        method: 'POST',
        headers: { 'stripe-signature': 'sig' },
        body: 'test'
      })
    } as any);
    expect(res.status).toBe(200);
  });
});
