import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Organization } from '@prisma/client';

// Mock the db module before importing billing
vi.mock('$lib/server/db', () => ({
  db: {
    user: { count: vi.fn() },
    property: { count: vi.fn() }
  }
}));

// Mock env
vi.mock('$lib/server/env', () => ({
  env: {
    DATABASE_URL: 'postgresql://test',
    SESSION_SECRET: 'test-secret-at-least-32-chars-long!!',
    MAGIC_LINK_SECRET: 'test-magic-secret-at-least-32-chars!',
    NODE_ENV: 'test',
    MAGIC_LINK_EXPIRY_HOURS: 48,
    SMS_PROVIDER: 'console',
    STORAGE_PROVIDER: 'local'
  }
}));

import { billingService } from '$lib/server/billing';
import { db } from '$lib/server/db';
import { BillingError } from '$lib/server/errors';

function makeOrg(overrides: Partial<Organization> = {}): Organization {
  return {
    id: 'org1',
    name: 'Test Org',
    slug: 'test-org',
    planType: 'STARTER',
    subscriptionStatus: 'TRIAL',
    trialEndsAt: null,
    gracePeriodEndsAt: null,
    maxWorkers: 5,
    maxProperties: 3,
    createdAt: new Date(),
    ...overrides
  };
}

describe('BillingService', () => {
  describe('isTrialExpired', () => {
    it('returns false for ACTIVE subscription', () => {
      const org = makeOrg({ subscriptionStatus: 'ACTIVE' });
      expect(billingService.isTrialExpired(org)).toBe(false);
    });

    it('returns false when trialEndsAt is null (legacy org)', () => {
      const org = makeOrg({ trialEndsAt: null });
      expect(billingService.isTrialExpired(org)).toBe(false);
    });

    it('returns true when trial has expired', () => {
      const org = makeOrg({ trialEndsAt: new Date(Date.now() - 1000) });
      expect(billingService.isTrialExpired(org)).toBe(true);
    });

    it('returns false when trial has not expired', () => {
      const org = makeOrg({ trialEndsAt: new Date(Date.now() + 86400000) });
      expect(billingService.isTrialExpired(org)).toBe(false);
    });
  });

  describe('isActive', () => {
    it('returns true for ACTIVE subscription', () => {
      expect(billingService.isActive(makeOrg({ subscriptionStatus: 'ACTIVE' }))).toBe(true);
    });

    it('returns true during valid trial', () => {
      const org = makeOrg({ trialEndsAt: new Date(Date.now() + 86400000) });
      expect(billingService.isActive(org)).toBe(true);
    });

    it('returns false after trial expires', () => {
      const org = makeOrg({ trialEndsAt: new Date(Date.now() - 1000) });
      expect(billingService.isActive(org)).toBe(false);
    });

    it('returns true during grace period', () => {
      const org = makeOrg({
        subscriptionStatus: 'PAST_DUE',
        gracePeriodEndsAt: new Date(Date.now() + 86400000)
      });
      expect(billingService.isActive(org)).toBe(true);
    });
  });

  describe('getTrialDaysRemaining', () => {
    it('returns null for ACTIVE subscription', () => {
      expect(billingService.getTrialDaysRemaining(makeOrg({ subscriptionStatus: 'ACTIVE' }))).toBeNull();
    });

    it('returns null when trialEndsAt is null', () => {
      expect(billingService.getTrialDaysRemaining(makeOrg({ trialEndsAt: null }))).toBeNull();
    });

    it('returns 0 when trial already expired', () => {
      const org = makeOrg({ trialEndsAt: new Date(Date.now() - 1000) });
      expect(billingService.getTrialDaysRemaining(org)).toBe(0);
    });

    it('returns correct days remaining', () => {
      const org = makeOrg({ trialEndsAt: new Date(Date.now() + 3 * 86400000) });
      expect(billingService.getTrialDaysRemaining(org)).toBe(3);
    });
  });

  describe('checkWorkerLimit', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('allows worker creation when under limit', async () => {
      vi.mocked(db.user.count).mockResolvedValue(3);
      const org = makeOrg({ maxWorkers: 5 });
      await expect(billingService.checkWorkerLimit(org)).resolves.toBeUndefined();
    });

    it('throws BillingError when at limit', async () => {
      vi.mocked(db.user.count).mockResolvedValue(5);
      const org = makeOrg({ maxWorkers: 5 });
      await expect(billingService.checkWorkerLimit(org)).rejects.toBeInstanceOf(BillingError);
    });
  });

  describe('checkPropertyLimit', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('skips check when maxProperties is -1 (unlimited)', async () => {
      const org = makeOrg({ maxProperties: -1 });
      await expect(billingService.checkPropertyLimit(org)).resolves.toBeUndefined();
      expect(db.property.count).not.toHaveBeenCalled();
    });

    it('throws BillingError when at property limit', async () => {
      vi.mocked(db.property.count).mockResolvedValue(3);
      const org = makeOrg({ maxProperties: 3 });
      await expect(billingService.checkPropertyLimit(org)).rejects.toBeInstanceOf(BillingError);
    });
  });
});
