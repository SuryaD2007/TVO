import { createHmac } from "node:crypto";
import { beforeAll, describe, expect, it, vi } from "vitest";

const APP_SECRET = "11".repeat(32);
let secrets: typeof import("@/lib/secrets");

beforeAll(async () => {
  vi.stubEnv("APP_SECRET", APP_SECRET);
  vi.stubEnv(
    "CHALLENGE_ANSWER_HMAC",
    createHmac("sha256", Buffer.from(APP_SECRET, "hex")).update("challenge-answer:4242").digest("hex"),
  );
  secrets = await import("@/lib/secrets");
});

describe("challenge", () => {
  it("accepts only the right answer", () => {
    expect(secrets.checkChallengeAnswer("4242")).toBe(true);
    expect(secrets.checkChallengeAnswer("4243")).toBe(false);
    expect(secrets.checkChallengeAnswer("")).toBe(false);
  });

  it("issues codes that verify, case-insensitively", () => {
    const code = secrets.issueChallengeCode();
    expect(code).toMatch(/^OP-[0-9A-F]{6}-[0-9A-F]{10}$/);
    expect(secrets.verifyChallengeCode(code)).toBe(true);
    expect(secrets.verifyChallengeCode(code.toLowerCase())).toBe(true);
  });

  it("rejects forged or tampered codes", () => {
    const code = secrets.issueChallengeCode();
    const tampered = code.slice(0, -1) + (code.endsWith("0") ? "1" : "0");
    expect(secrets.verifyChallengeCode(tampered)).toBe(false);
    expect(secrets.verifyChallengeCode("OP-000000-0000000000")).toBe(false);
    expect(secrets.verifyChallengeCode(undefined)).toBe(false);
  });
});

describe("admin sessions", () => {
  it("round-trips a signed session", () => {
    expect(secrets.verifySession(secrets.signSession())).toBe(true);
  });

  it("rejects tampered, expired, and missing sessions", () => {
    const [exp, sig] = secrets.signSession().split(".");
    expect(secrets.verifySession(`${Number(exp) + 1}.${sig}`)).toBe(false);
    expect(secrets.verifySession(`${Date.now() - 1000}.${sig}`)).toBe(false);
    expect(secrets.verifySession(undefined)).toBe(false);
    expect(secrets.verifySession("garbage")).toBe(false);
  });
});
