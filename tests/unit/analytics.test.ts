import { describe, it, expect, vi } from 'vitest';

vi.mock('$lib/server/db', () => ({
  db: {
    workOrder: { count: vi.fn().mockResolvedValue(5) },
    $queryRaw: vi.fn()
  }
}));

vi.mock('$lib/server/feature-gate', () => ({
  requirePro: vi.fn()
}));

import { load } from '../../src/routes/dashboard/analytics/+page.server';

describe('analytics load', () => {
  it('returns aggregated metrics', async () => {
    const { db } = await import('$lib/server/db');
    vi.mocked(db.$queryRaw)
      .mockResolvedValueOnce([{ avg_minutes: 42 }])
      .mockResolvedValueOnce([{ total: 10, overdue: 2 }])
      .mockResolvedValueOnce([{ name: 'Mike', completed: 3 }])
      .mockResolvedValueOnce([{ title: 'Lock doors', count: 2 }]);
    const result = await load({
      locals: { user: { organizationId: 'org1', organization: { planType: 'PRO' } } }
    } as any);
    expect(result.completedThisWeek).toBe(5);
  });
});
