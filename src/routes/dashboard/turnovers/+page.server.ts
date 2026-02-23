import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { parsePaginationParams } from '$lib/utils';
import { logActivity } from '$lib/server/activity-log';
import { computeSlaDeadline, logReadinessEvent } from '$lib/server/readiness';

export const load: PageServerLoad = async ({ locals, url }) => {
  const statusFilter = url.searchParams.get('status') ?? undefined;
  const propertyId = url.searchParams.get('propertyId') ?? undefined;
  const { skip, limit, page } = parsePaginationParams(url, 25);

  const where = {
    organizationId: locals.user!.organizationId,
    ...(statusFilter && { status: statusFilter as never }),
    ...(propertyId && { propertyId })
  };

  const [turnovers, total, properties, templates] = await Promise.all([
    db.turnover.findMany({
      where,
      orderBy: { guestArrivalAt: 'asc' },
      skip,
      take: limit,
      include: { property: true, assignedTo: true }
    }),
    db.turnover.count({ where }),
    db.property.findMany({
      where: { organizationId: locals.user!.organizationId },
      orderBy: { name: 'asc' }
    }),
    db.checklistTemplate.findMany({
      where: { organizationId: locals.user!.organizationId },
      orderBy: { name: 'asc' }
    })
  ]);

  return {
    turnovers,
    properties,
    templates,
    statusFilter,
    propertyId,
    page,
    totalPages: Math.max(1, Math.ceil(total / limit))
  };
};

export const actions: Actions = {
  create: async ({ request, locals }) => {
    const data = await request.formData();
    const title = (data.get('title') as string)?.trim();
    const propertyId = data.get('propertyId') as string;
    const templateId = (data.get('templateId') as string) || null;
    const scheduledStartAt = data.get('scheduledStartAt') as string;
    const guestArrivalAt = data.get('guestArrivalAt') as string;
    const slaDeadlineAt = data.get('slaDeadlineAt') as string;

    if (!title || !propertyId || !guestArrivalAt) {
      return fail(400, { error: 'Title, property, and guest arrival are required' });
    }

    const property = await db.property.findFirst({
      where: { id: propertyId, organizationId: locals.user!.organizationId }
    });
    if (!property) return fail(400, { error: 'Invalid property' });

    const org = await db.organization.findUnique({
      where: { id: locals.user!.organizationId }
    });
    if (!org) return fail(400, { error: 'Organization not found' });

    const arrival = new Date(guestArrivalAt);
    const sla = slaDeadlineAt
      ? new Date(slaDeadlineAt)
      : computeSlaDeadline({
          guestArrivalAt: arrival,
          orgOffsetHours: org.slaDefaultOffsetHours,
          propertyOffsetHours: property.slaOffsetHours
        }).deadline;

    const turnover = await db.$transaction(async (tx) => {
      const createdTurnover = await tx.turnover.create({
        data: {
          title,
          propertyId,
          templateId,
          scheduledStartAt: scheduledStartAt ? new Date(scheduledStartAt) : null,
          guestArrivalAt: arrival,
          slaDeadlineAt: sla,
          organizationId: locals.user!.organizationId,
          createdById: locals.user!.id
        }
      });

      await tx.workOrder.create({
        data: {
          title,
          propertyId,
          templateId,
          scheduledFor: sla,
          organizationId: locals.user!.organizationId,
          createdById: locals.user!.id,
          turnoverId: createdTurnover.id
        }
      });

      return createdTurnover;
    });

    await logReadinessEvent({
      turnoverId: turnover.id,
      status: 'NOT_READY',
      actorId: locals.user!.id
    });

    logActivity({
      organizationId: locals.user!.organizationId,
      userId: locals.user!.id,
      actionType: 'TURNOVER_SCHEDULED',
      entityType: 'Turnover',
      entityId: turnover.id,
      metadata: { title, propertyName: property.name }
    });

    return { success: true };
  }
};
