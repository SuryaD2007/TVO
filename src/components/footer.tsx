"use client";

import { useEffect, useState } from "react";
import { CONTACT, NAV_LINKS } from "@/lib/content";
import { useApply } from "./apply-context";
import { Logo } from "./logo";
import { Button, Container, LiveDot, Reveal } from "./ui";

const LINK_GROUPS = [
  { title: "Syndicate", links: NAV_LINKS },
  {
    title: "Connect",
    links: [
      { label: "Email", href: `mailto:${CONTACT.email}` },
      { label: "LinkedIn", href: CONTACT.linkedin },
      { label: "Privacy", href: "/privacy" },
    ],
  },
];

function useAustinClock() {
  const [time, setTime] = useState<string | null>(null);
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Chicago",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    const tick = () => setTime(fmt.format(new Date()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

export function Footer() {
  const time = useAustinClock();
  const { openApply } = useApply();

  return (
    <footer className="relative overflow-hidden">
      <Container className="pt-28 sm:pt-40">
        {/* Closing statement */}
        <Reveal>
          <div className="flex flex-col gap-10 border-b border-line pb-20 lg:flex-row lg:items-end lg:justify-between">
            <h2 className="max-w-[12ch] text-[3rem] leading-[0.95] font-medium tracking-[-0.05em] sm:text-7xl lg:text-8xl">
              Ship something <span className="serif-accent text-accent">real.</span>
            </h2>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-stretch">
              <Button size="lg" onClick={() => openApply("startup")} className="justify-between">
                Deploy an Engineering Sprint
              </Button>
              <Button size="lg" variant="secondary" onClick={() => openApply("builder")} className="justify-between">
                Apply as a Builder
              </Button>
            </div>
          </div>
        </Reveal>

        <div className="grid gap-12 py-16 md:grid-cols-12">
          <div className="md:col-span-6">
            <Logo />
            <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-muted">
              UT Austin&apos;s external engineering syndicate, shipping production code for
              Austin&apos;s venture-backed startups.
            </p>
          </div>
          {LINK_GROUPS.map((g) => (
            <nav key={g.title} aria-label={g.title} className="md:col-span-3">
              <p className="font-mono text-xs text-subtle">{g.title}</p>
              <ul className="mt-5 space-y-1">
                {g.links.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      className="inline-flex min-h-9 items-center text-[15px] text-muted transition-colors duration-300 hover:text-fg"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* Terminal status line */}
        <div className="overflow-x-auto border-t border-line py-5 font-mono text-xs">
          <div className="flex min-w-max items-center gap-x-6 text-subtle">
            <span className="flex items-center gap-2.5 text-fg">
              <LiveDot className="size-1.5" /> recruiting founding cohort
            </span>
            <span>
              cohort=<span className="text-muted">01</span>
            </span>
            <span>
              status=<span className="text-muted">forming</span>
            </span>
            <span>
              region=<span className="text-muted">atx</span>
            </span>
            <span>
              local_time=<span className="text-muted tabular-nums">{time ?? "--:--:--"}</span> CT
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-line py-6 text-xs text-subtle sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Texas Venture Operators</p>
          <p className="max-w-xl sm:text-right">
            A student organization at The University of Texas at Austin. Not an official unit of the
            university.
          </p>
        </div>
      </Container>

      {/* Oversized wordmark, cropped by the viewport edge */}
      <svg
        aria-hidden
        viewBox="0 0 1000 300"
        className="pointer-events-none -mb-[4vw] block w-full select-none"
      >
        <text
          x="500"
          y="290"
          textAnchor="middle"
          fontSize="400"
          fontWeight="600"
          letterSpacing="-28"
          fill="currentColor"
          className="text-fg/[0.035] font-sans"
        >
          TVO
        </text>
      </svg>
    </footer>
  );
}
