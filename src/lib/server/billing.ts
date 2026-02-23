import type { Organization } from '@prisma/client';
import { db } from './db';
import { BillingError } from './errors';
import { env } from './env';

export interface BillingService {
  isTrialExpired(org: Organization): boolean;
  isActive(org: Organization): boolean;
  getTrialDaysRemaining(org: Organization): number | null;
  checkWorkerLimit(org: Organization): Promise<void>;
  checkPropertyLimit(org: Organization): Promise<void>;
}

class StripeBillingService implements BillingService {
  isTrialExpired(org: Organization): boolean {
    if (org.subscriptionStatus === 'ACTIVE') return false;
    if (!org.trialEndsAt) return false; // null = legacy org, indefinite trial
    return new Date() > org.trialEndsAt;
  }

  isActive(org: Organization): boolean {
    if (org.subscriptionStatus === 'ACTIVE') return true;
    if (org.subscriptionStatus === 'PAST_DUE' && org.gracePeriodEndsAt) {
      return new Date() < org.gracePeriodEndsAt;
    }
    return !this.isTrialExpired(org);
  }

  getTrialDaysRemaining(org: Organization): number | null {
    if (org.subscriptionStatus === 'ACTIVE') return null;
    if (!org.trialEndsAt) return null;
    const ms = org.trialEndsAt.getTime() - Date.now();
    if (ms <= 0) return 0;
    return Math.ceil(ms / (1000 * 60 * 60 * 24));
  }

  async checkWorkerLimit(org: Organization): Promise<void> {
    if (org.planType === 'PRO') return;
    const count = await db.user.count({
      where: { organizationId: org.id, role: 'WORKER' }
    });
    if (count >= org.maxWorkers) {
      throw new BillingError(
        `Worker limit reached (${org.maxWorkers} on ${org.planType} plan). Upgrade to Pro for unlimited workers.`
      );
    }
  }

  async checkPropertyLimit(org: Organization): Promise<void> {
    if (org.maxProperties === -1) return; // unlimited (PRO)
    const count = await db.property.count({
      where: { organizationId: org.id }
    });
    if (count >= org.maxProperties) {
      throw new BillingError(
        `Property limit reached (${org.maxProperties} on ${org.planType} plan). Upgrade to Pro for unlimited properties.`
      );
    }
  }
}

export const billingService: BillingService = new StripeBillingService();

export function computeTrialEndsAt(): Date {
  return new Date(Date.now() + env.BILLING_TRIAL_DAYS * 24 * 60 * 60 * 1000);
}
