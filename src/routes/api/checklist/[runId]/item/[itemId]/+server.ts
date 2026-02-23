import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { apiError } from '$lib/server/errors';
import { logActivity } from '$lib/server/activity-log';
import { effectiveVerificationRequired, logReadinessEvent } from '$lib/server/readiness';

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

    // Check if all items done → auto-complete run
    const run = await db.checklistRun.findUnique({
      where: { id: params.runId },
      include: { items: true }
    });

    const allDone = run ? run.items.every((i) => i.status !== 'PENDING') : false;
    if (run && allDone) {
      await db.checklistRun.update({
        where: { id: params.runId },
        data: { completedAt: new Date() }
      });
      await db.workOrder.update({
        where: { id: run.workOrderId },
        data: { status: 'COMPLETED' }
      });

      if (workOrder.turnoverId) {
        logActivity({
          organizationId: workOrder.organizationId,
          actionType: 'TURNOVER_READY',
          entityType: 'Turnover',
          entityId: workOrder.turnoverId,
          metadata: { title: workOrder.title }
        });
      }
    }

    if (workOrder.turnoverId) {
      const completed = run?.items.filter((i) => i.status === 'COMPLETED').length ?? 0;
      const total = run?.items.length ?? 0;
      const readinessScore = total > 0 ? Math.round((completed / total) * 100) : 0;
      const turnover = await db.turnover.findUnique({
        where: { id: workOrder.turnoverId },
        include: { property: true, organization: true }
      });
      if (turnover) {
        const requiresVerification = effectiveVerificationRequired({
          orgRequired: turnover.organization.verificationRequired,
          propertyRequired: turnover.property.verificationRequired
        });
        const status = allDone ? (requiresVerification ? 'READY' : 'VERIFIED') : 'IN_PROGRESS';
        await db.turnover.update({
          where: { id: workOrder.turnoverId },
          data: {
            readinessScore,
            status,
            readyAt: allDone ? new Date() : undefined,
            verifiedAt: allDone && !requiresVerification ? new Date() : undefined
          }
        });
        if (allDone) {
          await logReadinessEvent({
            turnoverId: workOrder.turnoverId,
            status: requiresVerification ? 'READY' : 'VERIFIED'
          });
          if (!requiresVerification) {
            logActivity({
              organizationId: workOrder.organizationId,
              actionType: 'TURNOVER_VERIFIED',
              entityType: 'Turnover',
              entityId: workOrder.turnoverId,
              metadata: { title: workOrder.title }
            });
          }
        }
      }
    }

    return json({ ok: true, item });
  } catch (e) {
    return apiError(e);
  }
};
