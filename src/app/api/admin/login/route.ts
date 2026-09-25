import { cookies } from "next/headers";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { hasAppSecret, safeEqual, SESSION_COOKIE, SESSION_TTL_MS, signSession } from "@/lib/secrets";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

export async function POST(request: Request) {
  if (!ADMIN_PASSWORD || !hasAppSecret()) {
    return Response.json({ error: "Admin access isn't configured on this deployment." }, { status: 503 });
  }

  const limit = rateLimit(`admin-login:${clientIp(request)}`, { max: 5, windowMs: 15 * 60 * 1000 });
  if (!limit.ok) {
    return Response.json(
      { error: `Too many attempts. Try again in ${Math.ceil(limit.retryAfter / 60)} min.` },
      { status: 429 },
    );
  }

  let password = "";
  try {
    password = String((await request.json()).password ?? "");
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!safeEqual(password, ADMIN_PASSWORD)) {
    return Response.json({ error: "Wrong password." }, { status: 401 });
  }

  (await cookies()).set(SESSION_COOKIE, signSession(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
  return Response.json({ ok: true });
}
