import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('$lib/server/db', () => ({
  db: {
    $queryRaw: vi.fn()
  }
}));

vi.mock('$lib/server/feature-gate', () => ({
  requirePro: vi.fn()
}));

import { load } from '../../src/routes/dashboard/analytics/+page.server';

describe('analytics load', () => {
  beforeEach(async () => {
    const { db } = await import('$lib/server/db');
    vi.mocked(db.$queryRaw).mockReset();
  });

  it('returns plain serializable analytics values', async () => {
    const { db } = await import('$lib/server/db');

    const fakeDecimal = {
      valueOf: () => 42.5,
      toString: () => '42.5'
    };

    vi.mocked(db.$queryRaw)
      .mockResolvedValueOnce([{ avg_minutes: fakeDecimal as any }])
      .mockResolvedValueOnce([{ total: 10, on_time: 8 }])
      .mockResolvedValueOnce([{ avg_missed: '1.5' as any }])
      .mockResolvedValueOnce([{ title: 'Lock doors', count: '2' as any }])
      .mockResolvedValueOnce([{ name: 'Mike', score: '80' as any }]);

    const result = await load({
      locals: { user: { organizationId: 'org1', organization: { planType: 'PRO' } } }
    } as any);

    expect(result).toEqual({
      avgReadyLeadMinutes: 42.5,
      onTime: { total: 10, on_time: 8 },
      avgMissedItems: 1.5,
      repeatIssues: [{ title: 'Lock doors', count: 2 }],
      workerConsistency: [{ name: 'Mike', score: 80 }]
    });
  });

  it('falls back to empty numeric defaults', async () => {
    const { db } = await import('$lib/server/db');

    vi.mocked(db.$queryRaw)
      .mockResolvedValueOnce([{ avg_minutes: null }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ avg_missed: null }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const result = await load({
      locals: { user: { organizationId: 'org1', organization: { planType: 'PRO' } } }
    } as any);

    expect(result).toEqual({
      avgReadyLeadMinutes: null,
      onTime: { total: 0, on_time: 0 },
      avgMissedItems: null,
      repeatIssues: [],
      workerConsistency: []
    });
  });
});
