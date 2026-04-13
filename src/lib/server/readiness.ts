import { Prisma, type TurnoverStatus, type WorkOrderStatus } from '@prisma/client';
import {
  evaluateTurnoverReadiness,
  parseAcknowledgedExceptionIds,
  type ReadinessAttachment,
  type ReadinessEvaluation,
  type ReadinessItem
} from '$lib/readiness';
import { db } from './db';

export function computeSlaDeadline(params: {
  guestArrivalAt: Date;
  orgOffsetHours: number;
  propertyOffsetHours?: number | null;
}): { deadline: Date; offsetHours: number; source: 'property' | 'organization' } {
  const offsetHours = params.propertyOffsetHours ?? params.orgOffsetHours ?? 0;
  const deadline = new Date(params.guestArrivalAt.getTime() - offsetHours * 60 * 60 * 1000);
  const source =
    params.propertyOffsetHours !== null && params.propertyOffsetHours !== undefined
      ? 'property'
      : 'organization';
  return { deadline, offsetHours, source };
}

export function effectiveVerificationRequired(params: {
  orgRequired: boolean;
  propertyRequired?: boolean | null;
}): boolean {
  if (params.propertyRequired === null || params.propertyRequired === undefined) {
    return params.orgRequired;
  }
  return params.propertyRequired;
}

export async function logReadinessEvent(params: {
  turnoverId: string;
  status: 'NOT_READY' | 'IN_PROGRESS' | 'READY' | 'VERIFIED';
  actorId?: string | null;
  note?: string | null;
}): Promise<void> {
  const last = await db.readinessEvent.findFirst({
    where: { turnoverId: params.turnoverId },
    orderBy: { occurredAt: 'desc' }
  });
  if (last?.status === params.status && last?.note === (params.note ?? null)) return;

  await db.readinessEvent.create({
    data: {
      turnoverId: params.turnoverId,
      status: params.status,
      actorId: params.actorId ?? null,
      note: params.note ?? null
    }
  });
}

