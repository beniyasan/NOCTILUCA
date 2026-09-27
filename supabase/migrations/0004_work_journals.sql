-- 作業日誌。ログインユーザーごとに1日(日本時間)1行。旅のセーブ(64KB上限)とは別に保存する。
-- entries は作業区間(session)と完了タスク(task)の記録。body は自由記入のメモ。
create table if not exists public.work_journals (
  player_id uuid not null references public.players(id) on delete cascade,
  day date not null,
  body text not null default '' check (char_length(body) <= 4000),
  entries jsonb not null default '[]'::jsonb check (jsonb_typeof(entries) = 'array' and jsonb_array_length(entries) <= 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (player_id, day)
);

alter table public.work_journals enable row level security;
drop policy if exists work_journals_no_direct_access on public.work_journals;
create policy work_journals_no_direct_access on public.work_journals for all using (false) with check (false);

-- Appends in one statement so two tabs recording at once cannot drop an entry.
create or replace function public.append_work_journal_entry(p_player_id uuid, p_day date, p_entry jsonb)
returns public.work_journals
language plpgsql
security definer
set search_path = public
as $$
declare
  saved work_journals%rowtype;
begin
  insert into work_journals (player_id, day, entries) values (p_player_id, p_day, jsonb_build_array(p_entry))
  on conflict (player_id, day) do update
    set entries = work_journals.entries || jsonb_build_array(p_entry), updated_at = now()
    where jsonb_array_length(work_journals.entries) < 80
  returning * into saved;
  if not found then
    raise exception using errcode = 'P0001', message = 'JOURNAL_FULL';
  end if;
  return saved;
end;
$$;

create or replace function public.set_work_journal_note(p_player_id uuid, p_day date, p_entry_id text, p_note text)
returns public.work_journals
language plpgsql
security definer
set search_path = public
as $$
declare
  saved work_journals%rowtype;
begin
  update work_journals
    set entries = (
      select jsonb_agg(case when e->>'id' = p_entry_id then e || jsonb_build_object('note', p_note) else e end order by n)
      from jsonb_array_elements(entries) with ordinality as t(e, n)
    ), updated_at = now()
    where player_id = p_player_id and day = p_day
      and exists (select 1 from jsonb_array_elements(entries) e where e->>'id' = p_entry_id)
  returning * into saved;
  if not found then
    raise exception using errcode = 'P0002', message = 'JOURNAL_ENTRY_MISSING';
  end if;
  return saved;
end;
$$;

revoke all on function public.append_work_journal_entry(uuid,date,jsonb) from public;
grant execute on function public.append_work_journal_entry(uuid,date,jsonb) to service_role;
revoke all on function public.set_work_journal_note(uuid,date,text,text) from public;
grant execute on function public.set_work_journal_note(uuid,date,text,text) to service_role;
