-- 向かいの席の乗客が交わす、その日の話題から生成した会話のプール。
-- 1日(日本時間)ごとに1行。見出しは最初のバッチでだけ取得し、以後は同じ見出しから追加生成する。
create table if not exists public.passenger_talk_days (
  day date primary key,
  headlines jsonb not null default '[]'::jsonb,
  batches integer not null default 0 check (batches >= 0),
  locked_until timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.passenger_talks (
  id bigserial primary key,
  day date not null references public.passenger_talk_days(day) on delete cascade,
  batch integer not null check (batch >= 1),
  size smallint not null check (size in (2, 3)),
  tone text not null check (tone in ('chat', 'quarrel')),
  lines jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists passenger_talks_by_day on public.passenger_talks(day, batch);

alter table public.passenger_talk_days enable row level security;
alter table public.passenger_talks enable row level security;
drop policy if exists passenger_talk_days_no_direct_access on public.passenger_talk_days;
create policy passenger_talk_days_no_direct_access on public.passenger_talk_days for all using (false) with check (false);
drop policy if exists passenger_talks_no_direct_access on public.passenger_talks;
create policy passenger_talks_no_direct_access on public.passenger_talks for all using (false) with check (false);

-- Only one request may generate a batch at a time. Returns the batch number to
-- generate, or null when the wanted batch exists, the daily cap is reached, or
-- another request holds the lock.
create or replace function public.claim_passenger_talk_batch(p_day date, p_want integer, p_max integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  d passenger_talk_days%rowtype;
begin
  insert into passenger_talk_days(day) values (p_day) on conflict (day) do nothing;
  select * into d from passenger_talk_days where day = p_day for update;
  if d.batches >= p_want or d.batches >= p_max then
    return null;
  end if;
  if d.locked_until is not null and d.locked_until > now() then
    return null;
  end if;
  update passenger_talk_days set locked_until = now() + interval '3 minutes', updated_at = now()
    where day = p_day;
  return d.batches + 1;
end;
$$;

-- Store a generated batch and release the lock in one transaction.
create or replace function public.finish_passenger_talk_batch(p_day date, p_batch integer, p_headlines jsonb, p_talks jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into passenger_talks(day, batch, size, tone, lines)
    select p_day, p_batch, (t->>'size')::smallint, t->>'tone', t->'lines'
    from jsonb_array_elements(p_talks) as t;
  update passenger_talk_days
    set batches = greatest(batches, p_batch),
        headlines = case when jsonb_array_length(headlines) = 0 then p_headlines else headlines end,
        locked_until = null,
        updated_at = now()
    where day = p_day;
end;
$$;

revoke all on function public.claim_passenger_talk_batch(date,integer,integer) from public;
grant execute on function public.claim_passenger_talk_batch(date,integer,integer) to service_role;
revoke all on function public.finish_passenger_talk_batch(date,integer,jsonb,jsonb) from public;
grant execute on function public.finish_passenger_talk_batch(date,integer,jsonb,jsonb) to service_role;
