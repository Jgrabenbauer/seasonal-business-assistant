import { describe, expect, it, vi, beforeEach } from 'vitest';

describe('resolveBaseUrl', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('prefers PUBLIC_BASE_URL when configured', async () => {
    vi.doMock('$lib/server/env', () => ({
      env: {
        PUBLIC_BASE_URL: 'https://app.example.com'
      }
    }));

    const { resolveBaseUrl } = await import('$lib/server/base-url');

    expect(resolveBaseUrl('https://preview.example.com')).toBe('https://app.example.com');
  });

  it('falls back to the current request origin when PUBLIC_BASE_URL is unset', async () => {
    vi.doMock('$lib/server/env', () => ({
      env: {
        PUBLIC_BASE_URL: undefined
      }
    }));

    const { resolveBaseUrl } = await import('$lib/server/base-url');

    expect(resolveBaseUrl(new URL('https://preview.example.com/dashboard/turnovers/123'))).toBe(
      'https://preview.example.com'
    );
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
