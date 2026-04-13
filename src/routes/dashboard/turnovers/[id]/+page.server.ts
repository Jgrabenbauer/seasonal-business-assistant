import { error, fail, redirect } from '@sveltejs/kit';
import { Prisma } from '@prisma/client';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { createWorkerToken } from '$lib/server/magic-link';
import { queueSms } from '$lib/server/sms/service';
import { generatePdf } from '$lib/server/pdf';
import { logActivity } from '$lib/server/activity-log';
import { env } from '$lib/server/env';
import { resolveBaseUrl } from '$lib/server/base-url';
import { createShortLink } from '$lib/server/short-links';
import { requirePro } from '$lib/server/feature-gate';
import { getOrCreateReportLink, renderCompletionEmail } from '$lib/server/reports';
import { queueEmail } from '$lib/server/email/service';
import {
  buildTransitionErrorMessage,
  computeSlaDeadline,
  loadTurnoverForTruth,
  logReadinessEvent,
  summarizeTurnoverReadiness,
  syncTurnoverTruth,
  type TurnoverReadinessSummary
} from '$lib/server/readiness';

function parseOverrideReason(formData: FormData) {
  return (formData.get('overrideReason') as string | null)?.trim() ?? '';
}

function clearOverrideData() {
  return {
    exceptionOverrideAt: null,
    exceptionOverrideById: null,
    exceptionOverrideReason: null,
    exceptionOverrideItemIds: Prisma.JsonNull
  };
}

function buildOverrideData(
  summary: TurnoverReadinessSummary,
  actorId: string,
  reason: string
) {
  return {
    exceptionOverrideAt: new Date(),
    exceptionOverrideById: actorId,
    exceptionOverrideReason: reason,
    exceptionOverrideItemIds: summary.unacknowledgedExceptionIds
  };
}

async function getManagedTurnoverSummary(turnoverId: string, organizationId: string) {
  const turnover = await loadTurnoverForTruth(turnoverId);
  if (!turnover || turnover.organizationId !== organizationId) return null;
  return {
    turnover,
    summary: summarizeTurnoverReadiness(turnover)
  };
}

export const load: PageServerLoad = async ({ params, locals, url }) => {
  const authorizedTurnover = await db.turnover.findFirst({
    where: { id: params.id, organizationId: locals.user!.organizationId },
    select: { id: true }
  });
  if (!authorizedTurnover) throw error(404, 'Turnover not found');

  await syncTurnoverTruth(authorizedTurnover.id);

  const turnover = await db.turnover.findFirst({
    where: { id: params.id, organizationId: locals.user!.organizationId },
    include: {
      organization: true,
      property: true,
      assignedTo: true,
      createdBy: true,
      verifiedBy: true,
      exceptionOverrideBy: true,
      readinessHistory: { orderBy: { occurredAt: 'desc' }, include: { actor: true } },
      template: { include: { items: { orderBy: { sortOrder: 'asc' } } } },
      workOrder: {
        include: {
          checklistRun: {
            include: {
              items: { include: { attachments: true }, orderBy: { sortOrder: 'asc' } }
            }
          }
        }
      }
    }
  });
  if (!turnover) throw error(404, 'Turnover not found');

  const workers = await db.user.findMany({
    where: { organizationId: locals.user!.organizationId, role: 'WORKER' }
  });
  const [activityEntries, smsUpdates] = await Promise.all([
    db.activityLog.findMany({
      where: {
        organizationId: locals.user!.organizationId,
        entityId: params.id
      },
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: {
        user: {
          select: {
            name: true,
            role: true
          }
        }
      }
    }),
    db.smsMessage.findMany({
      where: {
        organizationId: locals.user!.organizationId,
        OR: [
          { body: { contains: turnover.title } },
          { body: { contains: turnover.property.name } }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 6
    })
  ]);

  const baseUrl = resolveBaseUrl(url);
  const magicLink = turnover.workOrder?.magicToken
    ? `${baseUrl}/w/${turnover.workOrder.magicToken}`
    : null;
  let shortLink: string | null = null;
  if (magicLink) {
    const existing = await db.shortLink.findFirst({
      where: {
        organizationId: locals.user!.organizationId,
        purpose: 'WORKER_MAGIC_LINK',
        target: magicLink,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }]
      },
      orderBy: { createdAt: 'desc' }
    });
    shortLink = existing ? `${baseUrl}/s/${existing.token}` : null;
    if (!shortLink) {
      const created = await createShortLink({
        organizationId: locals.user!.organizationId,
        purpose: 'WORKER_MAGIC_LINK',
        target: magicLink,
        expiresAt: turnover.workOrder?.tokenExpiresAt ?? null,
        baseUrl
      });
      shortLink = created.url;
    }
  }

  const readiness = summarizeTurnoverReadiness(turnover);
  const readinessScore =
    readiness.checklist.totalSteps > 0
      ? Math.round((readiness.checklist.completedSteps / readiness.checklist.totalSteps) * 100)
      : 0;

  const effective = computeSlaDeadline({
    guestArrivalAt: turnover.guestArrivalAt,
    orgOffsetHours: turnover.organization.slaDefaultOffsetHours,
    propertyOffsetHours: turnover.property.slaOffsetHours
  });

  const reportUrl =
    turnover.status === 'VERIFIED' ? await getOrCreateReportLink(turnover.id, baseUrl) : null;

  return {
    turnover,
    workers,
    magicLink,
    shortLink,
    reportUrl,
    activityEntries,
    smsUpdates,
    readiness,
    readinessScore,
    slaSource: effective.source,
    slaOffsetHours: effective.offsetHours
  };
};

