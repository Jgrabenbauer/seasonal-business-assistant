import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { parsePaginationParams } from '$lib/utils';

export const load: PageServerLoad = async ({ locals, url }) => {
  const statusFilter = url.searchParams.get('status') ?? '';
  const propertyId = url.searchParams.get('propertyId') ?? '';
  parsePaginationParams(url, 25);

  const params = new URLSearchParams();
  if (statusFilter) params.set('status', statusFilter);
  if (propertyId) params.set('propertyId', propertyId);
  throw redirect(303, `/dashboard/turnovers${params.toString() ? `?${params.toString()}` : ''}`);
};

export const actions: Actions = {
  create: async () => {
    throw redirect(303, '/dashboard/turnovers');
  }
};