type TurnoverTruthPayload = Prisma.TurnoverGetPayload<{
  include: {
    property: true;
    organization: true;
    assignedTo: true;
    exceptionOverrideBy: true;
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

export type TurnoverReadinessSummary = ReadinessEvaluation & {
  acknowledgedIssueTitles: string[];
  acknowledgedExceptionIds: string[];
  unacknowledgedExceptionIds: string[];
  override: {
    active: boolean;
    reason: string | null;
    acknowledgedAt: Date | null;
    acknowledgedByName: string | null;
  };
};

function mapTurnoverItems(turnover: TurnoverTruthPayload): ReadinessItem[] {
  return (turnover.workOrder?.checklistRun?.items ?? []).map((item) => ({
    id: item.id,
    title: item.title,
    status: item.status,
    photoRequired: item.photoRequired,
    notes: item.notes,
    completedAt: item.completedAt,
    attachments: item.attachments.map(
      (attachment): ReadinessAttachment => ({
        id: attachment.id,
        createdAt: attachment.createdAt,
        capturedByName: attachment.capturedByName,
        url: attachment.url,
        filename: attachment.filename,
        mimeType: attachment.mimeType
      })
    )
  }));
}

export function summarizeTurnoverReadiness(
  turnover: Pick<
    TurnoverTruthPayload,
    | 'status'
    | 'guestArrivalAt'
    | 'slaDeadlineAt'
    | 'exceptionOverrideAt'
    | 'exceptionOverrideReason'
    | 'exceptionOverrideItemIds'
  > & {
    exceptionOverrideBy?: { name: string } | null;
    workOrder?: {
      checklistRun?: {
        items: Array<
          ReadinessItem & {
            id?: string;
          }
        >;
      } | null;
    } | null;
  },
  now = new Date()
): TurnoverReadinessSummary {
  const items = turnover.workOrder?.checklistRun?.items ?? [];
  const acknowledgedExceptionIds = parseAcknowledgedExceptionIds(turnover.exceptionOverrideItemIds);
  const evaluation = evaluateTurnoverReadiness({
    status: turnover.status,
    items,
    acknowledgedExceptionIds,
    guestArrivalAt: turnover.guestArrivalAt,
    slaDeadlineAt: turnover.slaDeadlineAt,
    now
  });

  const acknowledgedIssueTitles = items
    .filter(
      (item) => item.status === 'SKIPPED' && item.id && acknowledgedExceptionIds.includes(item.id)
    )
    .map((item) => item.title);
  const unacknowledgedExceptionIds = items
    .filter(
      (item) => item.status === 'SKIPPED' && (!item.id || !acknowledgedExceptionIds.includes(item.id))
    )
    .map((item) => item.id)
    .filter((itemId): itemId is string => Boolean(itemId));

  return {
    ...evaluation,
    acknowledgedIssueTitles,
    acknowledgedExceptionIds,
    unacknowledgedExceptionIds,
    override: {
      active: acknowledgedIssueTitles.length > 0,
      reason: turnover.exceptionOverrideReason ?? null,
      acknowledgedAt: turnover.exceptionOverrideAt ?? null,
      acknowledgedByName: turnover.exceptionOverrideBy?.name ?? null
    }
  };
}

export async function loadTurnoverForTruth(turnoverId: string): Promise<TurnoverTruthPayload | null> {
  return db.turnover.findUnique({
    where: { id: turnoverId },
    include: {
      property: true,
      organization: true,
      assignedTo: true,
      exceptionOverrideBy: true,
      workOrder: {
        include: {
          checklistRun: {
            include: {
              items: {
                include: { attachments: true },
                orderBy: { sortOrder: 'asc' }
              }
            }
          }
        }
      }
    }
  });
}

function getBaseTurnoverStatus(turnover: TurnoverTruthPayload): TurnoverStatus {
  const run = turnover.workOrder?.checklistRun ?? null;
  const items = run?.items ?? [];
  const hasStartedWork =
    Boolean(run?.startedAt) ||
    items.some((item) => item.status !== 'PENDING' || item.attachments.length > 0);

  return hasStartedWork ? 'IN_PROGRESS' : 'NOT_READY';
}

function getWorkOrderStatus(turnover: TurnoverTruthPayload): WorkOrderStatus | null {
  const run = turnover.workOrder?.checklistRun ?? null;
  if (!turnover.workOrder) return null;
  if (!run) return turnover.workOrder.status;

  const hasStartedWork =
    Boolean(run.startedAt) ||
    run.items.some((item) => item.status !== 'PENDING' || item.attachments.length > 0);
  if (!hasStartedWork) return 'PENDING';

  const hasPending = run.items.some((item) => item.status === 'PENDING');
  return hasPending ? 'IN_PROGRESS' : 'COMPLETED';
}

export async function syncTurnoverTruth(turnoverId: string) {
  const turnover = await loadTurnoverForTruth(turnoverId);
  if (!turnover) return null;

  const items = mapTurnoverItems(turnover);
  const mappedTurnover = {
    ...turnover,
    workOrder: turnover.workOrder
      ? {
          ...turnover.workOrder,
          checklistRun: turnover.workOrder.checklistRun
            ? {
                ...turnover.workOrder.checklistRun,
                items
              }
            : null
        }
      : null
  };
  const summary = summarizeTurnoverReadiness(mappedTurnover);

  const nextStatus =
    turnover.status === 'READY' && summary.primaryState === 'NEEDS_SIGN_OFF'
      ? 'READY'
      : turnover.status === 'VERIFIED' && summary.primaryState === 'GUEST_READY_VERIFIED'
        ? 'VERIFIED'
        : getBaseTurnoverStatus(turnover);

  const readinessScore =
    summary.checklist.totalSteps > 0
      ? Math.round((summary.checklist.completedSteps / summary.checklist.totalSteps) * 100)
      : 0;

  const shouldClearOverride = summary.checklist.skippedSteps === 0;

  await db.turnover.update({
    where: { id: turnoverId },
    data: {
      readinessScore,
      status: nextStatus,
      readyAt:
        nextStatus === 'READY'
          ? turnover.readyAt ?? new Date()
          : nextStatus === 'VERIFIED'
            ? turnover.readyAt ?? new Date()
            : null,
      verifiedAt: nextStatus === 'VERIFIED' ? turnover.verifiedAt ?? new Date() : null,
      verifiedById: nextStatus === 'VERIFIED' ? turnover.verifiedById : null,
      exceptionOverrideAt: shouldClearOverride ? null : turnover.exceptionOverrideAt,
      exceptionOverrideById: shouldClearOverride ? null : turnover.exceptionOverrideById,
      exceptionOverrideReason: shouldClearOverride ? null : turnover.exceptionOverrideReason,
      exceptionOverrideItemIds: shouldClearOverride ? Prisma.JsonNull : turnover.exceptionOverrideItemIds ?? Prisma.JsonNull
    }
  });

  const workOrderStatus = getWorkOrderStatus(turnover);
  if (turnover.workOrder && workOrderStatus && workOrderStatus !== turnover.workOrder.status) {
    await db.workOrder.update({
      where: { id: turnover.workOrder.id },
      data: { status: workOrderStatus }
    });
  }

  if (nextStatus !== turnover.status) {
    const note =
      turnover.status === 'READY' || turnover.status === 'VERIFIED'
        ? 'Readiness proof changed after sign-off, so the turnover was reopened.'
        : null;
    await logReadinessEvent({
      turnoverId,
      status: nextStatus,
      note
    });
  }

  return { turnover, summary, nextStatus, readinessScore };
}

function pluralize(label: string, count: number) {
  return `${count} ${label}${count === 1 ? '' : 's'}`;
}

export function buildTransitionErrorMessage(
  summary: TurnoverReadinessSummary,
  target: 'ready' | 'verify'
) {
  const blockers: string[] = [];
  if (summary.checklist.pendingSteps > 0) {
    blockers.push(pluralize('incomplete step', summary.checklist.pendingSteps));
  }
  if (summary.proof.missingRequiredPhotos > 0) {
    blockers.push(pluralize('missing proof photo', summary.proof.missingRequiredPhotos));
  }
  if (summary.unacknowledgedIssueCount > 0) {
    blockers.push(pluralize('open issue', summary.unacknowledgedIssueCount));
  }

  const verb = target === 'ready' ? 'mark this turnover ready' : 'verify this turnover';
  if (blockers.length === 0) return `You can ${verb}.`;
  return `Cannot ${verb} until ${blockers.join(', ')} ${blockers.length === 1 ? 'is' : 'are'} resolved.`;
}
