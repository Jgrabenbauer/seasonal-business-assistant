import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { COOKIE_NAME } from '$lib/server/auth';

export const actions: Actions = {
  default: async ({ cookies }) => {
    cookies.delete(COOKIE_NAME, { path: '/' });
    throw redirect(303, '/auth/login');
  }
};
