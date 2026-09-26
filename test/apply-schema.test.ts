import { describe, expect, it } from "vitest";
import { STEPS, validateField, validateStep } from "@/lib/apply-schema";

const field = (track: "startup" | "builder", name: string) =>
  STEPS[track].flatMap((s) => s.fields).find((f) => f.name === name)!;

describe("apply schema", () => {
  it("requires required fields and allows empty optional ones", () => {
    expect(validateField(field("startup", "company"), "")).toMatch(/required/);
    expect(validateField(field("startup", "backer"), "")).toBeNull();
  });

  it("only accepts UT emails for builders", () => {
    const email = field("builder", "email");
    expect(validateField(email, "sam@utexas.edu")).toBeNull();
    expect(validateField(email, "sam@cs.utexas.edu")).toBeNull();
    expect(validateField(email, "sam@gmail.com")).toMatch(/utexas/);
    expect(validateField(email, "not-an-email")).toMatch(/valid email/);
  });

  it("accepts bare domains as URLs", () => {
    const website = field("startup", "website");
    expect(validateField(website, "acme.com")).toBeNull();
    expect(validateField(website, "https://acme.com/path")).toBeNull();
    expect(validateField(website, "acme")).toMatch(/valid URL/);
  });

  it("checks challenge code format", () => {
    const code = field("builder", "challenge");
    expect(validateField(code, "OP-A1B2C3-0123456789")).toBeNull();
    expect(validateField(code, "op-a1b2c3-abcdef0123")).toBeNull();
    expect(validateField(code, "OP-123")).toMatch(/challenge code/);
  });

  it("enforces minimum detail on long answers", () => {
    expect(validateField(field("startup", "backlog"), "too short")).toMatch(/more detail/);
  });

  it("reports every error in a step", () => {
    const errors = validateStep(STEPS.builder[0], {});
    expect(Object.keys(errors).sort()).toEqual(["email", "grad", "major", "name"]);
  });
});
