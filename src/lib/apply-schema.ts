import type { Track } from "./content";

export type Field = {
  name: string;
  label: string;
  type: "text" | "email" | "url" | "textarea" | "select" | "chips";
  placeholder?: string;
  options?: string[];
  required?: boolean;
  hint?: string;
  /** Returns an error message, or null when valid. Runs after the required check. */
  validate?: (value: string) => string | null;
  span?: "full" | "half";
};

export type Step = { id: string; title: string; description: string; fields: Field[] };

const isUrl = (v: string) => {
  try {
    const u = new URL(v.startsWith("http") ? v : `https://${v}`);
    return u.hostname.includes(".");
  } catch {
    return false;
  }
};
const url = (v: string) => (isUrl(v) ? null : "Enter a valid URL.");
const email = (v: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : "Enter a valid email address.";
const utEmail = (v: string) =>
  email(v) ?? (/@(utexas\.edu|[a-z0-9-]+\.utexas\.edu)$/i.test(v) ? null : "Use your @utexas.edu email.");
const challengeCode = (v: string) =>
  /^OP-[0-9A-F]{6}-[0-9A-F]{10}$/i.test(v.trim()) ? null : "That doesn't look like a challenge code.";
const minLen = (n: number) => (v: string) =>
  v.trim().length >= n ? null : `Add a bit more detail (at least ${n} characters).`;

const STACK = ["TypeScript", "React", "Python", "Go", "Rust", "Swift / iOS", "Android", "Infra / DevOps", "ML / LLMs", "Data"];

export const STEPS: Record<Track, Step[]> = {
  startup: [
    {
      id: "company",
      title: "Company",
      description: "Tell us who we'd be shipping for.",
      fields: [
        { name: "company", label: "Company name", type: "text", required: true, placeholder: "Acme Robotics", span: "half" },
        { name: "website", label: "Website", type: "url", required: true, placeholder: "acme.com", validate: url, span: "half" },
        { name: "stage", label: "Stage", type: "select", required: true, options: ["Pre-seed", "Seed", "Series A", "Series B+", "Incubator cohort"], span: "half" },
        { name: "backer", label: "Lead investor or incubator", type: "text", placeholder: "Optional", span: "half" },
      ],
    },
    {
      id: "scope",
      title: "Backlog",
      description: "What should a strike team clear?",
      fields: [
        { name: "backlog", label: "What's on the backlog?", type: "textarea", required: true, placeholder: "e.g. usage-based billing on Stripe, an admin dashboard, and a webhook retry queue.", validate: minLen(30) },
        { name: "stack", label: "Your stack", type: "chips", required: true, options: STACK, hint: "Pick all that apply." },
        { name: "timeline", label: "Ideal start", type: "select", required: true, options: ["ASAP", "Within 1 month", "Next semester", "Exploring"], span: "half" },
      ],
    },
    {
      id: "contact",
      title: "Contact",
      description: "Who should our operators reach?",
      fields: [
        { name: "name", label: "Full name", type: "text", required: true, placeholder: "Jordan Lee", span: "half" },
        { name: "role", label: "Role", type: "text", required: true, placeholder: "CTO", span: "half" },
        { name: "email", label: "Work email", type: "email", required: true, placeholder: "jordan@acme.com", validate: email },
      ],
    },
  ],
  builder: [
    {
      id: "about",
      title: "About you",
      description: "The basics. UT Austin students only.",
      fields: [
        { name: "name", label: "Full name", type: "text", required: true, placeholder: "Sam Rivera", span: "half" },
        { name: "email", label: "UT email", type: "email", required: true, placeholder: "you@utexas.edu", validate: utEmail, span: "half" },
        { name: "major", label: "Major", type: "text", required: true, placeholder: "Electrical & Computer Engineering", span: "half" },
        { name: "grad", label: "Graduation year", type: "select", required: true, options: ["2026", "2027", "2028", "2029", "2030"], span: "half" },
      ],
    },
    {
      id: "skills",
      title: "Stack",
      description: "Where you're most dangerous.",
      fields: [
        { name: "stack", label: "Strongest areas", type: "chips", required: true, options: STACK, hint: "Pick up to a few." },
        { name: "github", label: "GitHub", type: "url", required: true, placeholder: "github.com/you", validate: url, span: "half" },
        { name: "portfolio", label: "Portfolio / LinkedIn", type: "url", placeholder: "Optional", validate: url, span: "half" },
      ],
    },
    {
      id: "proof",
      title: "Proof of work",
      description: "Show us something you've shipped.",
      fields: [
        { name: "shipped", label: "The most impressive thing you've shipped", type: "textarea", required: true, placeholder: "What it was, what you built, who used it, and a link if you have one.", validate: minLen(60) },
        { name: "hours", label: "Weekly availability", type: "select", required: true, options: ["8–12 hrs", "12–20 hrs", "20+ hrs"], span: "half" },
        { name: "challenge", label: "Challenge code", type: "text", placeholder: "OP-XXXXXX-XXXXXXXXXX", hint: "Solved the terminal challenge? Paste your code. Press / anywhere on the site to find it.", validate: challengeCode, span: "half" },
      ],
    },
  ],
};

export type Values = Record<string, string>;

export function validateField(field: Field, value: string | undefined): string | null {
  const v = (value ?? "").trim();
  if (!v) return field.required ? `${field.label} is required.` : null;
  return field.validate?.(v) ?? null;
}

export function validateStep(step: Step, values: Values) {
  const errors: Record<string, string> = {};
  for (const f of step.fields) {
    const err = validateField(f, values[f.name]);
    if (err) errors[f.name] = err;
  }
  return errors;
}
