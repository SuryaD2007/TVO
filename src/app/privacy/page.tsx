import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/logo";
import { CONTACT } from "@/lib/content";

export const metadata: Metadata = {
  title: "Privacy · Texas Venture Operators",
  description: "What Texas Venture Operators collects through this site and how it's used.",
};

const UPDATED = "September 25, 2026";

const SECTIONS: { title: string; body: React.ReactNode }[] = [
  {
    title: "What we collect",
    body: (
      <>
        <p>
          When you apply, we store the answers you give in the form: for founders, your company,
          website, stage, backlog, stack, timeline, name, role, and email; for builders, your name,
          UT email, major, graduation year, strongest areas, GitHub and portfolio links, the work
          you describe, availability, and a challenge code if you include one.
        </p>
        <p>
          To stop spam and abuse, we record a one-way hash of your IP address with a counter for a
          short time. We never store the raw address.
        </p>
      </>
    ),
  },
  {
    title: "How we use it",
    body: (
      <p>
        Only to review your application, contact you about it, and run the TVO cohort and sprint
        process. TVO operators can see applications. We don&apos;t sell your information or use it
        for advertising.
      </p>
    ),
  },
  {
    title: "Services that process data for us",
    body: (
      <ul className="list-disc space-y-2 pl-5">
        <li>
          <strong className="font-medium text-fg">Supabase</strong> stores applications.
        </li>
        <li>
          <strong className="font-medium text-fg">Vercel</strong> hosts the site and provides
          cookieless, aggregate visit analytics.
        </li>
        <li>
          <strong className="font-medium text-fg">Cloudflare Turnstile</strong> checks that form
          submissions come from people, not bots.
        </li>
        <li>
          <strong className="font-medium text-fg">Resend</strong> sends confirmation and
          notification emails.
        </li>
        <li>
          <strong className="font-medium text-fg">Google (Gemini) or Anthropic (Claude)</strong>{" "}
          processes text you paste into the sprint planner to draft a plan. Planner text isn&apos;t
          stored by TVO unless you choose to send it with a sprint request. Don&apos;t paste
          secrets or credentials.
        </li>
      </ul>
    ),
  },
  {
    title: "Cookies",
    body: (
      <p>
        The public site sets no tracking cookies. The operator console uses one strictly necessary
        session cookie for signed-in TVO operators.
      </p>
    ),
  },
  {
    title: "Your choices",
    body: (
      <p>
        You can ask us to show, correct, or delete your application at any time by emailing{" "}
        <a href={`mailto:${CONTACT.email}`} className="text-accent underline-offset-4 hover:underline">
          {CONTACT.email}
        </a>
        . We keep applications only as long as we need them for the cohort and sprint process.
      </p>
    ),
  },
  {
    title: "About TVO",
    body: (
      <p>
        Texas Venture Operators is a student organization at The University of Texas at Austin. It
        is not an official unit of the university, and the university is not responsible for this
        site or how TVO uses your information.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <main className="relative min-h-dvh overflow-hidden px-4 py-10 sm:py-16">
      <div className="bg-grid pointer-events-none absolute inset-0" aria-hidden />
      <div className="relative mx-auto max-w-2xl">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex rounded-full">
            <Logo />
          </Link>
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-fg">
            <ArrowLeft className="size-4" strokeWidth={1.75} /> Home
          </Link>
        </div>

        <p className="mt-20 font-mono text-xs text-subtle">Last updated {UPDATED}</p>
        <h1 className="mt-4 text-5xl leading-[0.95] font-medium tracking-[-0.05em] sm:text-6xl">
          Privacy, <span className="serif-accent text-accent">plainly.</span>
        </h1>
        <p className="mt-6 text-[17px] leading-relaxed text-muted">
          What this site collects, why, and who touches it. No legalese where we can avoid it.
        </p>

        <div className="mt-14 border-t border-line">
          {SECTIONS.map((s) => (
            <section key={s.title} className="grid gap-3 border-b border-line py-8 sm:grid-cols-[200px_1fr] sm:gap-8">
              <h2 className="text-[15px] font-medium text-fg">{s.title}</h2>
              <div className="space-y-4 text-[15px] leading-relaxed text-muted">{s.body}</div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
