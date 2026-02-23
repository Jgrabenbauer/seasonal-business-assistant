import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';

export const load: PageServerLoad = async ({ locals }) => {
  const certificates = await db.turnover.findMany({
    where: { organizationId: locals.user!.organizationId, status: 'VERIFIED' },
    orderBy: { verifiedAt: 'desc' },
    include: { property: true, verifiedBy: true }
  });

  return { certificates };
};
