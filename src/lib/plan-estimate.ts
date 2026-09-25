import { sizing, type PlanTicket, type SprintPlan } from "./plan";

// Keyword heuristic used when Claude isn't configured or a call fails.
const LARGE = /migrat|integrat|real-?time|payment|billing|stripe|auth|sso|infra|replica|pipeline|model|search|sync|queue|scal|rewrite|architecture/i;
const SMALL = /fix|bug|copy|style|button|typo|tweak|small|rename|color|colour|icon|label/i;
const AREA_RULES: [PlanTicket["area"], RegExp][] = [
  ["ai", /\b(ai|llm|gpt|claude|ml|model|embedding|recommend)/i],
  ["mobile", /\b(ios|android|mobile|app store|react native|swift)/i],
  ["infra", /infra|deploy|\bci\b|kubernetes|docker|aws|gcp|replica|scal|monitor|devops|terraform/i],
  ["data", /data|analytics|report|export|csv|etl|warehouse|dashboard metric|sql/i],
  ["design", /design|figma|brand|ux|ui polish|redesign/i],
  ["backend", /\bapi\b|webhook|endpoint|handler|server|database|postgres|queue|billing|stripe|payment|notification|email|sms|messaging/i],
  ["frontend", /\bpage|\bui\b|screen|dashboard|onboarding|flow|\bform|component|landing|frontend|react|\bweb\b/i],
];

export function estimatePlan(backlog: string): SprintPlan {
  const items = backlog
    .split(/\n|;|•|(?:^|\s)[-*]\s|(?<=[.!?])\s+(?=[A-Z])/)
    .flatMap((s) => (s.length > 90 ? s.split(/,\s*(?:and\s+)?|\s+and\s+/) : [s]))
    .map((s) => s.replace(/^[\s\d.)\-*]+/, "").replace(/[.\s]+$/, "").trim())
    .filter((s) => s.length > 3)
    .slice(0, 10);

  const tickets: PlanTicket[] = (items.length ? items : [backlog.trim().slice(0, 80)]).map((raw) => {
    const title = raw.charAt(0).toUpperCase() + raw.slice(1, 72);
    return {
      title,
      area: AREA_RULES.find(([, re]) => re.test(raw))?.[0] ?? "backend",
      size: LARGE.test(raw) ? "L" : SMALL.test(raw) ? "S" : "M",
      notes: "",
    };
  });

  const { squad, sprints } = sizing(tickets);
  return {
    summary: `${tickets.length} scoped item${tickets.length > 1 ? "s" : ""}, sized from keywords. We refine this with you on a scoping call.`,
    tickets,
    squad_size: squad,
    sprints,
    risks: [],
    source: "estimate",
  };
}
