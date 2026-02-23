import type { Organization } from '@prisma/client';
import { BillingError } from './errors';

export function requirePro(org: Organization, feature: string) {
  if (org.planType !== 'PRO') {
    throw new BillingError(`${feature} is available on Pro. Upgrade to unlock.`);
  }
}
