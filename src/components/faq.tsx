"use client";

import { Plus } from "lucide-react";
import { FAQ } from "@/lib/content";
import { Container, Reveal, SectionHeader } from "./ui";

export function Faq() {
  return (
    <section id="faq" className="relative py-28 sm:py-40">
      <Container>
        <SectionHeader
          index="05"
          label="Questions"
          title={
            <>
              Asked and <span className="serif-accent text-accent">answered.</span>
            </>
          }
        />

        <div className="mt-20 grid gap-14 lg:grid-cols-2 lg:gap-10">
          {(
            [
              ["For founders", FAQ.founders],
              ["For builders", FAQ.builders],
            ] as const
          ).map(([label, items], col) => (
            <Reveal key={label} delay={col * 0.08}>
              <h3 className="font-mono text-xs text-subtle">{label}</h3>
              <div className="mt-4 border-t border-line">
                {items.map((item) => (
                  <details key={item.q} className="group border-b border-line">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-[17px] font-medium text-fg transition-colors duration-300 hover:text-accent [&::-webkit-details-marker]:hidden">
                      {item.q}
                      <span className="grid size-8 shrink-0 place-items-center rounded-full ring-1 ring-line-strong transition-transform duration-500 ease-fluid group-open:rotate-45">
                        <Plus className="size-4" strokeWidth={1.75} aria-hidden />
                      </span>
                    </summary>
                    <p className="max-w-xl pr-12 pb-6 text-[15px] leading-relaxed text-muted">{item.a}</p>
                  </details>
                ))}
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
