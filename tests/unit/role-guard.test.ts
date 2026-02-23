import { describe, it, expect, vi } from 'vitest';

// Mock env
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

vi.mock('$lib/server/billing', () => ({
  billingService: {
    isActive: vi.fn().mockReturnValue(true),
    isTrialExpired: vi.fn().mockReturnValue(false),
    getTrialDaysRemaining: vi.fn().mockReturnValue(10)
  }
}));

// Simulate the layout guard logic
function guardDashboard(role: string | null): { allowed: boolean; redirectTo: string | null } {
  if (!role || (role !== 'MANAGER' && role !== 'SUPERVISOR')) {
    return { allowed: false, redirectTo: '/auth/login' };
  }
  return { allowed: true, redirectTo: null };
}

function guardBillingPage(role: string): { allowed: boolean; redirectTo: string | null } {
  if (role !== 'MANAGER') {
    return { allowed: false, redirectTo: '/dashboard' };
  }
  return { allowed: true, redirectTo: null };
}

describe('role-guard', () => {
  describe('dashboard layout guard', () => {
    it('allows MANAGER access', () => {
      expect(guardDashboard('MANAGER').allowed).toBe(true);
    });

    it('allows SUPERVISOR access', () => {
      expect(guardDashboard('SUPERVISOR').allowed).toBe(true);
    });

    it('blocks WORKER and redirects to login', () => {
      const result = guardDashboard('WORKER');
      expect(result.allowed).toBe(false);
      expect(result.redirectTo).toBe('/auth/login');
    });

    it('blocks unauthenticated (null) and redirects to login', () => {
      const result = guardDashboard(null);
      expect(result.allowed).toBe(false);
      expect(result.redirectTo).toBe('/auth/login');
    });
  });

  describe('billing page guard', () => {
    it('allows MANAGER access to billing', () => {
      expect(guardBillingPage('MANAGER').allowed).toBe(true);
    });

    it('blocks SUPERVISOR from billing and redirects to dashboard', () => {
      const result = guardBillingPage('SUPERVISOR');
      expect(result.allowed).toBe(false);
      expect(result.redirectTo).toBe('/dashboard');
    });
  });
});
