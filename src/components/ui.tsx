"use client";

import { animate, motion, useInView } from "framer-motion";
import { ArrowUpRight, type LucideIcon } from "lucide-react";
import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export { cn };

export const EASE = [0.32, 0.72, 0, 1] as const;

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "accent";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1 font-mono text-[11px] tracking-[0.08em]",
        tone === "neutral" && "bg-fg/[0.04] text-muted ring-1 ring-line",
        tone === "accent" && "bg-accent/10 text-accent ring-1 ring-accent/25",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function LiveDot({ className }: { className?: string }) {
  return (
    <span className={cn("relative flex size-2", className)} aria-hidden>
      <span className="absolute inset-0 animate-ping rounded-full bg-accent/50 [animation-duration:2s]" />
      <span className="relative size-full rounded-full bg-accent" />
    </span>
  );
}

type ButtonVariant = "primary" | "secondary" | "ghost";

/**
 * Pill button. Primary/secondary get a trailing icon in its own circle
 * (an up-right arrow unless `icon` says otherwise; pass null for none).
 */
export function Button({
  variant = "primary",
  size = "md",
  icon,
  className,
  children,
  ...props
}: ComponentProps<"button"> & {
  variant?: ButtonVariant;
  size?: "md" | "lg";
  icon?: LucideIcon | null;
}) {
  const Icon = icon === undefined ? (variant === "ghost" ? null : ArrowUpRight) : icon;
  return (
    <button
      className={cn(
        "group inline-flex items-center justify-center rounded-full font-medium whitespace-nowrap select-none",
        "transition-[background-color,box-shadow,transform,color] duration-500 ease-fluid active:scale-[0.98]",
        "disabled:opacity-50 disabled:active:scale-100",
        size === "md" ? "h-11 text-sm" : "h-13 text-[15px]",
        Icon ? (size === "md" ? "gap-3 pr-1.5 pl-5" : "gap-4 pr-1.5 pl-6") : "px-5",
        variant === "primary" &&
          "bg-accent text-accent-ink shadow-[inset_0_1px_0_rgb(255_255_255/0.35),0_10px_30px_-12px_rgb(255_165_89/0.6)] hover:bg-accent-soft",
        variant === "secondary" && "bg-fg/[0.04] text-fg ring-1 ring-line-strong hover:bg-fg/[0.08]",
        variant === "ghost" && "text-muted hover:text-fg",
        className,
      )}
      {...props}
    >
      <span className="inline-flex items-center gap-2">{children}</span>
      {Icon && (
        <span
          className={cn(
            "grid shrink-0 place-items-center rounded-full transition-transform duration-500 ease-fluid",
            "group-hover:translate-x-0.5 group-hover:-translate-y-px group-hover:scale-105",
            size === "md" ? "size-8" : "size-10",
            variant === "primary" ? "bg-accent-ink/10" : "bg-fg/[0.06]",
          )}
          aria-hidden
        >
          <Icon className="size-4" strokeWidth={1.75} />
        </span>
      )}
    </button>
  );
}

/** Left-aligned editorial section header with an index number and hairline. */
export function SectionHeader({
  index,
  label,
  title,
  description,
  className,
}: {
  index: string;
  label: string;
  title: ReactNode;
  description?: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Reveal>
        <div className="flex items-center gap-4 font-mono text-xs text-subtle">
          <span className="text-accent">{index}</span>
          <span className="h-px w-10 bg-line-strong" aria-hidden />
          <span className="tracking-[0.08em]">{label}</span>
        </div>
      </Reveal>
      <div className="mt-8 grid gap-6 lg:grid-cols-12 lg:items-end lg:gap-10">
        <Reveal delay={0.05} className="lg:col-span-7">
          <h2 className="text-[2.5rem] leading-[1] font-medium tracking-[-0.04em] text-balance sm:text-6xl">
            {title}
          </h2>
        </Reveal>
        {description && (
          <Reveal delay={0.12} className="lg:col-span-5 lg:pb-1.5">
            <p className="max-w-md text-[17px] leading-relaxed text-pretty text-muted">{description}</p>
          </Reveal>
        )}
      </div>
    </div>
  );
}

export function Reveal({
  children,
  className,
  delay = 0,
  y = 28,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.9, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

export function Counter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, value, {
      duration: 1.6,
      ease: EASE,
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, value]);

  return (
    <span ref={ref} className="tabular-nums">
      {/* Screen readers get the final value, not the animation frames */}
      <span aria-hidden>
        {display}
        {suffix}
      </span>
      <span className="sr-only">
        {value}
        {suffix}
      </span>
    </span>
  );
}

export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-7xl px-4 sm:px-8", className)}>{children}</div>;
}

/** Double-bezel card: outer tray + inner plate with concentric radii. */
export function Bezel({
  children,
  className,
  coreClassName,
}: {
  children: ReactNode;
  className?: string;
  coreClassName?: string;
}) {
  return (
    <div className={cn("bezel", className)}>
      <div className={cn("bezel-core h-full", coreClassName)}>{children}</div>
    </div>
  );
}
