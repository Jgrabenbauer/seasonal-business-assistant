import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { db } from '$lib/server/db';
import { hashPassword, signSession, COOKIE_NAME } from '$lib/server/auth';
import { computeTrialEndsAt } from '$lib/server/billing';
import { slugify } from '$lib/utils';

export const actions: Actions = {
  default: async ({ request, cookies }) => {
    const data = await request.formData();
    const orgName = (data.get('orgName') as string)?.trim();
    const name = (data.get('name') as string)?.trim();
    const email = (data.get('email') as string)?.toLowerCase().trim();
    const password = data.get('password') as string;

    if (!orgName || !name || !email || !password) {
      return fail(400, { error: 'All fields are required', orgName, name, email });
    }
    if (password.length < 8) {
      return fail(400, { error: 'Password must be at least 8 characters', orgName, name, email });
    }

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return fail(409, { error: 'An account with this email already exists', orgName, name, email });
    }

    const slug = slugify(orgName);
    const existingOrg = await db.organization.findUnique({ where: { slug } });
    const finalSlug = existingOrg ? `${slug}-${Date.now()}` : slug;

    const passwordHash = await hashPassword(password);

    const org = await db.organization.create({
      data: {
        name: orgName,
        slug: finalSlug,
        subscriptionStatus: 'TRIAL',
        trialEndsAt: computeTrialEndsAt(),
        users: {
          create: {
            name,
            email,
            passwordHash,
            role: 'MANAGER'
          }
        }
      },
      include: { users: true }
    });

    const manager = org.users[0];
    const token = signSession(manager.id);
    cookies.set(COOKIE_NAME, token, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7
    });

    throw redirect(303, '/dashboard');
  }
};
