# Texas Venture Operators — Web

Landing page and application portal for TVO, UT Austin's external engineering syndicate.

**Stack:** Next.js 16 (App Router) · React 19 · Tailwind CSS v4 · Framer Motion · Lucide · Supabase · Claude API

## Features

- **Operator terminal**: press `/` anywhere. `help`, `ls`, `cat`, `apply`, and a coding `challenge` whose
  solvers get a signed code (`OP-…`) that flags their application for priority review. Devtools users get
  a `tvo.challenge()` hook in the console.
- **Sprint planner**: founders paste a backlog and get sized tickets, squad size, sprint count, and risks,
  then prefill the sprint request. Providers are tried in order: Claude (`claude-opus-5`) if
  `ANTHROPIC_API_KEY` is set, then Gemini (`GEMINI_API_KEY`, with model fallback when one is busy), then a
  keyword estimator labelled "Quick estimate". After 12 s the UI offers the instant estimate instead.
- **Applicant status**: every submission gets a private `/status/<ref>?t=<token>` link.
- **Share card**: builders download a 1200×630 "I applied" card (`/api/card`).
- **Operator console**: `/admin` (password) to filter, search, review, change status, keep notes, export CSV.
- **Emails** (Resend): applicants get a confirmation with their status link; operators get an alert per
  application with reply-to set to the applicant.
- **Abuse protection**: Cloudflare Turnstile on the planner and application form; rate limits stored in
  Postgres (hashed IPs) so they hold across serverless instances; a daily cap on AI planner calls.
- **Privacy page** at `/privacy`, security headers (CSP, HSTS, no-referrer on private pages), and
  cookieless Vercel Analytics.

```bash
npm install
npm run dev     # http://localhost:3000
npm run build
npm test        # unit tests (Vitest)
npm run typecheck
```

CI (`.github/workflows/ci.yml`) runs lint, typecheck, tests, and a build on every push and PR.

## Structure

```
src/
  app/
    layout.tsx           Fonts (Geist / Geist Mono), metadata, viewport
    globals.css          Design tokens (@theme), grid, gradient borders, keyframes
    page.tsx             Section composition
    api/apply/route.ts   POST endpoint: rate limit, sanitize, validate, save, notify
    opengraph-image.tsx  Generated 1200×630 social card
    icon.svg, robots.ts, sitemap.ts, not-found.tsx
  components/
    ui.tsx               Badge, Button, SectionHeader, Reveal, Counter, Container
    apply-context.tsx    Shared track state; any CTA can open the portal pre-selected
    navbar.tsx           Floating glass nav + mobile menu
    hero.tsx             Headline, dual CTAs, status badge, live sprint console, metrics
    distinction.tsx      Why TVO comparison grid + stack marquee
    engine.tsx           How It Works: auto-advancing, keyboard-accessible tabs
    ecosystem.tsx        Austin network diagram + founder pitch
    apply.tsx            Multi-step application (founder / builder tracks)
    footer.tsx           Links + terminal status line with live Austin clock
  lib/
    content.ts           All page copy and data
    apply-schema.ts      Form steps + validators, shared by client and API
    store.ts             Supabase REST insert + optional Slack ping (server only)
    rate-limit.ts        In-memory limiter: 5 submissions / 10 min per IP
supabase/migrations/     `applications` table (RLS on, service role only)
```

## Configuration

Copy `.env.example` to `.env.local`. Every variable is optional in development;
without Supabase settings, submissions are logged to the server console.

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | Canonical URL for the sitemap, robots.txt, and OG tags |
| `SUPABASE_URL`, `SUPABASE_KEY` | Store applications (publishable key; the migration in `supabase/migrations/` limits it to inserts) |
| `APP_SECRET` | Signs admin sessions and challenge codes; derives the admin DB key |
| `ADMIN_PASSWORD` | Password for `/admin` |
| `ANTHROPIC_API_KEY` | Enables the Claude sprint planner |
| `GEMINI_API_KEY` | Enables the Gemini sprint planner (used when Claude isn't configured) |
| `CHALLENGE_ANSWER_HMAC` | Keyed hash of the challenge answer (command in `src/lib/secrets.ts`) |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile bot protection |
| `RESEND_API_KEY`, `EMAIL_FROM`, `OPERATOR_EMAIL` | Confirmation and alert emails |
| `PLAN_DAILY_AI_LIMIT` | Daily cap on AI planner calls (default 300) |
| `SLACK_WEBHOOK_URL` | Post each new application to a Slack channel |

Keep `SUPABASE_KEY` server-side (no `NEXT_PUBLIC_` prefix). Even if it leaked, it can only insert rows. Review applications in the Supabase dashboard → Table Editor → `applications`.

## Before launch

- Update `CONTACT` (email, LinkedIn) in `src/lib/content.ts`.
- Once pilots run, swap hero metrics for real traction and name confirmed partners.
- Set `NEXT_PUBLIC_SITE_URL` to the production domain.
