import "server-only";

const SECRET = process.env.TURNSTILE_SECRET_KEY;

/**
 * Verifies a Cloudflare Turnstile token. Returns true when Turnstile isn't
 * configured (TURNSTILE_SECRET_KEY unset), so local dev works without it.
 */
export async function verifyTurnstile(token: string, request: Request): Promise<boolean> {
  if (!SECRET) return true;
  if (!token) return false;
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret: SECRET,
        response: token,
        remoteip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
      }),
      signal: AbortSignal.timeout(5_000),
    });
    const data = (await res.json()) as { success?: boolean; "error-codes"?: string[] };
    if (!data.success) console.warn("[turnstile] rejected", data["error-codes"]);
    return data.success === true;
  } catch (err) {
    // Cloudflare unreachable: fail open rather than block real applicants
    console.error("[turnstile] verify failed", err);
    return true;
  }
}
