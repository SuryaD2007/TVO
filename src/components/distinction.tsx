"use client";

import { Building2, GitMerge, ShieldCheck } from "lucide-react";
import { PILLARS, STACK_MARQUEE } from "@/lib/content";
import { Bezel, cn, Container, Reveal, SectionHeader } from "./ui";

const ICONS = [Building2, GitMerge, ShieldCheck];

const DIFF = [
  { sign: " ", code: "export async function exportLedger(accountId: string) {" },
  { sign: "-", code: "  throw new Error(\"not implemented\");" },
  { sign: "+", code: "  const rows = await db.ledger.findMany({ where: { accountId } });" },
  { sign: "+", code: "  return toCSV(rows, LEDGER_COLUMNS);" },
  { sign: " ", code: "}" },
];

export function Distinction() {
  const [companies, production, builders] = PILLARS;

  return (
    <section id="syndicate" className="relative py-28 sm:py-40">
      <Container>
        <SectionHeader
          index="01"
          label="The Syndicate"
          title={
            <>
              Real companies. Real code.{" "}
              <span className="serif-accent text-accent">Real deploys.</span>
            </>
          }
          description="TVO is an external engineering syndicate. We put UT Austin's strongest builders to work on the live backlogs of venture-backed Austin startups, and we measure ourselves by what ships."
        />

        <div className="mt-20 grid gap-4 lg:grid-cols-12 lg:grid-rows-2">
          {/* Feature: production code */}
          <Reveal className="min-w-0 lg:col-span-7 lg:row-span-2">
            <Bezel coreClassName="flex flex-col p-7 sm:p-10">
              <PillarHeading pillar={production} icon={ICONS[1]} featured />

              <div className="mt-10 overflow-hidden rounded-2xl bg-ink ring-1 ring-line">
                <div className="flex items-center justify-between gap-4 border-b border-line px-4 py-3">
                  <span className="truncate font-mono text-xs text-muted">
                    feat/ledger-export <span className="text-subtle">→</span> main
                  </span>
                  <span className="shrink-0 rounded-full bg-accent/15 px-2.5 py-0.5 text-[11px] font-medium text-accent">
                    Approved
                  </span>
                </div>
                <pre className="overflow-x-auto py-3 font-mono text-[12.5px] leading-6" aria-label="Example code change">
                  {DIFF.map((l, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex px-4",
                        l.sign === "+" && "bg-accent/[0.07] text-fg",
                        l.sign === "-" && "text-subtle line-through decoration-subtle/50",
                        l.sign === " " && "text-muted",
                      )}
                    >
                      <span className={cn("w-5 shrink-0 select-none", l.sign === "+" ? "text-accent" : "text-subtle")}>
                        {l.sign}
                      </span>
                      <span className="whitespace-pre">{l.code}</span>
                    </div>
                  ))}
                </pre>
              </div>

              <ul className="mt-auto grid gap-x-6 gap-y-3 pt-10 sm:grid-cols-3">
                {production.points.map((p) => (
                  <li key={p} className="border-t border-line pt-3 text-sm text-muted">
                    {p}
                  </li>
                ))}
              </ul>
            </Bezel>
          </Reveal>

          {[companies, builders].map((pillar, i) => (
            <Reveal key={pillar.title} delay={0.08 + i * 0.08} className="min-w-0 lg:col-span-5">
              <Bezel coreClassName="flex flex-col p-7 sm:p-9">
                <PillarHeading pillar={pillar} icon={i === 0 ? ICONS[0] : ICONS[2]} />
                <ul className="mt-8 flex flex-wrap gap-2">
                  {pillar.points.map((p) => (
                    <li key={p} className="rounded-full px-3 py-1.5 text-[13px] text-muted ring-1 ring-line">
                      {p}
                    </li>
                  ))}
                </ul>
              </Bezel>
            </Reveal>
          ))}
        </div>
      </Container>

      {/* Stack marquee */}
      <div className="mt-28 border-y border-line py-6">
        <div
          className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,#000_12%,#000_88%,transparent)]"
          role="img"
          aria-label={`Builders ship in: ${STACK_MARQUEE.join(", ")}`}
        >
          <div className="flex w-max animate-marquee items-center hover:[animation-play-state:paused]" aria-hidden>
            {[...STACK_MARQUEE, ...STACK_MARQUEE].map((s, i) => (
              <span key={i} className="flex items-center text-2xl tracking-[-0.03em] text-subtle sm:text-3xl">
                <span className="px-8">{s}</span>
                <span className="size-1.5 rounded-full bg-accent/60" />
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function PillarHeading({
  pillar,
  icon: Icon,
  featured = false,
}: {
  pillar: (typeof PILLARS)[number];
  icon: typeof Building2;
  featured?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "grid size-11 place-items-center rounded-full",
            featured ? "bg-accent text-accent-ink" : "bg-fg/[0.05] text-fg",
          )}
        >
          <Icon className="size-5" strokeWidth={1.5} aria-hidden />
        </span>
        <span className="font-mono text-xs text-subtle">{pillar.kicker}</span>
      </div>
      <h3
        className={cn(
          "mt-8 font-medium tracking-[-0.03em] text-fg",
          featured ? "text-3xl sm:text-4xl" : "text-2xl",
        )}
      >
        {pillar.title}
      </h3>
      <p className={cn("mt-3 leading-relaxed text-muted", featured ? "max-w-md text-[17px]" : "text-[15px]")}>
        {pillar.body}
      </p>
    </div>
  );
}
