import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import {
  verifyAndConsumeWorkerToken,
  verifyLegacyWorkerToken
} from '$lib/server/magic-link';
import { db } from '$lib/server/db';
import { logActivity } from '$lib/server/activity-log';
import { logReadinessEvent } from '$lib/server/readiness';

export const load: PageServerLoad = async ({ params }) => {
  let workOrderId: string;
  let isFirstUse = false;

  // Try new DB-backed token first, fall back to legacy pure-JWT token
  try {
    const result = await verifyAndConsumeWorkerToken(params.token);
    workOrderId = result.workOrderId;
    isFirstUse = result.isFirstUse;
  } catch {
    const legacy = verifyLegacyWorkerToken(params.token);
    if (!legacy) throw error(401, 'Invalid or expired link');
    workOrderId = legacy.workOrderId;
    isFirstUse = false; // legacy tokens don't track first use
  }

  const workOrder = await db.workOrder.findUnique({
    where: { id: workOrderId },
    include: {
      property: true,
      checklistRun: {
        include: {
          items: {
            include: { attachments: true },
            orderBy: { sortOrder: 'asc' }
          }
        }
      }
    }
  });
  if (!workOrder) throw error(404, 'Turnover not found');

  // Start run if not started
  if (workOrder.checklistRun && !workOrder.checklistRun.startedAt) {
    await db.checklistRun.update({
      where: { id: workOrder.checklistRun.id },
      data: { startedAt: new Date() }
    });
    await db.workOrder.update({
      where: { id: workOrderId },
      data: { status: 'IN_PROGRESS' }
    });
    if (workOrder.turnoverId) {
      await db.turnover.update({
        where: { id: workOrder.turnoverId },
        data: { status: 'IN_PROGRESS' }
      });
      await logReadinessEvent({
        turnoverId: workOrder.turnoverId,
        status: 'IN_PROGRESS'
      });
    }
    workOrder.checklistRun.startedAt = new Date();
    workOrder.status = 'IN_PROGRESS';
  }

  if (isFirstUse) {
    logActivity({
      organizationId: workOrder.organizationId,
      actionType: 'MAGIC_LINK_USED',
      entityType: 'Turnover',
      entityId: workOrder.turnoverId ?? workOrder.id,
      metadata: { title: workOrder.title }
    });
  }

  const isOverdue =
    workOrder.scheduledFor !== null && new Date() > workOrder.scheduledFor;

  return { workOrder, token: params.token, isOverdue };
};
