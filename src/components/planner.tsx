"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Sparkles } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { planToText, type SprintPlan } from "@/lib/plan";
import { useApply } from "./apply-context";
import { Bezel, Button, cn, Container, EASE, Reveal, SectionHeader } from "./ui";

const EXAMPLES = [
  {
    label: "Fintech",
    text: "Usage-based billing on Stripe with metered invoices. Admin dashboard for ops to refund and comp accounts. Export ledger to CSV for our accountant. Fix the flaky webhook handler that double-charges.",
  },
  {
    label: "Marketplace",
    text: "Seller onboarding flow with ID verification\nSearch with filters by price and distance\nIn-app messaging between buyers and sellers\nEmail notifications for new offers",
  },
  {
    label: "Health",
    text: "HIPAA-friendly patient intake form, appointment reminders by SMS, a clinician dashboard showing today's visits, and move our Postgres to read replicas because reports are slow.",
  },
];

const LOADING_STEPS = ["Reading your backlog", "Breaking it into tickets", "Sizing the work", "Flagging risks", "Sketching the squad"];

export function Planner() {
  const { openApply } = useApply();
  const [backlog, setBacklog] = useState("");
  const [plan, setPlan] = useState<SprintPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inflight = useRef<AbortController | null>(null);

  useEffect(() => () => inflight.current?.abort(), []);

  const requestPlan = async (quick = false) => {
    inflight.current?.abort();
    const controller = new AbortController();
    inflight.current = controller;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ backlog, quick }),
        signal: controller.signal,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't plan that. Try again.");
      setPlan(data);
      setLoading(false);
    } catch (err) {
      if (controller.signal.aborted) return; // superseded by a newer request
      setError(err instanceof Error ? err.message : "Couldn't plan that. Try again.");
      setLoading(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (backlog.trim().length < 20) {
      setError("Add a bit more detail about what you need built.");
      return;
    }
    void requestPlan();
  };

  return (
    <section id="planner" className="relative py-28 sm:py-40">
      <Container>
        <SectionHeader
          index="04"
          label="Sprint planner"
          title={
            <>
              Scope it in <span className="serif-accent text-accent">thirty seconds.</span>
            </>
          }
          description="Paste your backlog the way it lives in your head. We'll break it into tickets, size the work, and suggest a squad. No signup required."
        />

        <div className="mt-20 grid gap-4 lg:grid-cols-12">
          <Reveal className="min-w-0 lg:col-span-5">
            <Bezel coreClassName="flex flex-col p-6 sm:p-8">
              <form onSubmit={onSubmit} className="flex h-full flex-col">
                <label htmlFor="planner-backlog" className="text-sm font-medium text-fg/90">
                  Your backlog
                </label>
                <textarea
                  id="planner-backlog"
                  value={backlog}
                  onChange={(e) => setBacklog(e.target.value)}
                  maxLength={4000}
                  rows={9}
                  placeholder="e.g. Usage-based billing on Stripe, an ops dashboard for refunds, and fix the webhook that double-charges…"
                  aria-invalid={!!error}
                  aria-describedby={error ? "planner-error" : "planner-hint"}
                  className="mt-3 w-full flex-1 resize-none rounded-xl bg-ink px-4 py-3.5 text-[16px] leading-relaxed text-fg ring-1 ring-line-strong outline-none placeholder:text-subtle/70 transition-shadow duration-300 focus:shadow-[0_0_0_4px_rgb(255_165_89/0.12)] focus:ring-accent/70 sm:text-[15px]"
                />

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span id="planner-hint" className="mr-1 text-xs text-subtle">
                    Try:
                  </span>
                  {EXAMPLES.map((ex) => (
                    <button
                      key={ex.label}
                      type="button"
                      onClick={() => {
                        setBacklog(ex.text);
                        setError("");
                      }}
                      className="h-8 rounded-full px-3 text-xs text-muted ring-1 ring-line-strong transition-colors duration-300 hover:bg-fg/[0.05] hover:text-fg"
                    >
                      {ex.label}
                    </button>
                  ))}
                  <span className="ml-auto font-mono text-[11px] text-subtle tabular-nums">{backlog.length}/4000</span>
                </div>

                {error && (
                  <p id="planner-error" role="alert" className="mt-4 flex items-center gap-2 text-sm text-red-300">
                    <AlertCircle className="size-4 shrink-0" /> {error}
                  </p>
                )}

                <Button
                  type="submit"
                  size="lg"
                  icon={Sparkles}
                  disabled={loading}
                  aria-busy={loading}
                  className="mt-6 w-full justify-between"
                >
                  {loading ? "Planning…" : "Plan my sprint"}
                </Button>
              </form>
            </Bezel>
          </Reveal>

          <Reveal delay={0.08} className="min-w-0 lg:col-span-7">
            <Bezel coreClassName="relative min-h-[520px] overflow-hidden p-6 sm:p-8">
              <AnimatePresence mode="wait">
                {loading ? (
                  <PlanLoading key="loading" onQuick={() => void requestPlan(true)} />
                ) : plan ? (
                  <PlanResult
                    key={plan.summary}
                    plan={plan}
                    onUse={() => openApply("startup", { backlog: planToText(plan).slice(0, 3900) })}
                  />
                ) : (
                  <PlanEmpty key="empty" />
                )}
              </AnimatePresence>
            </Bezel>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}

function PlanEmpty() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: EASE }}
      className="flex h-full min-h-[460px] flex-col"
    >
      <p className="font-mono text-xs text-subtle">sprint-plan.json</p>
      <div className="mt-6 space-y-3" aria-hidden>
        {[72, 58, 84, 46, 64].map((w, i) => (
          <div key={i} className="flex items-center gap-3 border-b border-line pb-3">
            <span className="h-5 w-7 rounded-full bg-fg/[0.05]" />
            <span className="h-3 rounded-full bg-fg/[0.05]" style={{ width: `${w}%` }} />
          </div>
        ))}
      </div>
      <p className="mt-auto max-w-sm pt-10 text-[15px] leading-relaxed text-subtle">
        Your plan appears here: tickets sized S, M, or L, a suggested squad, and the risks worth
        talking through.
      </p>
    </motion.div>
  );
}

