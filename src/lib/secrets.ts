import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * APP_SECRET signs admin sessions and challenge codes, and derives the key the
 * database checks for admin functions. Without it those features switch off.
 */
const APP_SECRET = process.env.APP_SECRET;

export const hasAppSecret = () => Boolean(APP_SECRET);

function hmac(data: string): string {
  if (!APP_SECRET) throw new Error("APP_SECRET is not set");
  return createHmac("sha256", Buffer.from(APP_SECRET, "hex")).update(data).digest("hex");
}

export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

/** Key passed to the admin SQL functions; its SHA-256 is seeded in private.admin_keys. */
export const adminDbKey = () => hmac("tvo-admin-db-key");

// ---- Admin sessions: "<expiry ms>.<signature>" ----

export const SESSION_COOKIE = "tvo_admin";
export const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

export function signSession(): string {
  const exp = String(Date.now() + SESSION_TTL_MS);
  return `${exp}.${hmac(`session:${exp}`)}`;
}

export function verifySession(value: string | undefined): boolean {
  if (!value || !APP_SECRET) return false;
  const [exp, sig] = value.split(".");
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  return safeEqual(sig, hmac(`session:${exp}`));
}

// ---- Challenge answer ----
// Stored as HMAC(APP_SECRET, "challenge-answer:<answer>") in CHALLENGE_ANSWER_HMAC.
// A plain hash of a small integer could be brute-forced from the public repo;
// without APP_SECRET this one can't. To rotate the answer, recompute with:
//   node -e 'console.log(require("crypto").createHmac("sha256", Buffer.from(process.env.APP_SECRET,"hex")).update("challenge-answer:<ANSWER>").digest("hex"))'

export const hasChallenge = () => Boolean(APP_SECRET && process.env.CHALLENGE_ANSWER_HMAC);

export function checkChallengeAnswer(answer: string): boolean {
  const expected = process.env.CHALLENGE_ANSWER_HMAC;
  if (!expected || !APP_SECRET) return false;
  return safeEqual(hmac(`challenge-answer:${answer}`), expected);
}

// ---- Challenge codes: "OP-<nonce>-<signature>" ----

export function issueChallengeCode(): string {
  const nonce = randomBytes(3).toString("hex").toUpperCase();
  return `OP-${nonce}-${hmac(`challenge:${nonce}`).slice(0, 10).toUpperCase()}`;
}

export function verifyChallengeCode(code: string | undefined): boolean {
  if (!code || !APP_SECRET) return false;
  const m = /^OP-([0-9A-F]{6})-([0-9A-F]{10})$/.exec(code.trim().toUpperCase());
  if (!m) return false;
  return safeEqual(m[2], hmac(`challenge:${m[1]}`).slice(0, 10).toUpperCase());
}
