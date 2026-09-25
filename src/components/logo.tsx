import { cn } from "@/lib/cn";

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <svg viewBox="0 0 32 32" className="size-7 shrink-0" aria-hidden>
        <rect width="32" height="32" rx="9" fill="#ffa559" />
        {/* T crossbar + downward chevron: the operator pointing to deployment */}
        <path d="M9 10h14" stroke="#1a0f05" strokeWidth="2.6" strokeLinecap="round" />
        <path
          d="M11 15.5l5 6.5 5-6.5"
          fill="none"
          stroke="#1a0f05"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="text-[15px] font-semibold tracking-[-0.02em] text-fg">
        {compact ? "TVO" : "Texas Venture Operators"}
      </span>
    </span>
  );
}
