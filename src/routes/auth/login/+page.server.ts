import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { db } from '$lib/server/db';
import { verifyPassword, signSession, COOKIE_NAME } from '$lib/server/auth';

export const actions: Actions = {
  default: async ({ request, cookies }) => {
    const data = await request.formData();
    const email = (data.get('email') as string)?.toLowerCase().trim();
    const password = data.get('password') as string;

    if (!email || !password) {
      return fail(400, { error: 'Email and password are required', email });
    }

    const user = await db.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      return fail(401, { error: 'Invalid email or password', email });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return fail(401, { error: 'Invalid email or password', email });
    }

    const token = signSession(user.id);
    cookies.set(COOKIE_NAME, token, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    throw redirect(303, '/dashboard');
  }
};
