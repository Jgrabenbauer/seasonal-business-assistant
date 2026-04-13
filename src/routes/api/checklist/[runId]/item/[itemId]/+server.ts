import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { apiError } from '$lib/server/errors';
import { logActivity } from '$lib/server/activity-log';
import { syncTurnoverTruth } from '$lib/server/readiness';

export const PATCH: RequestHandler = async ({ params, request }) => {
  try {
    const body = await request.json();
    const { status, notes } = body;

    const validStatuses = ['PENDING', 'COMPLETED', 'SKIPPED'];
    if (!validStatuses.includes(status)) {
      return json({ ok: false, error: 'Invalid status', code: 'VALIDATION_ERROR' }, { status: 400 });
    }

    let item;
    try {
      item = await db.checklistItemRun.update({
        where: { id: params.itemId, runId: params.runId },
        data: {
          status,
          notes: notes ?? undefined,
          completedAt: status === 'COMPLETED' ? new Date() : null
        },
        include: { run: { include: { workOrder: true } } }
      });
    } catch {
      return json({ ok: false, error: 'Item not found', code: 'NOT_FOUND' }, { status: 404 });
    }

    const workOrder = item.run.workOrder;

    if (status === 'COMPLETED') {
      logActivity({
        organizationId: workOrder.organizationId,
        actionType: 'READINESS_STEP_COMPLETED',
        entityType: 'ChecklistItemRun',
        entityId: params.itemId,
        metadata: { title: item.title, workOrderId: workOrder.id }
      });
    }

    const run = await db.checklistRun.findUnique({
      where: { id: params.runId },
      include: { items: true }
    });

    const allDone = run ? run.items.every((i) => i.status !== 'PENDING') : false;
    if (run) {
      await db.checklistRun.update({
        where: { id: params.runId },
        data: { completedAt: allDone ? new Date() : null }
      });
    }

    if (workOrder.turnoverId) {
      await syncTurnoverTruth(workOrder.turnoverId);
    }

    return json({ ok: true, item });
  } catch (e) {
    return apiError(e);
  }
};
