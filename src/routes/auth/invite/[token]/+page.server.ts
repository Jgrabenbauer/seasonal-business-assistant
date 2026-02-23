import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { hashPassword, signSession, COOKIE_NAME } from '$lib/server/auth';

export const load: PageServerLoad = async ({ params }) => {
  const invite = await db.inviteToken.findUnique({ where: { token: params.token } });
  if (!invite || invite.status !== 'PENDING' || invite.expiresAt < new Date()) {
    return { invite: null };
  }
  return { invite };
};

export const actions: Actions = {
  accept: async ({ request, params, cookies }) => {
    const invite = await db.inviteToken.findUnique({ where: { token: params.token } });
    if (!invite || invite.status !== 'PENDING' || invite.expiresAt < new Date()) {
      return fail(400, { error: 'Invite expired or invalid' });
    }

    const data = await request.formData();
    const name = (data.get('name') as string)?.trim();
    const phone = (data.get('phone') as string)?.trim() || null;
    const password = (data.get('password') as string) || null;

    if (!name) return fail(400, { error: 'Name is required' });

    let passwordHash: string | null = null;
    if (invite.role !== 'WORKER') {
      if (!password || password.length < 8) {
        return fail(400, { error: 'Password must be at least 8 characters' });
      }
      passwordHash = await hashPassword(password);
    }

    const user = await db.user.create({
      data: {
        organizationId: invite.organizationId,
        name,
        email: invite.email,
        phone,
        role: invite.role,
        passwordHash
      }
    });

    await db.inviteToken.update({
      where: { id: invite.id },
      data: { status: 'ACCEPTED', acceptedAt: new Date() }
    });

    if (invite.role !== 'WORKER') {
      const token = signSession(user.id);
      cookies.set(COOKIE_NAME, token, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7
      });
      throw redirect(303, '/dashboard');
    }

    return { success: true };
  }
};
