import { beforeEach, describe, expect, it } from 'vitest';
import { clearRateLimits, isRateLimited } from '../server/utils/rateLimit';

beforeEach(() => clearRateLimits());

describe('isRateLimited', () => {
  it('allows attempts up to the limit', () => {
    for (let i = 0; i < 10; i++) {
      expect(isRateLimited('login:1.2.3.4', { limit: 10, windowSecs: 900, now: 1000 }).limited).toBe(false);
    }
  });

  it('blocks the attempt past the limit and gives a retry delay', () => {
    const opts = { limit: 3, windowSecs: 60, now: 1000 };
    isRateLimited('k', opts);
    isRateLimited('k', opts);
    isRateLimited('k', opts);
    const res = isRateLimited('k', opts);
    expect(res.limited).toBe(true);
    expect(res.retryAfterSecs).toBeGreaterThan(0);
    expect(res.retryAfterSecs).toBeLessThanOrEqual(60);
  });

  it('resets after the window passes', () => {
    const opts = { limit: 2, windowSecs: 60, now: 1000 };
    isRateLimited('k', opts);
    isRateLimited('k', opts);
    expect(isRateLimited('k', opts).limited).toBe(true);
    // 61s later the old attempts have expired.
    expect(isRateLimited('k', { limit: 2, windowSecs: 60, now: 62000 }).limited).toBe(false);
  });

  it('tracks keys independently (per-IP isolation)', () => {
    const opts = { limit: 1, windowSecs: 60, now: 1000 };
    expect(isRateLimited('login:ip-a', opts).limited).toBe(false);
    expect(isRateLimited('login:ip-a', opts).limited).toBe(true);
    expect(isRateLimited('login:ip-b', opts).limited).toBe(false);
  });

  it('tracks login and register buckets separately', () => {
    const opts = { limit: 1, windowSecs: 60, now: 1000 };
    expect(isRateLimited('login:ip', opts).limited).toBe(false);
    expect(isRateLimited('register:ip', opts).limited).toBe(false);
  });
});
