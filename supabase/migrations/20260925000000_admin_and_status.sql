-- Admin review + applicant status tracking.
--
-- The site talks to Postgres with the publishable (anon) key, which can only
-- insert applications. Reading and updating go through SECURITY DEFINER
-- functions that check a secret only the Next.js server holds. The secret's
-- SHA-256 lives in private.admin_keys, a schema the REST API never exposes.
-- Seed it (outside this file) with:
--   insert into private.admin_keys (key_hash)
--   values (encode(extensions.digest('<ADMIN DB KEY>', 'sha256'), 'hex'));

create extension if not exists pgcrypto with schema extensions;

alter table public.applications
  add column if not exists notes text not null default '' check (length(notes) <= 10000),
  add column if not exists status_token_hash text,
  add column if not exists updated_at timestamptz not null default now();

-- Applicants get a private status link; the server stores only its hash.
grant insert (ref, track, payload, status_token_hash) on public.applications to anon;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.admin_keys (
  key_hash   text primary key,
  created_at timestamptz not null default now()
);

create or replace function private.is_admin(p_secret text)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from private.admin_keys
    where key_hash = encode(extensions.digest(coalesce(p_secret, ''), 'sha256'), 'hex')
  );
$$;

create or replace function public.admin_list_applications(p_secret text)
returns setof public.applications
language plpgsql stable security definer
set search_path = ''
as $$
begin
  if not private.is_admin(p_secret) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return query select * from public.applications order by created_at desc;
end;
$$;

create or replace function public.admin_update_application(
  p_secret text, p_ref text, p_status text, p_notes text
)
returns public.applications
language plpgsql volatile security definer
set search_path = ''
as $$
declare
  result public.applications;
begin
  if not private.is_admin(p_secret) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  update public.applications
     set status = coalesce(p_status, status),
         notes = coalesce(p_notes, notes),
         updated_at = now()
   where ref = p_ref
  returning * into result;
  if result.id is null then
    raise exception 'not found' using errcode = 'P0002';
  end if;
  return result;
end;
$$;

-- Public status lookup: needs both the ref and the unguessable token.
create or replace function public.application_status(p_ref text, p_token text)
returns table (
  ref text, track text, status text,
  created_at timestamptz, updated_at timestamptz, first_name text
)
language sql stable security definer
set search_path = ''
as $$
  select a.ref, a.track, a.status, a.created_at, a.updated_at,
         split_part(coalesce(a.payload ->> 'name', ''), ' ', 1)
    from public.applications a
   where a.ref = p_ref
     and a.status_token_hash is not null
     and a.status_token_hash = encode(extensions.digest(coalesce(p_token, ''), 'sha256'), 'hex');
$$;

revoke execute on function private.is_admin(text) from public;
revoke execute on function
  public.admin_list_applications(text),
  public.admin_update_application(text, text, text, text),
  public.application_status(text, text)
from public;
grant execute on function
  public.admin_list_applications(text),
  public.admin_update_application(text, text, text, text),
  public.application_status(text, text)
to anon;

-- No Supabase Auth users on this site; only the server's anon key calls these.
-- (The advisor's "anon can execute SECURITY DEFINER" warning is expected: each
-- function checks a secret or per-application token before returning data.)
revoke execute on function
  public.admin_list_applications(text),
  public.admin_update_application(text, text, text, text),
  public.application_status(text, text)
from authenticated;
