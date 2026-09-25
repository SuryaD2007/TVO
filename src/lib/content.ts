// Page copy and data. Everything here should stay literally true:
// TVO is pre-launch, so no traction numbers or named partners until confirmed.

export const CONTACT = {
  // Placeholders: replace with the real address and page.
  email: "hello@texasventureoperators.com",
  linkedin: "https://www.linkedin.com/",
};

export const NAV_LINKS = [
  { label: "Syndicate", href: "#syndicate" },
  { label: "How It Works", href: "#engine" },
  { label: "For Startups", href: "#ecosystem" },
  { label: "Apply", href: "#apply" },
] as const;

// How TVO works, not traction. `count` animates; `text` renders as-is.
export const HERO_METRICS = [
  { text: "2–4", label: "Builders per strike team" },
  { count: 14, suffix: "d", label: "Sprint cycle" },
  { text: "01", label: "Founding cohort, now forming" },
  { text: "0", label: "Side projects. Live backlogs only." },
] as const;

export const PILLARS = [
  {
    kicker: "Who we ship for",
    title: "Real companies",
    body: "Strike teams embed with locally funded Austin startups and work their live commercial backlogs.",
    points: ["Seed to Series A teams", "Scoped with the founder", "Real customers on the other end"],
    featured: false,
  },
  {
    kicker: "What we deliver",
    title: "Production code",
    body: "Every sprint ends in merged, deployed code that customers use.",
    points: ["PRs land in your repo", "Reviewed by your engineers", "Shipped through your CI"],
    featured: true,
  },
  {
    kicker: "Who ships it",
    title: "Vetted builders",
    body: "UT Austin engineers who clear a real technical bar before they touch your codebase.",
    points: ["Systems-design interview", "Repo-based take-home", "TVO lead on every squad"],
    featured: false,
  },
] as const;

export const ENGINE_STEPS = [
  {
    id: "scout",
    index: "01",
    title: "Scout & Vet",
    summary: "Rigorous technical evaluation",
    body:
      "Every builder clears a live systems-design interview, a timed take-home against a real codebase, and a code review with an operator. We keep each cohort small and selective.",
    specs: ["Systems-design interview", "Repo-based take-home", "Operator code review"],
    log: [
      { t: "00:00", msg: "candidate.pipeline → applications open", tone: "muted" },
      { t: "00:04", msg: "run take_home --repo=live-fixture", tone: "muted" },
      { t: "00:19", msg: "review: advance to systems round", tone: "accent" },
      { t: "00:31", msg: "offer: builder joins cohort", tone: "live" },
    ],
  },
  {
    id: "deploy",
    index: "02",
    title: "Strike Team Deployment",
    summary: "Embedding builders into startup backlogs",
    body:
      "Squads of 2–4 builders plus a TVO lead are embedded directly into a founder's repo, issue tracker, and standups. They inherit your conventions, CI, and review process from day one.",
    specs: ["2–4 builders + TVO lead", "Your repo, your CI", "Scoped against your backlog"],
    log: [
      { t: "D-01", msg: "match: squad → seed-stage startup", tone: "muted" },
      { t: "D+00", msg: "git clone && pnpm install ✓", tone: "muted" },
      { t: "D+01", msg: "backlog.scope → prioritized with founder", tone: "accent" },
      { t: "D+02", msg: "first PR opened: feat/ledger-export", tone: "live" },
    ],
  },
  {
    id: "ship",
    index: "03",
    title: "High-Velocity Ship",
    summary: "Clearing features and shipping to prod",
    body:
      "Fixed-length sprints end with merged, deployed, documented code. Founders get a demo, a changelog, and a handoff doc. No slideware, only what's running in production.",
    specs: ["Fixed-length sprints", "Merged + deployed", "Handoff docs"],
    log: [
      { t: "D+09", msg: "ci: all checks passed", tone: "muted" },
      { t: "D+11", msg: "merge feat/ledger-export → main", tone: "accent" },
      { t: "D+12", msg: "deploy production ✓", tone: "live" },
      { t: "D+14", msg: "sprint closed: handoff doc delivered", tone: "live" },
    ],
  },
] as const;

export const ECOSYSTEM_NODES = [
  {
    name: "Startup hubs",
    kind: "Venture network",
    body: "Austin's founder communities, where the teams we work with already gather.",
  },
  {
    name: "Local incubators",
    kind: "Pipeline",
    body: "Accelerator teams whose roadmap outpaces their engineering headcount.",
  },
  {
    name: "Austin seed funds",
    kind: "Capital",
    body: "Portfolio companies that need extra engineering capacity for a sprint.",
  },
  {
    name: "UT Austin engineering",
    kind: "Talent",
    body: "Builders sourced from ECE, CS, and the wider Forty Acres.",
  },
] as const;

export const STACK_MARQUEE = [
  "TypeScript", "Next.js", "Python", "Go", "Postgres", "React Native",
  "AWS", "GCP", "Kubernetes", "Rust", "Swift", "LLM tooling", "Terraform", "GraphQL",
];

export type Track = "startup" | "builder";
