import { createHash } from "node:crypto";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { hasAppSecret, issueChallengeCode } from "@/lib/secrets";

// SHA-256 of the answer, so the public repo doesn't give it away.
const ANSWER_HASH = "52e0e094893bded142469f1519f9d178fefbfdae5519e703ecb1c393aaecb89d";

export async function POST(request: Request) {
  if (!hasAppSecret()) {
    return Response.json({ error: "Challenge verification is offline." }, { status: 503 });
  }

  const limit = rateLimit(`challenge:${clientIp(request)}`, { max: 8, windowMs: 10 * 60 * 1000 });
  if (!limit.ok) {
    return Response.json(
      { error: `Too many attempts. Cool down for ${Math.ceil(limit.retryAfter / 60)} min.` },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  let answer = "";
  try {
    const body = await request.json();
    answer = String(body.answer ?? "").replace(/[\s,_]/g, "");
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const hash = createHash("sha256").update(answer).digest("hex");
  if (hash !== ANSWER_HASH) {
    return Response.json({ correct: false }, { status: 200 });
  }
  return Response.json({ correct: true, code: issueChallengeCode() }, { status: 200 });
}
