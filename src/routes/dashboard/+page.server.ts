import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';

export const load: PageServerLoad = async ({ locals }) => {
  const orgId = locals.user!.organizationId;
  const now = new Date();

  const turnovers = await db.turnover.findMany({
    where: { organizationId: orgId },
    orderBy: [{ guestArrivalAt: 'asc' }, { updatedAt: 'desc' }],
    include: { property: true, assignedTo: true }
  });

  const columns = {
    upcoming: [] as typeof turnovers,
    inProgress: [] as typeof turnovers,
    ready: [] as typeof turnovers,
    overdue: [] as typeof turnovers,
    verified: [] as typeof turnovers
  };

  for (const turnover of turnovers) {
    const isOverdue =
      turnover.slaDeadlineAt && turnover.slaDeadlineAt.getTime() < now.getTime() &&
      !['READY', 'VERIFIED'].includes(turnover.status);
    if (turnover.status === 'VERIFIED') {
      columns.verified.push(turnover);
    } else if (turnover.status === 'READY') {
      columns.ready.push(turnover);
    } else if (isOverdue) {
      columns.overdue.push(turnover);
    } else if (turnover.status === 'IN_PROGRESS') {
      columns.inProgress.push(turnover);
    } else {
      columns.upcoming.push(turnover);
    }
  }

  return { columns };
};
