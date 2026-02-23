import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';

export const load: PageServerLoad = async ({ params, locals }) => {
  const workOrder = await db.workOrder.findFirst({
    where: { id: params.id, organizationId: locals.user!.organizationId },
    select: { turnoverId: true }
  });
  if (workOrder?.turnoverId) {
    throw redirect(303, `/dashboard/turnovers/${workOrder.turnoverId}`);
  }

  throw redirect(303, '/dashboard/turnovers');
};

export const actions: Actions = {
  assign: async () => {
    throw redirect(303, '/dashboard/turnovers');
  },
  send_link: async () => {
    throw redirect(303, '/dashboard/turnovers');
  },
  export_pdf: async () => {
    throw redirect(303, '/dashboard/turnovers');
  },
  send_external: async () => {
    throw redirect(303, '/dashboard/turnovers');
  }
};
