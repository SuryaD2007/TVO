-- Shared rate limiting for serverless API routes. Counters live in the
-- private schema; the server calls hit_rate_limit() with a hashed key.
create table if not exists private.rate_limits (
  key      text primary key,
  count    integer not null,
  reset_at timestamptz not null
);

create or replace function public.hit_rate_limit(p_key text, p_max integer, p_window_seconds integer)
returns table (allowed boolean, retry_after integer)
language plpgsql volatile security definer
set search_path = ''
as $$
declare
  r private.rate_limits;
begin
  if p_key is null or length(p_key) > 200 or p_max < 1 or p_window_seconds not between 1 and 86400 then
    raise exception 'invalid arguments' using errcode = '22023';
  end if;

  insert into private.rate_limits as rl (key, count, reset_at)
  values (p_key, 1, now() + make_interval(secs => p_window_seconds))
  on conflict (key) do update set
    count    = case when rl.reset_at <= now() then 1 else rl.count + 1 end,
    reset_at = case when rl.reset_at <= now() then now() + make_interval(secs => p_window_seconds) else rl.reset_at end
  returning * into r;

  -- Opportunistic cleanup of long-expired windows
  if random() < 0.02 then
    delete from private.rate_limits where reset_at < now() - interval '1 day';
  end if;

  return query select r.count <= p_max,
                      greatest(0, ceil(extract(epoch from r.reset_at - now())))::integer;
end;
$$;

revoke execute on function public.hit_rate_limit(text, integer, integer) from public, authenticated;
grant execute on function public.hit_rate_limit(text, integer, integer) to anon;
