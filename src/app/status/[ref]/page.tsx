import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/cn";
import { getPublicStatus, type PublicStatus } from "@/lib/store";

export const metadata: Metadata = {
  title: "Application status · Texas Venture Operators",
  robots: { index: false, follow: false },
};

const fmt = (iso: string) =>
  new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "America/Chicago" }).format(
    new Date(iso),
  );

export default async function StatusPage({ params, searchParams }: PageProps<"/status/[ref]">) {
  const { ref } = await params;
  const { t } = await searchParams;
  const token = typeof t === "string" ? t : "";

  let app: PublicStatus | null = null;
  if (/^TVO-[0-9A-F]{6}$/.test(ref) && /^[0-9a-f]{32}$/.test(token)) {
    try {
      app = await getPublicStatus(ref, token);
    } catch (err) {
      console.error("[status]", err);
    }
  }

  return (
    <main className="relative min-h-dvh overflow-hidden px-4 py-10 sm:py-16">
      <div className="bg-grid pointer-events-none absolute inset-0" aria-hidden />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 right-[-10%] h-[500px] w-[700px] rounded-full bg-accent/[0.07] blur-[140px]"
      />
      <div className="relative mx-auto max-w-2xl">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex rounded-full">
            <Logo />
          </Link>
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-fg">
            <ArrowLeft className="size-4" strokeWidth={1.75} /> Home
          </Link>
        </div>

        {app ? <StatusCard app={app} /> : <NotFound />}
      </div>
    </main>
  );
}

function StatusCard({ app }: { app: PublicStatus }) {
  const decided = app.status === "accepted" || app.status === "declined";
  const steps = [
    { title: "Received", detail: fmt(app.created_at), done: true },
    {
      title: "In review",
      detail: app.status === "new" ? "Up next" : "Operators are reading it",
      done: app.status !== "new",
    },
    {
      title: "Decision",
      detail: decided ? fmt(app.updated_at) : "Pending",
      done: decided,
    },
  ];

  const headline = {
    new: "You're in the queue.",
    reviewing: "An operator is reviewing it.",
    accepted: app.track === "builder" ? "Welcome to the syndicate." : "Let's scope your sprint.",
    declined: "Not this time.",
  }[app.status];

  const body = {
    new: "Thanks for applying. We read every application, and we'll update this page as it moves.",
    reviewing: "Your application is with the operators now. Watch your inbox for next steps.",
    accepted:
      app.track === "builder"
        ? "You've been accepted to the founding cohort. Check your UT email for onboarding details."
        : "We'd like to work with you. Check your email to set up a scoping call.",
    declined:
      app.track === "builder"
        ? "We couldn't offer a spot this cohort. Keep shipping; applications reopen next semester."
        : "We can't take this sprint right now, but we'd love to revisit it later.",
  }[app.status];

  return (
    <div className="bezel mt-16">
      <div className="bezel-core p-7 sm:p-10">
        <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
          <span className="rounded-full bg-ink px-3 py-1.5 text-muted ring-1 ring-line">
            ref <span className="text-fg">{app.ref}</span>
          </span>
          <span className="rounded-full bg-ink px-3 py-1.5 text-muted ring-1 ring-line">
            {app.track === "builder" ? "builder application" : "sprint request"}
          </span>
        </div>

        <h1 className="mt-8 text-4xl leading-[1] font-medium tracking-[-0.04em] sm:text-5xl">
          {app.first_name ? `${app.first_name}, ` : ""}
          <span className={cn(app.status !== "declined" && "serif-accent text-accent")}>
            {app.first_name ? headline.charAt(0).toLowerCase() + headline.slice(1) : headline}
          </span>
        </h1>
        <p className="mt-4 max-w-md text-[17px] leading-relaxed text-muted">{body}</p>

        <ol className="mt-12 border-t border-line">
          {steps.map((s, i) => {
            const current = !s.done && (i === 0 || steps[i - 1].done);
            return (
              <li key={s.title} className="flex items-center gap-5 border-b border-line py-5">
                <span
                  className={cn(
                    "grid size-8 shrink-0 place-items-center rounded-full font-mono text-xs",
                    s.done && "bg-accent text-accent-ink",
                    current && "text-accent ring-1 ring-accent/50",
                    !s.done && !current && "text-subtle ring-1 ring-line-strong",
                  )}
                >
                  {s.done ? <Check className="size-4" strokeWidth={2.5} /> : i + 1}
                </span>
                <span className="flex-1 text-[17px] font-medium text-fg">{s.title}</span>
                <span className={cn("text-sm", current ? "text-accent" : "text-subtle")}>{s.detail}</span>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="mt-24 text-center">
      <p className="font-mono text-sm text-subtle">
        <span className="text-accent">404</span> / application not found
      </p>
      <h1 className="mt-4 text-4xl font-medium tracking-[-0.04em] sm:text-5xl">
        We couldn&apos;t find <span className="serif-accent text-accent">that one.</span>
      </h1>
      <p className="mx-auto mt-4 max-w-sm text-muted">
        Check that you opened the full link from your confirmation screen. It includes a private
        token after the reference number.
      </p>
    </div>
  );
}
