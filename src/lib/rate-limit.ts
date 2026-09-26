import "server-only";
import { createHash } from "node:crypto";

type Result = { ok: boolean; retryAfter: number };
type Options = { max?: number; windowMs?: number };

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

/**
 * Fixed-window limiter. Counters live in Postgres (private.rate_limits) so
 * they hold across serverless instances; if Supabase is unconfigured or
 * unreachable, a per-instance in-memory window takes over.
 */
export async function rateLimit(
  key: string,
  { max = 5, windowMs = 10 * 60 * 1000 }: Options = {},
): Promise<Result> {
  if (SUPABASE_URL && SUPABASE_KEY) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/hit_rate_limit`, {
        method: "POST",
        headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ p_key: key, p_max: max, p_window_seconds: Math.ceil(windowMs / 1000) }),
        cache: "no-store",
        signal: AbortSignal.timeout(3_000),
      });
      if (res.ok) {
        const [row] = (await res.json()) as { allowed: boolean; retry_after: number }[];
        if (row) return { ok: row.allowed, retryAfter: row.retry_after };
      }
      console.warn("[rate-limit] supabase", res.status);
    } catch (err) {
      console.warn("[rate-limit] supabase unreachable", err instanceof Error ? err.message : err);
    }
  }
  return memoryLimit(key, max, windowMs);
}

const hits = new Map<string, { count: number; resetAt: number }>();

function memoryLimit(key: string, max: number, windowMs: number): Result {
  const now = Date.now();
  const entry = hits.get(key);

  if (!entry || entry.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    if (hits.size > 5000) {
      for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
    }
    return { ok: true, retryAfter: 0 };
  }

  entry.count += 1;
  return { ok: entry.count <= max, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
}

/** Hashed client IP, so raw addresses never reach the database. */
export function clientIp(request: Request): string {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  return createHash("sha256").update(`tvo:${ip}`).digest("hex").slice(0, 32);
}
