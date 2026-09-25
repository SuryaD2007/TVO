"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Check, CircleDashed, GitPullRequest, Terminal } from "lucide-react";
import { useEffect, useState } from "react";
import { HERO_METRICS } from "@/lib/content";
import { useApply } from "./apply-context";
import { Bezel, Button, cn, Container, Counter, EASE, LiveDot } from "./ui";

const TICKETS = [
  { id: "ENG-412", title: "Stripe usage-based billing", squad: "alpha" },
  { id: "ENG-418", title: "Ledger CSV export", squad: "bravo" },
  { id: "ENG-421", title: "Onboarding flow v2", squad: "alpha" },
  { id: "ENG-427", title: "Postgres read replicas", squad: "charlie" },
  { id: "ENG-430", title: "Webhook retry queue", squad: "bravo" },
];

const rise = (delay: number) => ({
  initial: { opacity: 0, y: 32, filter: "blur(8px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  transition: { duration: 1, ease: EASE, delay },
});

export function Hero() {
  const { openApply } = useApply();

  return (
    <section id="top" className="relative overflow-hidden pt-36 pb-24 sm:pt-48 sm:pb-32">
      <div className="bg-grid pointer-events-none absolute inset-0" aria-hidden />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 right-[-10%] h-[560px] w-[760px] rounded-full bg-accent/[0.07] blur-[140px]"
      />

      <Container className="relative">
        <motion.div {...rise(0)} className="flex items-center gap-3 font-mono text-xs text-muted">
          <LiveDot />
          <span>
            System status <span className="text-subtle">/</span>{" "}
            <span className="text-fg">Cohort 01 forming</span>
          </span>
        </motion.div>

        <motion.h1
          {...rise(0.08)}
          className="mt-8 max-w-[14ch] text-[3.25rem] leading-[0.92] font-medium tracking-[-0.055em] sm:text-7xl lg:text-[7.25rem]"
        >
          High-velocity engineering for{" "}
          <span className="serif-accent text-accent">Austin startups.</span>
        </motion.h1>

        <div className="mt-14 grid gap-12 lg:mt-20 lg:grid-cols-12 lg:gap-10">
          <motion.div {...rise(0.18)} className="lg:col-span-5">
            <p className="max-w-md text-lg leading-relaxed text-pretty text-muted">
              Texas Venture Operators is UT Austin&apos;s external engineering syndicate. We embed
              vetted student builders into locally funded startups to clear live commercial
              backlogs and ship production code.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button size="lg" onClick={() => openApply("startup")} className="justify-between sm:justify-center">
                Deploy an Engineering Sprint
              </Button>
              <Button
                size="lg"
                variant="secondary"
                icon={Terminal}
                onClick={() => openApply("builder")}
                className="justify-between sm:justify-center"
              >
                Apply as a Builder
              </Button>
            </div>
          </motion.div>

          <motion.dl
            {...rise(0.26)}
            className="grid grid-cols-2 self-end border-t border-line lg:col-span-6 lg:col-start-7"
          >
            {HERO_METRICS.map((m, i) => (
              <div
                key={m.label}
                className={cn(
                  "flex flex-col gap-2 border-b border-line py-6",
                  i % 2 === 0 ? "pr-6" : "border-l pl-6",
                )}
              >
                <dt className="order-2 text-sm leading-snug text-subtle">{m.label}</dt>
                <dd className="order-1 font-serif text-5xl leading-none tracking-tight text-fg">
                  {"count" in m ? <Counter value={m.count} suffix={m.suffix} /> : m.text}
                </dd>
              </div>
            ))}
          </motion.dl>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: EASE, delay: 0.4 }}
          className="mt-20 lg:mt-28"
        >
          <SprintConsole />
        </motion.div>
      </Container>
    </section>
  );
}

type Status = "queued" | "review" | "merged";

