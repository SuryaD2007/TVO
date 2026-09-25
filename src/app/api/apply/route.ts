import { randomBytes } from "node:crypto";
import { STEPS, validateStep, type Values } from "@/lib/apply-schema";
import type { Track } from "@/lib/content";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { verifyChallengeCode } from "@/lib/secrets";
import { notifyOperators, saveApplication } from "@/lib/store";

const MAX_FIELD_LENGTH = 4000;

export async function POST(request: Request) {
  const limit = rateLimit(`apply:${clientIp(request)}`);
  if (!limit.ok) {
    return Response.json(
      { error: "Too many submissions. Try again in a few minutes." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  let body: { track?: Track; values?: Record<string, unknown>; website_hp?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const { track } = body;
  if ((track !== "startup" && track !== "builder") || !body.values || typeof body.values !== "object") {
    return Response.json({ error: "Invalid application." }, { status: 400 });
  }

  // Honeypot: real users never see this field. Pretend success for bots.
  if (body.website_hp) {
    return Response.json({ ref: "TVO-000000" }, { status: 201 });
  }

  // Keep only fields this track defines, as trimmed strings
  const values: Values = {};
  for (const field of STEPS[track].flatMap((s) => s.fields)) {
    const raw = body.values[field.name];
    if (typeof raw === "string" && raw.trim()) values[field.name] = raw.trim();
  }

  const errors = STEPS[track].reduce<Record<string, string>>(
    (acc, step) => ({ ...acc, ...validateStep(step, values) }),
    {},
  );
  for (const [name, v] of Object.entries(values)) {
    if (v.length > MAX_FIELD_LENGTH) errors[name] = `Keep this under ${MAX_FIELD_LENGTH} characters.`;
  }
  if (Object.keys(errors).length > 0) {
    return Response.json({ error: "Please fix the highlighted fields.", errors }, { status: 422 });
  }

  // A solved terminal challenge is recorded, never required
  if (values.challenge) {
    values.challenge = values.challenge.toUpperCase();
    values.challenge_status = verifyChallengeCode(values.challenge) ? "verified" : "invalid";
  }

  const app = {
    ref: `TVO-${randomBytes(3).toString("hex").toUpperCase()}`,
    track,
    values,
    statusToken: randomBytes(16).toString("hex"),
  };

  try {
    await saveApplication(app);
  } catch (err) {
    console.error("[apply]", err);
    return Response.json(
      { error: "We couldn't save your application. Please try again." },
      { status: 500 },
    );
  }
  await notifyOperators(app);

  return Response.json(
    {
      ref: app.ref,
      statusUrl: `/status/${app.ref}?t=${app.statusToken}`,
      challengeVerified: values.challenge_status === "verified",
    },
    { status: 201 },
  );
}
