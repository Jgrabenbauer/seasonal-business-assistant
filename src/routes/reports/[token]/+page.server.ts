import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { syncTurnoverTruth } from '$lib/server/readiness';

export const load: PageServerLoad = async ({ params }) => {
  const link = await db.shortLink.findUnique({ where: { token: params.token } });
  if (!link || link.purpose !== 'REPORT_LINK') {
    throw error(404, 'Turnover readiness report not found');
  }
  if (link.expiresAt && new Date() > link.expiresAt) {
    throw error(410, 'Turnover readiness report link expired');
  }

  await syncTurnoverTruth(link.target);

  const turnover = await db.turnover.findUnique({
    where: { id: link.target },
    include: {
      organization: true,
      property: true,
      assignedTo: true,
      verifiedBy: true,
      exceptionOverrideBy: true,
      readinessHistory: { orderBy: { occurredAt: 'desc' }, include: { actor: true } },
      workOrder: {
        include: {
          checklistRun: {
            include: { items: { include: { attachments: true }, orderBy: { sortOrder: 'asc' } } }
          }
        }
      }
    }
  });
  if (!turnover) throw error(404, 'Turnover not found');

  return { turnover };
};
