// Simple in-memory sliding-window rate limiter for sensitive endpoints
// (login, register). Single-instance only — behind multiple instances use
// Redis/Upstash instead. Entries expire naturally via the timestamps array.

const hits = new Map<string, number[]>();

export interface RateLimitOptions {
  /** Max attempts per window. */
  limit: number;
  /** Window length in seconds. */
  windowSecs: number;
  /** Override for "now" (tests). */
  now?: number;
}

export function isRateLimited(key: string, opts: RateLimitOptions): {
  limited: boolean;
  retryAfterSecs: number;
} {
  const { limit, windowSecs, now = Date.now() } = opts;
  const windowMs = windowSecs * 1000;
  const cutoff = now - windowMs;

  const prev = hits.get(key) ?? [];
  const recent = prev.filter((t) => t > cutoff);

  if (recent.length >= limit) {
    const oldest = Math.min(...recent);
    const retryAfterSecs = Math.ceil((oldest + windowMs - now) / 1000);
    hits.set(key, recent);
    return { limited: true, retryAfterSecs: Math.max(1, retryAfterSecs) };
  }

  recent.push(now);
  hits.set(key, recent);

  // Opportunistic cleanup so the map can't grow unbounded.
  if (hits.size > 5000) {
    for (const [k, times] of hits) {
      if (times.length === 0 || times[times.length - 1] <= cutoff) hits.delete(k);
    }
  }

  return { limited: false, retryAfterSecs: 0 };
}

/** Test helper: clear all tracked attempts. */
export function clearRateLimits(): void {
  hits.clear();
}
