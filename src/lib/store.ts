import "server-only";
import { createHash } from "node:crypto";
import type { Values } from "./apply-schema";
import type { Track } from "./content";
import { adminDbKey } from "./secrets";

export type Application = { ref: string; track: Track; values: Values; statusToken: string };

export const APPLICATION_STATUSES = ["new", "reviewing", "accepted", "declined"] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export type ApplicationRow = {
  id: string;
  ref: string;
  track: Track;
  /** Form values; `challenge_status` is "verified" | "invalid" when a code was given. */
  payload: Values;
  status: ApplicationStatus;
  notes: string;
  created_at: string;
  updated_at: string;
};

export type PublicStatus = {
  ref: string;
  track: Track;
  status: ApplicationStatus;
  created_at: string;
  updated_at: string;
  first_name: string;
};

const SUPABASE_URL = process.env.SUPABASE_URL;
// Publishable (anon) key. Server-side only; the table allows this role to insert,
// and everything else goes through secret-checked SQL functions.
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

export const storageConfigured = () => Boolean(SUPABASE_URL && SUPABASE_KEY);

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

async function supabase(path: string, body: unknown, prefer?: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY!,
      "Content-Type": "application/json",
      ...(prefer ? { Prefer: prefer } : {}),
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Supabase ${path} failed: ${res.status} ${await res.text()}`);
  }
  return res;
}

/**
 * Persists an application. Uses Supabase when configured, otherwise logs to
 * the server console (local development).
 */
export async function saveApplication(app: Application): Promise<void> {
  if (!storageConfigured()) {
    console.info("[apply] storage not configured; logging only:", { ...app, statusToken: "…" });
    return;
  }
  await supabase(
    "applications",
    { ref: app.ref, track: app.track, payload: app.values, status_token_hash: sha256(app.statusToken) },
    "return=minimal",
  );
}

export async function getPublicStatus(ref: string, token: string): Promise<PublicStatus | null> {
  if (!storageConfigured()) return null;
  const res = await supabase("rpc/application_status", { p_ref: ref, p_token: token });
  const rows = (await res.json()) as PublicStatus[];
  return rows[0] ?? null;
}

export async function listApplications(): Promise<ApplicationRow[]> {
  const res = await supabase("rpc/admin_list_applications", { p_secret: adminDbKey() });
  return (await res.json()) as ApplicationRow[];
}

export async function updateApplication(
  ref: string,
  changes: { status?: ApplicationStatus; notes?: string },
): Promise<ApplicationRow> {
  const res = await supabase("rpc/admin_update_application", {
    p_secret: adminDbKey(),
    p_ref: ref,
    p_status: changes.status ?? null,
    p_notes: changes.notes ?? null,
  });
  return (await res.json()) as ApplicationRow;
}

/** Best-effort operator ping. Never fails the request. */
export async function notifyOperators(app: Application): Promise<void> {
  if (!SLACK_WEBHOOK_URL) return;
  const v = app.values;
  const who =
    app.track === "startup"
      ? `${v.company} (${v.stage}), ${v.name}, ${v.email}`
      : `${v.name}, ${v.major} '${(v.grad ?? "").slice(-2)}, ${v.email}${v.challenge_status === "verified" ? " · solved challenge" : ""}`;
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
