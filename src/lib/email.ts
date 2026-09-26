import "server-only";
import { STEPS } from "./apply-schema";
import type { Application } from "./store";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
// Must be an address on a domain verified in Resend, e.g. "TVO <apply@yourdomain.com>"
const EMAIL_FROM = process.env.EMAIL_FROM;
// Comma-separated operator inboxes for new-application alerts
const OPERATOR_EMAILS = (process.env.OPERATOR_EMAIL ?? "").split(",").map((s) => s.trim()).filter(Boolean);
const RESEND_URL = process.env.RESEND_API_URL ?? "https://api.resend.com/emails";

export const emailConfigured = () => Boolean(RESEND_API_KEY && EMAIL_FROM);

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

async function send(to: string[], subject: string, html: string, text: string, replyTo?: string) {
  const res = await fetch(RESEND_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: EMAIL_FROM, to, subject, html, text, ...(replyTo ? { reply_to: replyTo } : {}) }),
    signal: AbortSignal.timeout(8_000),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${(await res.text()).slice(0, 200)}`);
}

function layout(body: string) {
  return `<!doctype html><html><body style="margin:0;background:#0a0a09;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#f5f3ee">
<table role="presentation" width="100%" style="max-width:560px;margin:0 auto"><tr><td>
<div style="display:inline-block;background:#ffa559;color:#1a0f05;font-weight:700;font-size:13px;padding:4px 10px;border-radius:6px">TVO</div>
${body}
<p style="margin-top:40px;font-size:12px;color:#85827b">Texas Venture Operators · UT Austin's external engineering syndicate</p>
</td></tr></table></body></html>`;
}

/** Confirmation to the applicant, with their private status link. */
export async function sendApplicantConfirmation(app: Application, statusLink: string) {
  if (!emailConfigured() || !app.values.email) return;
  const first = (app.values.name ?? "").trim().split(/\s+/)[0] || "there";
  const isBuilder = app.track === "builder";
  const subject = isBuilder ? `We got your TVO application (${app.ref})` : `We got your sprint request (${app.ref})`;
  const next = isBuilder
    ? "An operator will review it, and we'll email this address with next steps for the technical round."
    : "An operator will review your backlog and reach out to set up a scoping call.";
  const solved = app.values.challenge_status === "verified" ? "<p style=\"color:#ffa559\">You solved the terminal challenge, so your application is flagged for priority review.</p>" : "";

  const html = layout(`
<h1 style="font-size:28px;font-weight:500;letter-spacing:-0.5px;margin:28px 0 12px">Thanks, ${esc(first)}.</h1>
<p style="color:#a8a59e;line-height:1.6">${next}</p>
${solved}
<p style="margin:28px 0"><a href="${esc(statusLink)}" style="display:inline-block;background:#ffa559;color:#1a0f05;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:999px">Track your application</a></p>
<p style="font-size:13px;color:#85827b;line-height:1.6">Reference ${esc(app.ref)}. This link is private to you; keep this email.</p>`);
  const text = `Thanks, ${first}.\n\n${next}\n\nTrack your application: ${statusLink}\nReference: ${app.ref}\n\nThis link is private to you; keep this email.`;

  await send([app.values.email], subject, html, text);
}

/** Alert to the operators' inbox for each new application. */
export async function sendOperatorAlert(app: Application, adminLink: string) {
  if (!emailConfigured() || OPERATOR_EMAILS.length === 0) return;
  const v = app.values;
  const who = app.track === "startup" ? `${v.company} (${v.stage})` : `${v.name}, ${v.major}`;
  const subject = `New ${app.track === "startup" ? "sprint request" : "builder application"}: ${who}${v.challenge_status === "verified" ? " ★" : ""}`;

  const fields = STEPS[app.track].flatMap((s) => s.fields).filter((f) => v[f.name]);
  const rows = fields
    .map(
      (f) =>
        `<tr><td style="padding:8px 12px 8px 0;color:#85827b;vertical-align:top;white-space:nowrap">${esc(f.label)}</td><td style="padding:8px 0;white-space:pre-wrap">${esc(v[f.name])}</td></tr>`,
    )
    .join("");
  const html = layout(`
<h1 style="font-size:22px;font-weight:500;margin:28px 0 4px">${esc(who)}</h1>
<p style="color:#85827b;margin:0 0 20px">${esc(app.ref)}${v.challenge_status === "verified" ? " · solved the challenge" : ""}</p>
<table role="presentation" style="font-size:14px;line-height:1.5;border-collapse:collapse">${rows}</table>
<p style="margin:28px 0"><a href="${esc(adminLink)}" style="color:#ffa559">Review in the operator console →</a></p>`);
  const text = `${who} (${app.ref})\n\n${fields.map((f) => `${f.label}: ${v[f.name]}`).join("\n")}\n\nReview: ${adminLink}`;

  await send(OPERATOR_EMAILS, subject, html, text, v.email);
}
