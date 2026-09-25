"use client";

import { Building2, GraduationCap, Landmark, Network } from "lucide-react";
import { ECOSYSTEM_NODES } from "@/lib/content";
import { useApply } from "./apply-context";
import { Bezel, Button, Container, LiveDot, Reveal, SectionHeader } from "./ui";

const NODE_ICONS = [Network, Building2, Landmark, GraduationCap];
// Node positions in the diagram, as % of its box
const POSITIONS = [
  { x: 27, y: 18 },
  { x: 73, y: 18 },
  { x: 27, y: 82 },
  { x: 73, y: 82 },
];

const FOUNDER_BENEFITS = [
  "Scoped against your existing backlog",
  "Work lands as PRs in your repo, under your review",
  "Vetted builders with a TVO lead accountable for delivery",
  "Fixed-length sprints with a clear handoff",
];

export function Ecosystem() {
  const { openApply } = useApply();

  return (
    <section id="ecosystem" className="relative py-28 sm:py-40">
      <Container>
        <SectionHeader
          index="03"
          label="For startups"
          title={
            <>
              Your backlog, cleared by a{" "}
              <span className="serif-accent text-accent">vetted strike team.</span>
            </>
          }
        />

        <div className="mt-20 grid gap-12 lg:grid-cols-12 lg:gap-8">
          <Reveal className="flex flex-col lg:col-span-5">
            <p className="max-w-md text-[17px] leading-relaxed text-muted">
              Built for seed and Series A teams in Austin whose roadmap is bigger than their
              engineering headcount. TVO sits between UT Austin&apos;s engineering talent and the
              incubators, networks, and funds building the city&apos;s next companies.
            </p>

            <ol className="mt-10 border-t border-line">
              {FOUNDER_BENEFITS.map((b, i) => (
                <li key={b} className="flex gap-5 border-b border-line py-4 text-[15px] text-fg/90">
                  <span className="w-6 shrink-0 font-mono text-xs leading-6 text-accent">0{i + 1}</span>
                  {b}
                </li>
              ))}
            </ol>

            <div className="mt-10 flex flex-col gap-5 sm:flex-row sm:items-center">
              <Button size="lg" onClick={() => openApply("startup")} className="justify-between sm:justify-center">
                Deploy an Engineering Sprint
              </Button>
              <a
                href="#planner"
                className="inline-flex h-13 items-center justify-center rounded-full px-5 text-[15px] text-muted transition-colors duration-300 hover:text-fg"
              >
                Or scope it first →
              </a>
            </div>
            <p className="mt-6 flex items-center gap-2.5 font-mono text-xs text-muted">
              <LiveDot className="size-1.5" /> Now scoping pilot sprints with founding partners
            </p>
          </Reveal>

          <Reveal delay={0.1} className="lg:col-span-7">
            <Bezel coreClassName="relative overflow-hidden">
              <div className="bg-grid absolute inset-0 [mask-image:none]" aria-hidden />
              <div
                className="relative aspect-square w-full sm:aspect-[4/3]"
                role="img"
                aria-label="TVO connects Austin startup hubs, local incubators, Austin seed funds, and UT Austin engineering"
              >
                <svg className="absolute inset-0 size-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
                  {POSITIONS.map((p, i) => (
                    <line
                      key={i}
                      x1="50"
                      y1="50"
                      x2={p.x}
                      y2={p.y}
                      stroke="#ffa559"
                      strokeOpacity="0.45"
                      strokeWidth="1"
                      strokeDasharray="3 4"
                      vectorEffect="non-scaling-stroke"
                      className="[animation:dash_1.4s_linear_infinite]"
                    />
                  ))}
                </svg>

                {/* Hub */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <div className="absolute inset-0 -m-10 rounded-full bg-accent/15 blur-3xl" aria-hidden />
                  <div className="relative flex size-24 items-center justify-center rounded-full bg-accent text-accent-ink shadow-[inset_0_1px_0_rgb(255_255_255/0.4)] sm:size-28">
                    <span className="text-xl font-semibold tracking-[-0.03em]">TVO</span>
                  </div>
                </div>

                {ECOSYSTEM_NODES.map((node, i) => {
                  const Icon = NODE_ICONS[i];
                  return (
                    <div
                      key={node.name}
                      className="absolute -translate-x-1/2 -translate-y-1/2"
                      style={{ left: `${POSITIONS[i].x}%`, top: `${POSITIONS[i].y}%` }}
                    >
                      <div className="flex items-center gap-2 rounded-full bg-surface py-1.5 pr-3.5 pl-1.5 whitespace-nowrap ring-1 ring-line-strong">
                        <span className="grid size-6 place-items-center rounded-full bg-fg/[0.06]">
                          <Icon className="size-3.5 text-accent" strokeWidth={1.5} aria-hidden />
                        </span>
                        <span className="text-xs font-medium text-fg">{node.name}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Bezel>
          </Reveal>
        </div>

        <div className="mt-20 grid border-t border-line sm:grid-cols-2 lg:grid-cols-4">
          {ECOSYSTEM_NODES.map((node, i) => {
            const Icon = NODE_ICONS[i];
            return (
              <Reveal
                key={node.name}
                delay={i * 0.06}
                className="border-b border-line py-8 sm:px-6 sm:[&:nth-child(odd)]:pl-0 lg:border-b-0 lg:border-l lg:first:border-l-0 lg:first:pl-0"
              >
                <Icon className="size-5 text-accent" strokeWidth={1.5} aria-hidden />
                <p className="mt-6 font-mono text-xs text-subtle">{node.kind}</p>
                <h3 className="mt-1.5 text-lg font-medium tracking-[-0.02em] text-fg">{node.name}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-muted">{node.body}</p>
              </Reveal>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
