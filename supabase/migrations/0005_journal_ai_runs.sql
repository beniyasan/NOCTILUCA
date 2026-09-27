-- 作業日誌のAI整理の利用回数。プレイヤーごと・1日(日本時間)ごとに1行。
-- 失敗した回は release で戻すので、上限に数えるのは整理できた回だけ。
create table if not exists public.journal_ai_runs (
  player_id uuid not null references public.players(id) on delete cascade,
  day date not null,
  runs integer not null default 0 check (runs >= 0),
  last_error text,
  updated_at timestamptz not null default now(),
  primary key (player_id, day)
);

alter table public.journal_ai_runs enable row level security;
drop policy if exists journal_ai_runs_no_direct_access on public.journal_ai_runs;
create policy journal_ai_runs_no_direct_access on public.journal_ai_runs for all using (false) with check (false);

-- Returns the run count after claiming, or null when the day's limit is reached.
create or replace function public.claim_journal_ai_run(p_player_id uuid, p_day date, p_max integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  claimed integer;
begin
  insert into journal_ai_runs (player_id, day, runs) values (p_player_id, p_day, 0)
    on conflict (player_id, day) do nothing;
  update journal_ai_runs set runs = runs + 1, updated_at = now()
    where player_id = p_player_id and day = p_day and runs < p_max
    returning runs into claimed;
  return claimed;
end;
$$;

create or replace function public.release_journal_ai_run(p_player_id uuid, p_day date, p_error text)
returns void
language sql
security definer
set search_path = public
as $$
  update journal_ai_runs set runs = greatest(runs - 1, 0), last_error = left(p_error, 500), updated_at = now()
    where player_id = p_player_id and day = p_day;
$$;

revoke all on function public.claim_journal_ai_run(uuid,date,integer) from public;
grant execute on function public.claim_journal_ai_run(uuid,date,integer) to service_role;
revoke all on function public.release_journal_ai_run(uuid,date,text) from public;
grant execute on function public.release_journal_ai_run(uuid,date,text) to service_role;
