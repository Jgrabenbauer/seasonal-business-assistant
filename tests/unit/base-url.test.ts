import { describe, expect, it, vi, beforeEach } from 'vitest';

describe('resolveBaseUrl', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('prefers a non-loopback PUBLIC_BASE_URL over the current request origin', async () => {
    vi.doMock('$lib/server/env', () => ({
      env: {
        PUBLIC_BASE_URL: 'https://app.example.com'
      }
    }));

    const { resolveBaseUrl } = await import('$lib/server/base-url');

    expect(resolveBaseUrl('https://preview.example.com')).toBe('https://app.example.com');
  });

  it('falls back to the current request origin when PUBLIC_BASE_URL points to localhost', async () => {
    vi.doMock('$lib/server/env', () => ({
      env: {
        PUBLIC_BASE_URL: 'http://localhost:5173'
      }
    }));

    const { resolveBaseUrl } = await import('$lib/server/base-url');

    expect(resolveBaseUrl('https://preview.example.com/dashboard/turnovers/123')).toBe(
      'https://preview.example.com'
    );
  });

  it('uses PUBLIC_BASE_URL when no request origin is available', async () => {
    vi.doMock('$lib/server/env', () => ({
      env: {
        PUBLIC_BASE_URL: 'https://app.example.com'
      }
    }));

    const { resolveBaseUrl } = await import('$lib/server/base-url');

    expect(resolveBaseUrl()).toBe('https://app.example.com');
  });

  it('uses localhost only when no configured or request base URL is available', async () => {
    vi.doMock('$lib/server/env', () => ({
      env: {
        PUBLIC_BASE_URL: undefined
      }
    }));

    const { resolveBaseUrl } = await import('$lib/server/base-url');

    expect(resolveBaseUrl()).toBe('http://localhost:5173');
  });
});

describe('repairLoopbackUrl', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('rewrites localhost targets to the current deployment origin', async () => {
    vi.doMock('$lib/server/env', () => ({
      env: {
        PUBLIC_BASE_URL: undefined
      }
    }));

    const { repairLoopbackUrl } = await import('$lib/server/base-url');

    expect(
      repairLoopbackUrl(
        'http://localhost:5173/w/token-123?source=sms',
        'https://seasonal-business-assistant.vercel.app/dashboard/turnovers/abc'
      )
    ).toBe('https://seasonal-business-assistant.vercel.app/w/token-123?source=sms');
  });

  it('leaves non-loopback targets unchanged', async () => {
    vi.doMock('$lib/server/env', () => ({
      env: {
        PUBLIC_BASE_URL: undefined
      }
    }));

    const { repairLoopbackUrl } = await import('$lib/server/base-url');

    expect(
      repairLoopbackUrl(
        'https://seasonal-business-assistant.vercel.app/w/token-123',
        'https://seasonal-business-assistant.vercel.app/dashboard/turnovers/abc'
      )
    ).toBe('https://seasonal-business-assistant.vercel.app/w/token-123');
  });
});
