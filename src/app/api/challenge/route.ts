import { clientIp, rateLimit } from "@/lib/rate-limit";
import { checkChallengeAnswer, hasChallenge, issueChallengeCode } from "@/lib/secrets";

export async function POST(request: Request) {
  if (!hasChallenge()) {
    return Response.json({ error: "Challenge verification is offline." }, { status: 503 });
  }

  const limit = await rateLimit(`challenge:${clientIp(request)}`, { max: 8, windowMs: 10 * 60 * 1000 });
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

  if (!/^\d{1,12}$/.test(answer) || !checkChallengeAnswer(answer)) {
    return Response.json({ correct: false }, { status: 200 });
  }
  return Response.json({ correct: true, code: issueChallengeCode() }, { status: 200 });
}