export const actions: Actions = {
  assign: async ({ request, locals, params, url }) => {
    const data = await request.formData();
    const workerId = data.get('workerId') as string;
    if (!workerId) return fail(400, { error: 'Please select a worker' });

    const worker = await db.user.findUnique({ where: { id: workerId } });
    if (!worker?.phone) return fail(400, { error: 'Worker has no phone number' });

    const turnover = await db.turnover.findFirst({
      where: { id: params.id, organizationId: locals.user!.organizationId },
      include: {
        workOrder: true,
        template: { include: { items: { orderBy: { sortOrder: 'asc' } } } }
      }
    });
    if (!turnover || !turnover.workOrder) return fail(404, { error: 'Turnover not found' });

    const token = await createWorkerToken(turnover.workOrder.id);
    const expiresAt = new Date(Date.now() + env.MAGIC_LINK_EXPIRY_HOURS * 60 * 60 * 1000);

    await db.$transaction(async (tx) => {
      await tx.turnover.update({
        where: { id: params.id },
        data: { assignedToId: workerId, status: 'IN_PROGRESS' }
      });
      await tx.workOrder.update({
        where: { id: turnover.workOrder!.id },
        data: { assignedToId: workerId, magicToken: token, tokenExpiresAt: expiresAt }
      });

      const existingRun = await tx.checklistRun.findUnique({
        where: { workOrderId: turnover.workOrder!.id }
      });
      if (!existingRun && turnover.template) {
        await tx.checklistRun.create({
          data: {
            workOrderId: turnover.workOrder!.id,
            items: {
              create: turnover.template.items.map((i) => ({
                title: i.title,
                description: i.description,
                photoRequired: i.photoRequired,
                sortOrder: i.sortOrder
              }))
            }
          }
        });
      }
    });

    const baseUrl = resolveBaseUrl(url);
    const longLink = `${baseUrl}/w/${token}`;
    const shortLink = await createShortLink({
      organizationId: locals.user!.organizationId,
      purpose: 'WORKER_MAGIC_LINK',
      target: longLink,
      expiresAt,
      baseUrl
    });
    const link = shortLink.url;
    if (locals.user!.organization.smsEnabled && worker.smsOptIn) {
      await queueSms({
        to: worker.phone,
        body: `Hi ${worker.name}! New turnover scheduled: ${turnover.title}. Open readiness steps: ${link}`,
        orgId: locals.user!.organizationId
      });
    }

    logActivity({
      organizationId: locals.user!.organizationId,
      userId: locals.user!.id,
      actionType: 'TURNOVER_ASSIGNED',
      entityType: 'Turnover',
      entityId: params.id,
      metadata: { workerName: worker.name, title: turnover.title }
    });

    await logReadinessEvent({
      turnoverId: params.id,
      status: 'IN_PROGRESS',
      actorId: locals.user!.id
    });

    throw redirect(303, `/dashboard/turnovers/${params.id}`);
  },

  send_link: async ({ locals, params, url }) => {
    const turnover = await db.turnover.findFirst({
      where: { id: params.id, organizationId: locals.user!.organizationId },
      include: { workOrder: { include: { assignedTo: true } } }
    });
    if (!turnover?.workOrder?.assignedTo?.phone || !turnover.workOrder.magicToken) {
      return fail(400, { error: 'No worker assigned or no magic link generated' });
    }

    const baseUrl = resolveBaseUrl(url);
    const longLink = `${baseUrl}/w/${turnover.workOrder.magicToken}`;
    const shortLink = await createShortLink({
      organizationId: locals.user!.organizationId,
      purpose: 'WORKER_MAGIC_LINK',
      target: longLink,
      expiresAt: turnover.workOrder.tokenExpiresAt,
      baseUrl
    });
    const link = shortLink.url;
    if (locals.user!.organization.smsEnabled && turnover.workOrder.assignedTo.smsOptIn) {
      await queueSms({
        to: turnover.workOrder.assignedTo.phone,
        body: `Reminder: ${turnover.title}. Your readiness steps: ${link}`,
        orgId: locals.user!.organizationId
      });
    }

    logActivity({
      organizationId: locals.user!.organizationId,
      userId: locals.user!.id,
      actionType: 'MAGIC_LINK_SENT',
      entityType: 'Turnover',
      entityId: params.id,
      metadata: { title: turnover.title, workerName: turnover.workOrder.assignedTo.name }
    });

    return { sent: true };
  },

  mark_ready: async ({ locals, params }) => {
    if (locals.user!.role === 'WORKER') {
      return fail(403, { error: 'Only managers or supervisors can mark a turnover ready' });
    }

    const result = await getManagedTurnoverSummary(params.id, locals.user!.organizationId);
    if (!result) return fail(404, { error: 'Turnover not found' });
    const { turnover, summary } = result;

    if (!summary.canMarkReady) {
      return fail(400, { error: buildTransitionErrorMessage(summary, 'ready') });
    }

    await db.turnover.update({
      where: { id: params.id },
      data: {
        status: 'READY',
        readyAt: new Date(),
        verifiedAt: null,
        verifiedById: null,
        ...(summary.checklist.skippedSteps === 0 ? clearOverrideData() : {})
      }
    });

    await logReadinessEvent({
      turnoverId: params.id,
      status: 'READY',
      actorId: locals.user!.id,
      note: 'Checklist proof reviewed and promoted for manager sign-off.'
    });

    logActivity({
      organizationId: locals.user!.organizationId,
      userId: locals.user!.id,
      actionType: 'TURNOVER_READY',
      entityType: 'Turnover',
      entityId: params.id,
      metadata: { title: turnover.title, overrideUsed: false }
    });

    return { markedReady: true };
  },

  mark_ready_override: async ({ locals, params, request }) => {
    if (locals.user!.role === 'WORKER') {
      return fail(403, { error: 'Only managers or supervisors can acknowledge exceptions' });
    }

    const formData = await request.formData();
    const overrideReason = parseOverrideReason(formData);
    if (overrideReason.length < 8) {
      return fail(400, { error: 'Enter a short reason before acknowledging open issues.' });
    }

    const result = await getManagedTurnoverSummary(params.id, locals.user!.organizationId);
    if (!result) return fail(404, { error: 'Turnover not found' });
    const { turnover, summary } = result;

    if (summary.hardBlockerCount > 0) {
      return fail(400, { error: buildTransitionErrorMessage(summary, 'ready') });
    }
    if (summary.unacknowledgedIssueCount === 0) {
      return fail(400, { error: 'There are no open issues to acknowledge.' });
    }

    await db.turnover.update({
      where: { id: params.id },
      data: {
        status: 'READY',
        readyAt: new Date(),
        verifiedAt: null,
        verifiedById: null,
        ...buildOverrideData(summary, locals.user!.id, overrideReason)
      }
    });

    await logReadinessEvent({
      turnoverId: params.id,
      status: 'READY',
      actorId: locals.user!.id,
      note: `Exceptions acknowledged for sign-off: ${overrideReason}`
    });

    logActivity({
      organizationId: locals.user!.organizationId,
      userId: locals.user!.id,
      actionType: 'TURNOVER_READY',
      entityType: 'Turnover',
      entityId: params.id,
      metadata: {
        title: turnover.title,
        overrideUsed: true,
        overrideReason,
        acknowledgedIssues: summary.unacknowledgedExceptionIds
      }
    });

    return { markedReady: true };
  },

  verify: async ({ locals, params, request }) => {
    if (locals.user!.role === 'WORKER') {
      return fail(403, { error: 'Only managers or supervisors can verify' });
    }

    const formData = await request.formData();
    if (formData.get('confirmVerification') !== 'on') {
      return fail(400, { error: 'Confirm that you reviewed the proof before verifying.' });
    }

    const result = await getManagedTurnoverSummary(params.id, locals.user!.organizationId);
    if (!result) return fail(404, { error: 'Turnover not found' });
    const { turnover, summary } = result;

    if (turnover.status !== 'READY') {
      return fail(400, { error: 'Mark this turnover ready before verifying it.' });
    }
    if (!summary.canVerify) {
      return fail(400, { error: buildTransitionErrorMessage(summary, 'verify') });
    }

    await db.turnover.update({
      where: { id: params.id },
      data: {
        status: 'VERIFIED',
        readyAt: turnover.readyAt ?? new Date(),
        verifiedAt: new Date(),
        verifiedById: locals.user!.id
      }
    });

    logActivity({
      organizationId: locals.user!.organizationId,
      userId: locals.user!.id,
      actionType: 'TURNOVER_VERIFIED',
      entityType: 'Turnover',
      entityId: params.id,
      metadata: { title: turnover.title }
    });

    await logReadinessEvent({
      turnoverId: params.id,
      status: 'VERIFIED',
      actorId: locals.user!.id,
      note: `Verified by ${locals.user!.name}.`
    });

    return { verified: true };
  },

  export_pdf: async ({ locals, params, url }) => {
    await syncTurnoverTruth(params.id);
    const turnover = await db.turnover.findFirst({
      where: { id: params.id, organizationId: locals.user!.organizationId },
      include: {
        property: true,
        organization: true,
        verifiedBy: true,
        exceptionOverrideBy: true,
        workOrder: {
          include: {
            checklistRun: {
              include: {
                items: { include: { attachments: true }, orderBy: { sortOrder: 'asc' } }
              }
            }
          }
        }
      }
    });
    if (!turnover) return fail(404, { error: 'Turnover not found' });

    const readinessEvents = await db.readinessEvent.findMany({
      where: { turnoverId: turnover.id },
      orderBy: { occurredAt: 'desc' },
      take: 5,
      include: { actor: true }
    });

    const baseUrl = resolveBaseUrl(url);
    const pdfBytes = await generatePdf(
      turnover,
      turnover.organization,
      readinessEvents.map((e) => ({ ...e, actorName: e.actor?.name ?? null })),
      { baseUrl, maxPhotos: 12 }
    );
    const base64 = Buffer.from(pdfBytes).toString('base64');
    return { pdfBase64: base64, filename: `turnover-readiness-report-${params.id}.pdf` };
  },

  send_external: async ({ locals, params, request, url }) => {
    if (locals.user!.role !== 'MANAGER') {
      return fail(403, { error: 'Only managers can send external notifications' });
    }
    try {
      requirePro(locals.user!.organization, 'External notifications');
    } catch (e) {
      if (e instanceof Error) {
        return fail(402, { error: e.message });
      }
      throw e;
    }

    const data = await request.formData();
    const email = (data.get('email') as string)?.trim();
    const sms = (data.get('sms') as string)?.trim();
    if (!email) return fail(400, { error: 'Email is required' });

    await syncTurnoverTruth(params.id);

    const turnover = await db.turnover.findFirst({
      where: { id: params.id, organizationId: locals.user!.organizationId },
      include: {
        organization: true,
        property: true,
        verifiedBy: true,
        exceptionOverrideBy: true,
        workOrder: { include: { checklistRun: { include: { items: { include: { attachments: true } } } } } }
      }
    });
    if (!turnover || turnover.status !== 'VERIFIED') {
      return fail(400, { error: 'Turnover must be verified before sending' });
    }

    const reportUrl = await getOrCreateReportLink(turnover.id, url);
    const checklistSummary =
      turnover.workOrder?.checklistRun?.items.map((item) => ({
        title: item.title,
        status: item.status
      })) ?? [];
    const photoUrls =
      turnover.workOrder?.checklistRun?.items.flatMap((item) =>
        item.attachments.map((a) => a.url)
      ) ?? [];

    const html = renderCompletionEmail({
      orgName: turnover.organization.brandName ?? turnover.organization.name,
      brandAccentColor: turnover.organization.brandAccentColor,
      brandLogoUrl: turnover.organization.brandLogoUrl,
      brandContactInfo: turnover.organization.brandContactInfo,
      propertyName: turnover.property.name,
      workOrderTitle: turnover.title,
      completedAt: turnover.verifiedAt,
      checklistSummary,
      photoUrls,
      reportUrl
    });

    await queueEmail({
      to: email,
      subject: `Turnover readiness report — ${turnover.property.name}`,
      html,
      text: `Turnover ${turnover.title} is verified. View the turnover readiness report: ${reportUrl}`
    });

    if (sms && locals.user!.organization.smsEnabled) {
      await queueSms({
        to: sms,
        body: `Owner update: ${turnover.title} has verified turnover proof. Report: ${reportUrl}`,
        orgId: locals.user!.organizationId
      });
    }

    return { sentExternal: true };
  }
};
