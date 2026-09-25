import { randomBytes } from "node:crypto";
import { STEPS, validateStep, type Values } from "@/lib/apply-schema";
import type { Track } from "@/lib/content";
import { rateLimit } from "@/lib/rate-limit";
import { notifyOperators, saveApplication } from "@/lib/store";

const MAX_FIELD_LENGTH = 4000;

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limit = rateLimit(ip);
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

  const app = { ref: `TVO-${randomBytes(3).toString("hex").toUpperCase()}`, track, values };

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

  return Response.json({ ref: app.ref }, { status: 201 });
}
