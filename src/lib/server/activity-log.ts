import type { ActivityActionType } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { db } from './db';

export async function logActivity(params: {
  organizationId: string;
  userId?: string;
  actionType: ActivityActionType;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await db.activityLog.create({
      data: {
        organizationId: params.organizationId,
        userId: params.userId ?? null,
        actionType: params.actionType,
        entityType: params.entityType,
        entityId: params.entityId,
        metadata: params.metadata ? (params.metadata as Prisma.InputJsonValue) : Prisma.DbNull
      }
    });
  } catch (e) {
    // Logging failure must never crash the main flow
    console.error('[SBA:activity-log]', { error: (e as Error).message, params });
  }
}
