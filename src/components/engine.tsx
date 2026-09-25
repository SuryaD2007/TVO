"use client";

import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { ENGINE_STEPS } from "@/lib/content";
import { Bezel, cn, Container, EASE, Reveal, SectionHeader } from "./ui";

const STEP_MS = 7000;

export function Engine() {
  const [active, setActive] = useState(0);
  const [autoplay, setAutoplay] = useState(true);
  const [paused, setPaused] = useState(false);
  const reduce = useReducedMotion();
  const sectionRef = useRef<HTMLDivElement>(null);
  const inView = useInView(sectionRef, { margin: "-20%" });
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const running = autoplay && !paused && inView && !reduce;

  useEffect(() => {
    if (!running) return;
    const id = setTimeout(() => setActive((a) => (a + 1) % ENGINE_STEPS.length), STEP_MS);
    return () => clearTimeout(id);
  }, [running, active]);

  const select = (i: number) => {
    setAutoplay(false); // a deliberate choice stops the tour
    setActive(i);
  };

  const onKeyDown = (e: KeyboardEvent) => {
    const n = ENGINE_STEPS.length;
    const map: Record<string, number> = {
      ArrowDown: (active + 1) % n,
      ArrowRight: (active + 1) % n,
      ArrowUp: (active - 1 + n) % n,
      ArrowLeft: (active - 1 + n) % n,
      Home: 0,
      End: n - 1,
    };
    if (!(e.key in map)) return;
    e.preventDefault();
    select(map[e.key]);
    tabRefs.current[map[e.key]]?.focus();
  };

  const step = ENGINE_STEPS[active];

  return (
    <section id="engine" className="relative bg-ink-2 py-28 sm:py-40">
      <Container>
        <SectionHeader
          index="02"
          label="How it works"
          title={
            <>
              The <span className="serif-accent text-accent">engine.</span>
            </>
          }
          description="A three-stage pipeline that turns UT Austin engineering talent into shipped features on your roadmap."
        />

        <Reveal className="mt-20">
          <div
            ref={sectionRef}
            className="grid gap-10 lg:grid-cols-12 lg:gap-8"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            <div
              role="tablist"
              aria-label="Engine stages"
              aria-orientation="vertical"
              onKeyDown={onKeyDown}
              className="flex flex-col border-t border-line lg:col-span-5"
            >
              {ENGINE_STEPS.map((s, i) => {
                const selected = i === active;
                return (
                  <button
                    key={s.id}
                    ref={(el) => {
                      tabRefs.current[i] = el;
                    }}
                    role="tab"
                    id={`tab-${s.id}`}
                    aria-selected={selected}
                    aria-controls={`panel-${s.id}`}
                    tabIndex={selected ? 0 : -1}
                    onClick={() => select(i)}
                    className="group relative flex items-start gap-6 border-b border-line py-7 text-left"
                  >
                    <span
                      className={cn(
                        "w-14 shrink-0 font-serif text-5xl leading-none transition-colors duration-500 ease-fluid",
                        selected ? "text-accent" : "text-fg/15 group-hover:text-fg/30",
                      )}
                    >
                      {s.index}
                    </span>
                    <span className="min-w-0 pt-1">
                      <span
                        className={cn(
                          "block text-xl font-medium tracking-[-0.02em] transition-colors duration-500",
                          selected ? "text-fg" : "text-muted group-hover:text-fg",
                        )}
                      >
                        {s.title}
                      </span>
                      <span className="mt-1 block text-[15px] text-subtle">{s.summary}</span>
                    </span>

                    {/* Autoplay progress */}
                    {selected && (
                      <span className="absolute inset-x-0 -bottom-px h-px" aria-hidden>
                        <motion.span
                          key={`${active}-${running}`}
                          className="block h-full origin-left bg-accent"
                          initial={{ scaleX: running ? 0 : 1 }}
                          animate={{ scaleX: 1 }}
                          transition={{ duration: running ? STEP_MS / 1000 : 0, ease: "linear" }}
                        />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <Bezel className="lg:col-span-7" coreClassName="relative min-h-[460px] overflow-hidden p-7 sm:p-10">
              <div role="tabpanel" id={`panel-${step.id}`} aria-labelledby={`tab-${step.id}`}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: -12, filter: "blur(4px)" }}
                    transition={{ duration: 0.5, ease: EASE }}
                  >
                    <p className="font-mono text-xs text-subtle">Stage {step.index}</p>
                    <h3 className="mt-4 text-3xl font-medium tracking-[-0.03em] text-fg sm:text-4xl">
                      {step.title}
                    </h3>
                    <p className="mt-4 max-w-lg text-[17px] leading-relaxed text-muted">{step.body}</p>

                    <ul className="mt-8 flex flex-wrap gap-2">
                      {step.specs.map((spec) => (
                        <li key={spec} className="rounded-full px-3 py-1.5 text-[13px] text-muted ring-1 ring-line">
                          {spec}
                        </li>
                      ))}
                    </ul>

                    <div className="mt-10 rounded-2xl bg-ink p-5 font-mono text-[12.5px] ring-1 ring-line">
                      <p className="mb-3 text-[11px] text-subtle">operator.log</p>
                      <ol className="space-y-2">
                        {step.log.map((line, i) => (
                          <motion.li
                            key={line.msg}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 + i * 0.16, duration: 0.5, ease: EASE }}
                            className="flex gap-4"
                          >
                            <span className="w-10 shrink-0 text-subtle">{line.t}</span>
                            <span
                              className={cn(
                                "min-w-0 break-words",
                                line.tone === "muted" && "text-muted",
                                line.tone === "accent" && "text-fg",
                                line.tone === "live" && "text-accent",
                              )}
                            >
                              {line.msg}
                            </span>
                          </motion.li>
                        ))}
                      </ol>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </Bezel>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
