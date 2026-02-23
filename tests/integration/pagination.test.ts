import { describe, it, expect } from 'vitest';
import { parsePaginationParams } from '../../src/lib/utils';

describe('parsePaginationParams', () => {
  function makeUrl(params: Record<string, string>) {
    const url = new URL('http://localhost/dashboard/work-orders');
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }
    return url;
  }

  it('returns defaults when no params provided', () => {
    const url = makeUrl({});
    const result = parsePaginationParams(url, 25);
    expect(result).toEqual({ page: 1, limit: 25, skip: 0 });
  });

  it('parses page and limit correctly', () => {
    const url = makeUrl({ page: '3', limit: '10' });
    const result = parsePaginationParams(url);
    expect(result).toEqual({ page: 3, limit: 10, skip: 20 });
  });

  it('clamps page to minimum of 1', () => {
    const url = makeUrl({ page: '-5' });
    const result = parsePaginationParams(url);
    expect(result.page).toBe(1);
  });

  it('clamps limit to maximum of 100', () => {
    const url = makeUrl({ limit: '500' });
    const result = parsePaginationParams(url);
    expect(result.limit).toBe(100);
  });

  it('clamps limit to minimum of 1', () => {
    const url = makeUrl({ limit: '0' });
    const result = parsePaginationParams(url);
    expect(result.limit).toBe(1);
  });

  it('calculates skip correctly for page 2 with limit 10', () => {
    const url = makeUrl({ page: '2', limit: '10' });
    const result = parsePaginationParams(url);
    expect(result.skip).toBe(10);
  });

  it('falls back to defaultLimit for invalid limit value', () => {
    const url = makeUrl({ limit: 'abc' });
    const result = parsePaginationParams(url, 50);
    expect(result.limit).toBe(50);
  });

  it('falls back to page 1 for invalid page value', () => {
    const url = makeUrl({ page: 'abc' });
    const result = parsePaginationParams(url);
    expect(result.page).toBe(1);
  });
});
