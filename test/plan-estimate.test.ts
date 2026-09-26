import { describe, expect, it } from "vitest";
import { planToText, sizing } from "@/lib/plan";
import { estimatePlan } from "@/lib/plan-estimate";

describe("estimatePlan", () => {
  it("splits sentences and lines into tickets", () => {
    const plan = estimatePlan(
      "Usage-based billing on Stripe. Admin dashboard for refunds. Fix the webhook that double-charges.",
    );
    expect(plan.tickets.map((t) => t.title)).toEqual([
      "Usage-based billing on Stripe",
      "Admin dashboard for refunds",
      "Fix the webhook that double-charges",
    ]);
    expect(plan.source).toBe("estimate");
  });

  it("sizes and tags by keywords without false matches", () => {
    const plan = estimatePlan("Move Postgres to read replicas\nClinician dashboard for today's visits\nFix typo on pricing page");
    const [replicas, dashboard, typo] = plan.tickets;
    expect(replicas).toMatchObject({ size: "L", area: "infra" });
    expect(dashboard.area).toBe("frontend"); // "clinician" must not match "ci"
    expect(typo.size).toBe("S");
  });

  it("tags webhooks as backend, not web frontend", () => {
    expect(estimatePlan("Fix the flaky webhook handler that double-charges").tickets[0].area).toBe("backend");
  });

  it("caps tickets and keeps squad and sprints in range", () => {
    const plan = estimatePlan(Array.from({ length: 30 }, (_, i) => `Build payment integration ${i}`).join("\n"));
    expect(plan.tickets.length).toBe(10);
    expect(plan.squad_size).toBeGreaterThanOrEqual(2);
    expect(plan.squad_size).toBeLessThanOrEqual(4);
    expect(plan.sprints).toBeGreaterThanOrEqual(1);
    expect(plan.sprints).toBeLessThanOrEqual(4);
  });

  it("sizes small backlogs with the smallest squad", () => {
    expect(sizing([{ title: "a", area: "backend", size: "S", notes: "" }])).toEqual({ points: 1, squad: 2, sprints: 1 });
  });

  it("formats a plan for the application form", () => {
    const text = planToText(estimatePlan("Add SSO login\nFix button color"));
    expect(text).toContain("- [L] Add SSO login (backend)");
    expect(text).toMatch(/Suggested: \d builders, \d sprints?\./);
  });
});