function PlanLoading({ onQuick }: { onQuick: () => void }) {
  const [step, setStep] = useState(0);
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const id = setInterval(() => setStep((s) => Math.min(s + 1, LOADING_STEPS.length - 1)), 2000);
    const slowId = setTimeout(() => setSlow(true), 12_000);
    return () => {
      clearInterval(id);
      clearTimeout(slowId);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: EASE }}
      className="min-h-[460px]"
      role="status"
      aria-label="Planning your sprint"
    >
      <ol className="space-y-2.5 font-mono text-[13px]">
        {LOADING_STEPS.map((label, i) => (
          <li
            key={label}
            className={cn(
              "flex items-center gap-3 transition-colors duration-500",
              i < step ? "text-subtle" : i === step ? "text-fg" : "text-fg/15",
            )}
          >
            <span className={cn("size-1.5 rounded-full", i === step ? "animate-pulse bg-accent" : i < step ? "bg-accent/50" : "bg-fg/15")} />
            {label}
            {i < step && <span className="text-accent">✓</span>}
          </li>
        ))}
      </ol>

      <AnimatePresence>
        {slow && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="mt-8 flex flex-col gap-3 rounded-2xl bg-ink p-4 ring-1 ring-line sm:flex-row sm:items-center sm:justify-between"
          >
            <p className="text-sm text-muted">The AI is busy right now. Still working on it…</p>
            <button
              type="button"
              onClick={onQuick}
              className="h-9 shrink-0 rounded-full px-4 text-sm text-fg ring-1 ring-line-strong transition-colors duration-300 hover:bg-fg/[0.06]"
            >
              Get a quick estimate now
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-10 space-y-3" aria-hidden>
        {[80, 62, 90, 54].map((w, i) => (
          <div key={i} className="relative h-12 overflow-hidden rounded-xl bg-fg/[0.03]">
            <motion.div
              className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-fg/[0.06] to-transparent"
              animate={{ x: ["-100%", "300%"] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut", delay: i * 0.15 }}
              style={{ width: `${w / 2}%` }}
            />
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function PlanResult({ plan, onUse }: { plan: SprintPlan; onUse: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: EASE }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span
          className={cn(
            "rounded-full px-3 py-1 font-mono text-[11px]",
            plan.source === "ai" ? "bg-accent/15 text-accent ring-1 ring-accent/30" : "text-subtle ring-1 ring-line-strong",
          )}
        >
          {plan.source === "ai" ? "AI plan" : "Quick estimate"}
        </span>
        <span className="font-mono text-[11px] text-subtle">a starting point · we scope it with you</span>
      </div>

      <p className="mt-5 text-[17px] leading-relaxed text-fg">{plan.summary}</p>

      <dl className="mt-6 grid grid-cols-3 border-y border-line">
        {[
          { label: "Tickets", value: plan.tickets.length },
          { label: "Builders", value: plan.squad_size },
          { label: plan.sprints > 1 ? "Sprints" : "Sprint", value: plan.sprints },
        ].map((s, i) => (
          <div key={s.label} className={cn("py-4", i > 0 && "border-l border-line pl-5")}>
            <dt className="text-xs text-subtle">{s.label}</dt>
            <dd className="mt-1 font-serif text-4xl leading-none text-fg tabular-nums">{s.value}</dd>
          </div>
        ))}
      </dl>

      <ol className="mt-2">
        {plan.tickets.map((t, i) => (
          <motion.li
            key={`${t.title}-${i}`}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: EASE, delay: 0.15 + i * 0.06 }}
            className="flex items-start gap-3 border-b border-line py-3.5"
          >
            <span
              className={cn(
                "mt-px grid h-6 w-8 shrink-0 place-items-center rounded-full font-mono text-[11px] font-medium",
                t.size === "L" && "bg-accent text-accent-ink",
                t.size === "M" && "bg-accent/15 text-accent",
                t.size === "S" && "text-muted ring-1 ring-line-strong",
              )}
              aria-label={`Size ${t.size}`}
            >
              {t.size}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] text-fg">{t.title}</span>
              {t.notes && <span className="mt-0.5 block text-sm text-subtle">{t.notes}</span>}
            </span>
            <span className="shrink-0 font-mono text-[11px] text-subtle">{t.area}</span>
          </motion.li>
        ))}
      </ol>

      {plan.risks.length > 0 && (
        <div className="mt-6">
          <p className="text-xs text-subtle">Worth discussing</p>
          <ul className="mt-2 space-y-1.5">
            {plan.risks.map((r) => (
              <li key={r} className="flex gap-2.5 text-sm text-muted">
                <span className="mt-2 size-1 shrink-0 rounded-full bg-accent" aria-hidden />
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-subtle">Looks right? It&apos;ll prefill your sprint request.</p>
        <Button onClick={onUse} className="justify-between">
          Use this plan
        </Button>
      </div>
    </motion.div>
  );
}