function SprintConsole() {
  const reduce = useReducedMotion();
  const [tick, setTick] = useState(0);
  // Reduced motion: hold a static, mostly-shipped frame instead of cycling
  const cursor = reduce ? TICKETS.length - 1 : tick;

  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => setTick((c) => (c >= TICKETS.length ? 0 : c + 1)), 1800);
    return () => clearInterval(id);
  }, [reduce]);

  const statusOf = (i: number): Status =>
    i < cursor ? "merged" : i === cursor ? "review" : "queued";
  const merged = Math.min(cursor, TICKETS.length);

  return (
    <Bezel className="rounded-[2rem]" coreClassName="overflow-hidden rounded-[calc(2rem-6px)]">
      <div className="flex items-center justify-between border-b border-line px-5 py-4 sm:px-6">
        <span className="font-mono text-xs text-subtle">example-sprint / backlog</span>
        <span className="rounded-full bg-fg/[0.05] px-2.5 py-1 font-mono text-[11px] text-muted">
          preview
        </span>
      </div>

      <div className="grid md:grid-cols-[1fr_280px]">
        <ul aria-label="Example sprint backlog">
          {TICKETS.map((t, i) => {
            const status = statusOf(i);
            return (
              <li
                key={t.id}
                className="flex items-center gap-4 border-b border-line px-5 py-4 last:border-b-0 sm:px-6"
              >
                <StatusIcon status={status} />
                <span className="hidden w-16 font-mono text-xs text-subtle sm:inline">{t.id}</span>
                <span
                  className={cn(
                    "min-w-0 flex-1 truncate text-[15px] transition-colors duration-500",
                    status === "merged" ? "text-subtle" : "text-fg",
                  )}
                >
                  {t.title}
                </span>
                <span className="hidden font-mono text-xs text-subtle lg:inline">squad/{t.squad}</span>
                <StatusPill status={status} />
              </li>
            );
          })}
        </ul>

        <div className="flex flex-col justify-between gap-8 border-t border-line p-6 md:border-t-0 md:border-l">
          <div>
            <p className="text-sm text-subtle">Shipped this sprint</p>
            <p className="mt-3 font-serif text-6xl leading-none text-fg tabular-nums">
              {merged}
              <span className="text-subtle">/{TICKETS.length}</span>
            </p>
            <div className="mt-5 h-1 overflow-hidden rounded-full bg-fg/[0.06]">
              <motion.div
                className="h-full origin-left rounded-full bg-accent"
                animate={{ scaleX: merged / TICKETS.length }}
                initial={false}
                transition={{ duration: 0.8, ease: EASE }}
              />
            </div>
          </div>
          <div className="space-y-1.5 font-mono text-xs leading-relaxed">
            <p className="text-subtle">$ tvo deploy --env=prod</p>
            <p className="text-muted">ci checks passed</p>
            <p className="text-accent">shipped to production</p>
          </div>
        </div>
      </div>
    </Bezel>
  );
}

function StatusIcon({ status }: { status: Status }) {
  if (status === "merged")
    return (
      <span className="grid size-5 shrink-0 place-items-center rounded-full bg-accent text-accent-ink">
        <Check className="size-3" strokeWidth={3} />
      </span>
    );
  if (status === "review") return <GitPullRequest className="size-5 shrink-0 text-fg" strokeWidth={1.5} />;
  return <CircleDashed className="size-5 shrink-0 text-subtle" strokeWidth={1.5} />;
}

function StatusPill({ status }: { status: Status }) {
  const label = { queued: "Queued", review: "In review", merged: "Merged" }[status];
  return (
    <span
      className={cn(
        "w-[80px] shrink-0 rounded-full px-2.5 py-1 text-center text-[11px] font-medium transition-colors duration-500",
        status === "merged" && "bg-accent/15 text-accent",
        status === "review" && "bg-fg/[0.08] text-fg",
        status === "queued" && "text-subtle ring-1 ring-line",
      )}
    >
      {label}
    </span>
  );
}
