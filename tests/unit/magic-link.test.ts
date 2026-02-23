import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';

const TEST_SECRET = 'test-magic-secret-at-least-32-chars!';

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

const mockRecord = {
  id: 'token-record-1',
  workOrderId: 'wo1',
  token: '',
  expiresAt: new Date(Date.now() + 48 * 3600 * 1000),
  usedAt: null,
  createdAt: new Date()
};

vi.mock('$lib/server/db', () => ({
  db: {
    magicLinkToken: {
      create: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn()
    }
  }
}));

import { verifyAndConsumeWorkerToken, verifyLegacyWorkerToken, signWorkerToken, verifyWorkerToken } from '$lib/server/magic-link';
import { db } from '$lib/server/db';

describe('magic-link', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('signWorkerToken / verifyWorkerToken (legacy API)', () => {
    it('returns a valid JWT string', () => {
      const token = signWorkerToken('work-order-123');
      expect(token.split('.').length).toBe(3);
    });

    it('round-trips workOrderId', () => {
      const token = signWorkerToken('work-order-abc');
      const result = verifyWorkerToken(token);
      expect(result.workOrderId).toBe('work-order-abc');
    });

    it('throws on wrong type claim', () => {
      const badToken = jwt.sign({ workOrderId: 'order-xyz', type: 'manager' }, TEST_SECRET, { expiresIn: '1h' });
      expect(() => verifyWorkerToken(badToken)).toThrow('Invalid token type');
    });
  });

  describe('verifyLegacyWorkerToken', () => {
    it('verifies a valid legacy token (no jti)', () => {
      const token = jwt.sign({ workOrderId: 'wo1', type: 'worker' }, TEST_SECRET, { expiresIn: '48h' });
      const result = verifyLegacyWorkerToken(token);
      expect(result).toEqual({ workOrderId: 'wo1' });
    });

    it('returns null for expired token', () => {
      const token = jwt.sign({ workOrderId: 'wo1', type: 'worker' }, TEST_SECRET, { expiresIn: -1 });
      expect(verifyLegacyWorkerToken(token)).toBeNull();
    });

    it('returns null for token with jti (not a legacy token)', () => {
      const token = jwt.sign({ workOrderId: 'wo1', type: 'worker', jti: 'abc' }, TEST_SECRET, { expiresIn: '48h' });
      expect(verifyLegacyWorkerToken(token)).toBeNull();
    });

    it('returns null for invalid token', () => {
      expect(verifyLegacyWorkerToken('invalid.token.here')).toBeNull();
    });
  });

  describe('verifyAndConsumeWorkerToken', () => {
    it('marks usedAt on first use and returns isFirstUse: true', async () => {
      const record = { ...mockRecord, usedAt: null };
      vi.mocked(db.magicLinkToken.findUnique).mockResolvedValue(record as never);
      vi.mocked(db.magicLinkToken.update).mockResolvedValue({ ...record, usedAt: new Date() } as never);

      const token = jwt.sign(
        { workOrderId: 'wo1', type: 'worker', jti: 'token-record-1' },
        TEST_SECRET,
        { expiresIn: '48h' }
      );

      const result = await verifyAndConsumeWorkerToken(token);
      expect(result.isFirstUse).toBe(true);
      expect(result.workOrderId).toBe('wo1');
      expect(db.magicLinkToken.update).toHaveBeenCalled();
    });

    it('returns isFirstUse: false on subsequent use (idempotent)', async () => {
      const record = { ...mockRecord, usedAt: new Date() };
      vi.mocked(db.magicLinkToken.findUnique).mockResolvedValue(record as never);

      const token = jwt.sign(
        { workOrderId: 'wo1', type: 'worker', jti: 'token-record-1' },
        TEST_SECRET,
        { expiresIn: '48h' }
      );

      const result = await verifyAndConsumeWorkerToken(token);
      expect(result.isFirstUse).toBe(false);
      expect(db.magicLinkToken.update).not.toHaveBeenCalled();
    });

    it('throws for expired DB record', async () => {
      const record = { ...mockRecord, expiresAt: new Date(Date.now() - 1000) };
      vi.mocked(db.magicLinkToken.findUnique).mockResolvedValue(record as never);

      const token = jwt.sign(
        { workOrderId: 'wo1', type: 'worker', jti: 'token-record-1' },
        TEST_SECRET,
        { expiresIn: '48h' }
      );

      await expect(verifyAndConsumeWorkerToken(token)).rejects.toThrow('Token expired');
    });

    it('throws for missing DB record', async () => {
      vi.mocked(db.magicLinkToken.findUnique).mockResolvedValue(null);

      const token = jwt.sign(
        { workOrderId: 'wo1', type: 'worker', jti: 'nonexistent' },
        TEST_SECRET,
        { expiresIn: '48h' }
      );

      await expect(verifyAndConsumeWorkerToken(token)).rejects.toThrow('Token record not found');
    });

    it('throws for invalid JWT', async () => {
      await expect(verifyAndConsumeWorkerToken('bad.token')).rejects.toThrow();
    });
  });
});
