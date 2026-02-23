import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('$lib/server/db', () => ({
  db: {
    organization: {
      findFirst: vi.fn(),
      update: vi.fn()
    },
    subscription: {
      upsert: vi.fn()
    }
  }
}));

vi.mock('$lib/server/env', () => ({
  env: {
    STRIPE_PRICE_STARTER: 'price_starter',
    STRIPE_PRICE_PRO: 'price_pro',
    BILLING_GRACE_DAYS: 7
  }
}));

import { db } from '$lib/server/db';
import { syncSubscriptionFromStripe } from '$lib/server/billing/stripe-sync';

describe('syncSubscriptionFromStripe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates org plan to PRO when price matches', async () => {
    vi.mocked(db.organization.findFirst).mockResolvedValue({
      id: 'org1'
    } as any);
    vi.mocked(db.subscription.upsert).mockResolvedValue({ id: 'sub1' } as any);

    await syncSubscriptionFromStripe({
      id: 'sub_1',
      customer: 'cus_1',
      status: 'active',
      items: { data: [{ price: { id: 'price_pro' } }] },
      current_period_end: Math.floor(Date.now() / 1000),
      trial_end: null,
      cancel_at_period_end: false
    } as any);

    expect(db.organization.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ planType: 'PRO' })
      })
    );
  });

  it('updates org plan to STARTER when price is starter', async () => {
    vi.mocked(db.organization.findFirst).mockResolvedValue({
      id: 'org2'
    } as any);
    vi.mocked(db.subscription.upsert).mockResolvedValue({ id: 'sub2' } as any);

    await syncSubscriptionFromStripe({
      id: 'sub_2',
      customer: 'cus_2',
      status: 'active',
      items: { data: [{ price: { id: 'price_starter' } }] },
      current_period_end: Math.floor(Date.now() / 1000),
      trial_end: null,
      cancel_at_period_end: false
    } as any);

    expect(db.organization.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ planType: 'STARTER' })
      })
    );
  });
});
