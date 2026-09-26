import { describe, expect, it, vi } from "vitest";

describe("rateLimit (memory fallback)", () => {
  it("allows up to max hits per window, then reports retry time", async () => {
    vi.stubEnv("SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_KEY", "");
    const { rateLimit } = await import("@/lib/rate-limit");
    const key = `test:${Math.random()}`;
    for (let i = 0; i < 3; i++) expect((await rateLimit(key, { max: 3, windowMs: 60_000 })).ok).toBe(true);
    const blocked = await rateLimit(key, { max: 3, windowMs: 60_000 });
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfter).toBeGreaterThan(0);
  });

  it("hashes client IPs", async () => {
    const { clientIp } = await import("@/lib/rate-limit");
    const id = clientIp(new Request("http://x", { headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" } }));
    expect(id).toMatch(/^[0-9a-f]{32}$/);
    expect(id).not.toContain("1.2.3.4");
  });
});
