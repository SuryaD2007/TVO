import "server-only";
import type { Values } from "./apply-schema";
import type { Track } from "./content";

export type Application = { ref: string; track: Track; values: Values };

const SUPABASE_URL = process.env.SUPABASE_URL;
// Publishable (anon) key. Server-side only; the table allows this role to insert, nothing else.
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

/**
 * Persists an application. Uses Supabase's REST API when configured,
 * otherwise logs to the server console (local development).
 */
export async function saveApplication(app: Application): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.info("[apply] storage not configured; logging only:", app);
    return;
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/applications`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ ref: app.ref, track: app.track, payload: app.values }),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Supabase insert failed: ${res.status} ${await res.text()}`);
  }
}

/** Best-effort operator ping. Never fails the request. */
export async function notifyOperators(app: Application): Promise<void> {
  if (!SLACK_WEBHOOK_URL) return;
  const who =
    app.track === "startup"
      ? `${app.values.company} (${app.values.stage}), ${app.values.name}, ${app.values.email}`
      : `${app.values.name}, ${app.values.major} '${app.values.grad.slice(-2)}, ${app.values.email}`;
  try {
    await fetch(SLACK_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `New ${app.track === "startup" ? "sprint request" : "builder application"} ${app.ref}: ${who}`,
      }),
    });
  } catch (err) {
    console.error("[apply] slack notify failed", err);
  }
}
