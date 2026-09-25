"use client";

import { AnimatePresence, motion } from "framer-motion";
import { SquareTerminal } from "lucide-react";
import { useEffect, useState } from "react";
import { NAV_LINKS } from "@/lib/content";
import { useApply } from "./apply-context";
import { Logo } from "./logo";
import { Button, cn, EASE } from "./ui";

export function Navbar() {
  const { openApply, setTerminalOpen } = useApply();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const joinCohort = () => {
    setOpen(false);
    openApply("builder");
  };

  return (
    <>
      <header className="fixed inset-x-0 top-4 z-50 flex justify-center px-4 sm:top-6">
        <motion.nav
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: EASE }}
          aria-label="Primary"
          className={cn(
            "flex h-14 w-full max-w-[880px] items-center justify-between gap-6 rounded-full pr-1.5 pl-4 backdrop-blur-xl",
            "ring-1 transition-[background-color,box-shadow] duration-700 ease-fluid",
            scrolled || open
              ? "bg-ink/80 shadow-[0_20px_50px_-20px_rgb(0_0_0/0.9)] ring-line-strong"
              : "bg-ink/40 ring-line",
          )}
        >
          <a href="#top" aria-label="Texas Venture Operators, back to top" className="flex rounded-full">
            <Logo compact />
          </a>

          <ul className="hidden items-center md:flex">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="rounded-full px-4 py-2 text-sm text-muted transition-colors duration-300 hover:text-fg"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setTerminalOpen(true)}
              aria-label="Open terminal (press /)"
              title="Open terminal (/)"
              className="hidden h-11 items-center gap-2 rounded-full px-3 text-muted transition-colors duration-300 hover:bg-fg/[0.05] hover:text-fg md:flex"
            >
              <SquareTerminal className="size-[18px]" strokeWidth={1.5} />
              <kbd className="grid size-5 place-items-center rounded-md font-mono text-[11px] ring-1 ring-line-strong">/</kbd>
            </button>
            <div className="hidden sm:block">
              <Button onClick={joinCohort}>Join Cohort</Button>
            </div>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "Close menu" : "Open menu"}
              className="relative grid size-11 place-items-center rounded-full bg-fg/[0.05] md:hidden"
            >
              <span
                aria-hidden
                className={cn(
                  "absolute h-[1.5px] w-4.5 rounded-full bg-fg transition-transform duration-500 ease-fluid",
                  open ? "rotate-45" : "-translate-y-[4px]",
                )}
              />
              <span
                aria-hidden
                className={cn(
                  "absolute h-[1.5px] w-4.5 rounded-full bg-fg transition-transform duration-500 ease-fluid",
                  open ? "-rotate-45" : "translate-y-[4px]",
                )}
              />
            </button>
          </div>
        </motion.nav>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="fixed inset-0 z-40 flex flex-col bg-ink/90 px-6 pt-32 pb-10 backdrop-blur-3xl md:hidden"
          >
            <ul className="flex flex-col">
              {NAV_LINKS.map((link, i) => (
                <li key={link.href} className="overflow-hidden border-b border-line">
                  <motion.a
                    href={link.href}
                    onClick={() => setOpen(false)}
                    initial={{ y: "100%", opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.7, ease: EASE, delay: 0.08 + i * 0.06 }}
                    className="flex items-baseline justify-between py-5 text-4xl font-medium tracking-[-0.04em]"
                  >
                    {link.label}
                    <span className="font-mono text-xs text-subtle">0{i + 1}</span>
                  </motion.a>
                </li>
              ))}
            </ul>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE, delay: 0.35 }}
              className="mt-auto flex flex-col gap-3"
            >
              <Button
                variant="secondary"
                size="lg"
                icon={SquareTerminal}
                className="w-full justify-between"
                onClick={() => {
                  setOpen(false);
                  setTerminalOpen(true);
                }}
              >
                Open the terminal
              </Button>
              <Button onClick={joinCohort} size="lg" className="w-full justify-between">
                Join Cohort
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
