import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { createInvite, sendInviteEmail } from '$lib/server/invites';
import { billingService } from '$lib/server/billing';
import { BillingError } from '$lib/server/errors';
import { logActivity } from '$lib/server/activity-log';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
  if (locals.user!.role !== 'MANAGER') {
    throw redirect(303, '/dashboard');
  }
  const invites = await db.inviteToken.findMany({
    where: { organizationId: locals.user!.organizationId },
    orderBy: { createdAt: 'desc' }
  });
  return { invites };
};

export const actions: Actions = {
  create: async ({ request, locals, url }) => {
    if (locals.user!.role !== 'MANAGER') {
      return fail(403, { error: 'Only managers can invite' });
    }
    const data = await request.formData();
    const email = (data.get('email') as string)?.trim().toLowerCase();
    const role = (data.get('role') as string) as 'WORKER' | 'SUPERVISOR';
    if (!email) return fail(400, { error: 'Email is required' });
    if (!role) return fail(400, { error: 'Role is required' });

    if (role === 'WORKER') {
      try {
        await billingService.checkWorkerLimit(locals.user!.organization);
      } catch (e) {
        if (e instanceof BillingError) {
          return fail(402, { error: e.message });
        }
        throw e;
      }
    }

    const invite = await createInvite({ organizationId: locals.user!.organizationId, email, role }, url);
    logActivity({
      organizationId: locals.user!.organizationId,
      userId: locals.user!.id,
      actionType: 'INVITE_SENT',
      entityType: 'InviteToken',
      entityId: invite.id,
      metadata: { email, role }
    });
    return { success: true };
  },
  resend: async ({ request, locals, url }) => {
    if (locals.user!.role !== 'MANAGER') {
      return fail(403, { error: 'Only managers can invite' });
    }
    const data = await request.formData();
    const inviteId = data.get('inviteId') as string;
    const invite = await db.inviteToken.findFirst({
      where: { id: inviteId, organizationId: locals.user!.organizationId }
    });
    if (!invite) return fail(404, { error: 'Invite not found' });
    const updated = await db.inviteToken.update({
      where: { id: invite.id },
      data: { status: 'PENDING', expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
    });
    await sendInviteEmail(updated.email, updated.role, updated.token, url);
    return { success: true };
  },
  revoke: async ({ request, locals }) => {
    if (locals.user!.role !== 'MANAGER') {
      return fail(403, { error: 'Only managers can invite' });
    }
    const data = await request.formData();
    const inviteId = data.get('inviteId') as string;
    const res = await db.inviteToken.updateMany({
      where: { id: inviteId, organizationId: locals.user!.organizationId },
      data: { status: 'REVOKED' }
    });
    if (res.count > 0) {
      logActivity({
        organizationId: locals.user!.organizationId,
        userId: locals.user!.id,
        actionType: 'INVITE_REVOKED',
        entityType: 'InviteToken',
        entityId: inviteId,
        metadata: {}
      });
    }
    return { success: true };
  }
};
