import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/logo";

export default function NotFound() {
  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden px-4">
      <div className="bg-grid pointer-events-none absolute inset-0" aria-hidden />
      <div
        aria-hidden
        className="pointer-events-none absolute top-[-10%] left-1/2 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-accent/[0.07] blur-[120px]"
      />
      <div className="relative flex max-w-md flex-col items-center text-center">
        <Logo />
        <p className="mt-10 font-mono text-sm text-subtle">
          <span className="text-accent">404</span> / route not found
        </p>
        <h1 className="mt-4 text-5xl leading-[0.95] font-medium tracking-[-0.05em] text-balance sm:text-7xl">
          Nothing shipped <span className="serif-accent text-accent">here.</span>
        </h1>
        <p className="mt-4 text-muted">This page doesn&apos;t exist, or it was never deployed.</p>
        <Link
          href="/"
          className="mt-10 inline-flex h-12 items-center gap-2 rounded-full bg-fg/[0.04] px-6 text-sm font-medium text-fg ring-1 ring-line-strong transition-colors duration-500 ease-fluid hover:bg-fg/[0.08]"
        >
          <ArrowLeft className="size-4" /> Back to TVO
        </Link>
      </div>
    </main>
  );
}
