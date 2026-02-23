import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { requirePro } from '$lib/server/feature-gate';
import { BillingError } from '$lib/server/errors';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
  try {
    requirePro(locals.user!.organization, 'Analytics dashboard');
  } catch (e) {
    if (e instanceof BillingError) {
      throw redirect(303, '/dashboard/billing');
    }
    throw e;
  }

  const orgId = locals.user!.organizationId;
  const avgTimeToReady = await db.$queryRaw<
    { avg_minutes: number | null }[]
  >`SELECT AVG(EXTRACT(EPOCH FROM ("readyAt" - COALESCE("scheduledStartAt","createdAt")))/60) AS avg_minutes
     FROM "Turnover"
     WHERE "organizationId" = ${orgId}
       AND "readyAt" IS NOT NULL`;

  const onTime = await db.$queryRaw<{ total: number; on_time: number }[]>
    `SELECT COUNT(*) FILTER (WHERE "readyAt" IS NOT NULL)::int AS total,
            COUNT(*) FILTER (WHERE "readyAt" <= "guestArrivalAt")::int AS on_time
     FROM "Turnover"
     WHERE "organizationId" = ${orgId}`;

  const missedItems = await db.$queryRaw<
    { avg_missed: number | null }[]
  >`SELECT AVG(skipped_count)::float AS avg_missed
     FROM (
       SELECT COUNT(*) FILTER (WHERE "ChecklistItemRun"."status" = 'SKIPPED') AS skipped_count
       FROM "Turnover"
       JOIN "WorkOrder" ON "WorkOrder"."turnoverId" = "Turnover"."id"
       JOIN "ChecklistRun" ON "ChecklistRun"."workOrderId" = "WorkOrder"."id"
       JOIN "ChecklistItemRun" ON "ChecklistItemRun"."runId" = "ChecklistRun"."id"
       WHERE "Turnover"."organizationId" = ${orgId}
       GROUP BY "Turnover"."id"
     ) t`;

  const repeatIssues = await db.$queryRaw<
    { title: string; count: number }[]
  >`SELECT "ChecklistItemRun"."title", COUNT(*)::int AS count
     FROM "ChecklistItemRun"
     JOIN "ChecklistRun" ON "ChecklistItemRun"."runId" = "ChecklistRun"."id"
     JOIN "WorkOrder" ON "ChecklistRun"."workOrderId" = "WorkOrder"."id"
     JOIN "Turnover" ON "WorkOrder"."turnoverId" = "Turnover"."id"
     WHERE "Turnover"."organizationId" = ${orgId}
       AND "ChecklistItemRun"."status" = 'SKIPPED'
     GROUP BY "ChecklistItemRun"."title"
     HAVING COUNT(*) > 1
     ORDER BY count DESC
     LIMIT 10`;

  const workerConsistency = await db.$queryRaw<
    { name: string; score: number }[]
  >`SELECT "User"."name",
           ROUND(100.0 * SUM(CASE WHEN "Turnover"."readyAt" <= "Turnover"."guestArrivalAt" THEN 1 ELSE 0 END) / NULLIF(COUNT(*),0))::int AS score
     FROM "Turnover"
     JOIN "User" ON "Turnover"."assignedToId" = "User"."id"
     WHERE "Turnover"."organizationId" = ${orgId}
       AND "Turnover"."readyAt" IS NOT NULL
     GROUP BY "User"."name"
     ORDER BY score DESC
     LIMIT 10`;

  return {
    avgTimeToReadyMinutes: avgTimeToReady[0]?.avg_minutes ?? null,
    onTime: onTime[0] ?? { total: 0, on_time: 0 },
    avgMissedItems: missedItems[0]?.avg_missed ?? null,
    repeatIssues,
    workerConsistency
  };
};
