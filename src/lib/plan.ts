// Sprint plan shape shared by the /api/plan route and the planner UI.

export const AREAS = ["frontend", "backend", "infra", "data", "mobile", "ai", "design"] as const;
export const SIZES = ["S", "M", "L"] as const;

export type PlanTicket = {
  title: string;
  area: (typeof AREAS)[number];
  size: (typeof SIZES)[number];
  notes: string;
};

export type SprintPlan = {
  summary: string;
  tickets: PlanTicket[];
  squad_size: number;
  sprints: number;
  risks: string[];
  /** "ai" when Claude wrote it, "estimate" for the built-in heuristic. */
  source: "ai" | "estimate";
};

const POINTS = { S: 1, M: 2, L: 3 } as const;

export function sizing(tickets: PlanTicket[]) {
  const points = tickets.reduce((n, t) => n + POINTS[t.size], 0);
  const squad = points <= 6 ? 2 : points <= 12 ? 3 : 4;
  const sprints = Math.min(4, Math.max(1, Math.ceil(points / (squad * 2.5))));
  return { points, squad, sprints };
}

/** Plain-text version for the application's backlog field. */
export function planToText(plan: SprintPlan): string {
  return [
    plan.summary,
    "",
    ...plan.tickets.map((t) => `- [${t.size}] ${t.title} (${t.area})`),
    "",
    `Suggested: ${plan.squad_size} builders, ${plan.sprints} sprint${plan.sprints > 1 ? "s" : ""}.`,
  ].join("\n");
}
