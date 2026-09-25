-- Applications submitted through the TVO portal (founders and builders).
create table if not exists public.applications (
  id          uuid primary key default gen_random_uuid(),
  ref         text not null unique check (ref ~ '^TVO-[0-9A-F]{6}$'),
  track       text not null check (track in ('startup', 'builder')),
  payload     jsonb not null check (jsonb_typeof(payload) = 'object' and pg_column_size(payload) < 32000),
  status      text not null default 'new' check (status in ('new', 'reviewing', 'accepted', 'declined')),
  created_at  timestamptz not null default now()
);

create index if not exists applications_track_created_idx
  on public.applications (track, created_at desc);

alter table public.applications enable row level security;

-- The API route writes with the project's publishable (anon) key, kept
-- server-side. That role may insert new rows only: it cannot read, update,
-- or delete, and cannot set status or timestamps. Review applications in
-- the Supabase dashboard (or with the service role).
revoke all on public.applications from anon, authenticated;
grant insert (ref, track, payload) on public.applications to anon;

create policy "Portal can submit applications"
  on public.applications
  for insert
  to anon
  with check (status = 'new');
