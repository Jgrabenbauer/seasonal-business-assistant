import type { Prisma } from '@prisma/client';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { evaluateTurnoverReadiness, parseAcknowledgedExceptionIds } from '$lib/readiness';

type DashboardTurnover = Prisma.TurnoverGetPayload<{
  include: {
    property: true;
    assignedTo: true;
    verifiedBy: true;
    workOrder: {
      include: {
        checklistRun: {
          include: {
            items: {
              include: {
                attachments: true;
              };
            };
          };
        };
      };
    };
  };
}>;

export const load: PageServerLoad = async ({ locals }) => {
  const orgId = locals.user!.organizationId;
  const now = new Date();

  const turnovers = await db.turnover.findMany({
    where: { organizationId: orgId },
    orderBy: [{ guestArrivalAt: 'asc' }, { updatedAt: 'desc' }],
    include: {
      property: true,
      assignedTo: true,
      verifiedBy: true,
      workOrder: {
        include: {
          checklistRun: {
            include: {
              items: {
                include: {
                  attachments: true
                },
                orderBy: { sortOrder: 'asc' }
              }
            }
          }
        }
      }
    }
  });

  const groups = {
    overdue: [] as DashboardTurnover[],
    atRisk: [] as DashboardTurnover[],
    needsSignOff: [] as DashboardTurnover[],
    dueToday: [] as DashboardTurnover[],
    verified: [] as DashboardTurnover[],
    onDeck: [] as DashboardTurnover[]
  };
  const summary = {
    overdue: 0,
    atRisk: 0,
    needsSignOff: 0,
    dueToday: 0,
    verified: 0
  };

  for (const turnover of turnovers) {
    const readiness = evaluateTurnoverReadiness({
      status: turnover.status,
      items: turnover.workOrder?.checklistRun?.items ?? [],
      acknowledgedExceptionIds: parseAcknowledgedExceptionIds(turnover.exceptionOverrideItemIds),
      guestArrivalAt: turnover.guestArrivalAt,
      slaDeadlineAt: turnover.slaDeadlineAt,
      now
    });

    if (readiness.overdue) summary.overdue += 1;
    if (readiness.atRisk) summary.atRisk += 1;
    if (readiness.primaryState === 'NEEDS_SIGN_OFF') summary.needsSignOff += 1;
    if (readiness.dueToday) summary.dueToday += 1;
    if (readiness.primaryState === 'GUEST_READY_VERIFIED') summary.verified += 1;

    if (readiness.overdue) {
      groups.overdue.push(turnover);
    } else if (readiness.atRisk) {
      groups.atRisk.push(turnover);
    } else if (readiness.primaryState === 'NEEDS_SIGN_OFF') {
      groups.needsSignOff.push(turnover);
    } else if (readiness.dueToday) {
      groups.dueToday.push(turnover);
    } else if (readiness.primaryState === 'GUEST_READY_VERIFIED') {
      groups.verified.push(turnover);
    } else {
      groups.onDeck.push(turnover);
    }
  }

  const urgentCount = groups.overdue.length + groups.atRisk.length;
  const primaryAction =
    urgentCount > 0
      ? {
          label: urgentCount === 1 ? 'Resolve 1 urgent turnover' : `Resolve ${urgentCount} urgent turnovers`,
          href: groups.overdue[0]
            ? `/dashboard/turnovers/${groups.overdue[0].id}`
            : groups.atRisk[0]
              ? `/dashboard/turnovers/${groups.atRisk[0].id}`
              : '/dashboard/turnovers'
        }
      : groups.needsSignOff.length > 0
        ? {
            label:
              groups.needsSignOff.length === 1
                ? 'Verify 1 ready turnover'
                : `Verify ${groups.needsSignOff.length} ready turnovers`,
            href: `/dashboard/turnovers/${groups.needsSignOff[0].id}`
          }
        : groups.dueToday.length > 0
          ? {
              label:
                groups.dueToday.length === 1
                  ? 'Review 1 arrival today'
                  : `Review ${groups.dueToday.length} arrivals today`,
              href: `/dashboard/turnovers/${groups.dueToday[0].id}`
            }
          : {
              label: 'Schedule Turnover',
              href: '/dashboard/turnovers'
            };

  return { groups, summary, primaryAction };
};
