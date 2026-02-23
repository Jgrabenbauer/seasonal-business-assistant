import { db } from './db';

export function computeSlaDeadline(params: {
  guestArrivalAt: Date;
  orgOffsetHours: number;
  propertyOffsetHours?: number | null;
}): { deadline: Date; offsetHours: number; source: 'property' | 'organization' } {
  const offsetHours = params.propertyOffsetHours ?? params.orgOffsetHours ?? 0;
  const deadline = new Date(params.guestArrivalAt.getTime() - offsetHours * 60 * 60 * 1000);
  const source = params.propertyOffsetHours !== null && params.propertyOffsetHours !== undefined
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
  if (last?.status === params.status) return;

  await db.readinessEvent.create({
    data: {
      turnoverId: params.turnoverId,
      status: params.status,
      actorId: params.actorId ?? null,
      note: params.note ?? null
    }
  });
}
