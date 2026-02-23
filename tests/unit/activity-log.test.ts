import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('$lib/server/env', () => ({
  env: {
    DATABASE_URL: 'postgresql://test',
    SESSION_SECRET: 'test-secret-at-least-32-chars-long!!',
    MAGIC_LINK_SECRET: 'test-magic-secret-at-least-32-chars!',
    NODE_ENV: 'test',
    MAGIC_LINK_EXPIRY_HOURS: 48,
    SMS_PROVIDER: 'console',
    STORAGE_PROVIDER: 'local'
  }
}));

vi.mock('$lib/server/db', () => ({
  db: {
    activityLog: { create: vi.fn() }
  }
}));

import { logActivity } from '$lib/server/activity-log';
import { db } from '$lib/server/db';

describe('activity-log', () => {
  const mockCreate = vi.mocked(db.activityLog.create);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('persists a log entry with correct fields', async () => {
    mockCreate.mockResolvedValue({} as never);
    await logActivity({
      organizationId: 'org1',
      userId: 'user1',
      actionType: 'WORK_ORDER_CREATED',
      entityType: 'WorkOrder',
      entityId: 'wo1',
      metadata: { title: 'Test Order' }
    });

    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        organizationId: 'org1',
        userId: 'user1',
        actionType: 'WORK_ORDER_CREATED',
        entityType: 'WorkOrder',
        entityId: 'wo1',
        metadata: { title: 'Test Order' }
      }
    });
  });

  it('does not throw when db.create fails', async () => {
    mockCreate.mockRejectedValue(new Error('DB connection lost'));
    await expect(
      logActivity({
        organizationId: 'org1',
        actionType: 'WORKER_ADDED',
        entityType: 'User',
        entityId: 'u1'
      })
    ).resolves.toBeUndefined();
  });

  it('uses null for userId when not provided', async () => {
    mockCreate.mockResolvedValue({} as never);
    await logActivity({
      organizationId: 'org1',
      actionType: 'MAGIC_LINK_USED',
      entityType: 'WorkOrder',
      entityId: 'wo1'
    });

    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ userId: null })
    });
  });
});
