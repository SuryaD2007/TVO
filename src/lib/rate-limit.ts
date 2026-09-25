import "server-only";

// Fixed-window, in-memory limiter. Good enough for a single instance; on
// serverless each instance keeps its own window, so treat it as a speed bump
// and move to a shared store (e.g. Upstash Redis) if abuse shows up.
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 5;
const hits = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  const entry = hits.get(key);

  if (!entry || entry.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    if (hits.size > 5000) {
      for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
    }
    return { ok: true, retryAfter: 0 };
  }

  entry.count += 1;
  return {
    ok: entry.count <= MAX_REQUESTS,
    retryAfter: Math.ceil((entry.resetAt - now) / 1000),
  };
}
