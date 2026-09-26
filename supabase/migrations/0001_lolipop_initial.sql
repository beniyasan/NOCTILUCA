-- NOCTILUCA ロリポップ版専用スキーマ
-- This project is intentionally independent from the Cloudflare/D1 edition.
create table if not exists public.players (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.journeys (
  player_id uuid primary key references public.players(id) on delete cascade,
  schema_version integer not null default 1 check (schema_version = 1),
  revision bigint not null default 0 check (revision >= 0),
  state_json jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.command_receipts (
  player_id uuid not null references public.players(id) on delete cascade,
  request_id text not null,
  request_hash text not null,
  expected_revision bigint not null,
  outcome_json jsonb not null,
  created_at timestamptz not null default now(),
  primary key (player_id, request_id)
);
create index if not exists command_receipts_by_time
  on public.command_receipts(player_id, created_at);

create table if not exists public.checkpoints (
  player_id uuid primary key references public.players(id) on delete cascade,
  revision bigint not null,
  state_json jsonb not null,
  saved_at timestamptz not null default now()
);

alter table public.players enable row level security;
alter table public.journeys enable row level security;
alter table public.command_receipts enable row level security;
alter table public.checkpoints enable row level security;

-- The browser never writes game state directly. Edge Functions use service_role.
drop policy if exists players_no_direct_access on public.players;
create policy players_no_direct_access on public.players for all using (false) with check (false);
drop policy if exists journeys_no_direct_access on public.journeys;
create policy journeys_no_direct_access on public.journeys for all using (false) with check (false);
drop policy if exists receipts_no_direct_access on public.command_receipts;
create policy receipts_no_direct_access on public.command_receipts for all using (false) with check (false);
drop policy if exists checkpoints_no_direct_access on public.checkpoints;
create policy checkpoints_no_direct_access on public.checkpoints for all using (false) with check (false);

-- Commit is the only write path. Row locking makes revision checks and receipts atomic.
create or replace function public.commit_journey_command(
  p_player_id uuid,
  p_request_id text,
  p_request_hash text,
  p_expected_revision bigint,
  p_state jsonb,
  p_outcome jsonb,
  p_checkpoint boolean default false
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_journey journeys%rowtype;
  existing command_receipts%rowtype;
  next_revision bigint;
begin
  select * into current_journey from journeys where player_id = p_player_id for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'JOURNEY_NOT_FOUND';
  end if;

  select * into existing from command_receipts
    where player_id = p_player_id and request_id = p_request_id;
  if found then
    if existing.request_hash <> p_request_hash then
      raise exception using errcode = 'P0001', message = 'IDEMPOTENCY_MISMATCH';
    end if;
    return jsonb_build_object('replayed', true, 'revision', current_journey.revision,
      'outcome', existing.outcome_json, 'state', current_journey.state_json,
      'updated_at', current_journey.updated_at);
  end if;

  if current_journey.revision <> p_expected_revision then
    raise exception using errcode = 'P0001', message = 'REVISION_CONFLICT';
  end if;

  next_revision := current_journey.revision + 1;
  update journeys set revision = next_revision, state_json = p_state, updated_at = now()
    where player_id = p_player_id;
  insert into command_receipts(player_id, request_id, request_hash, expected_revision, outcome_json)
    values (p_player_id, p_request_id, p_request_hash, p_expected_revision, p_outcome);
  if p_checkpoint then
    insert into checkpoints(player_id, revision, state_json)
      values (p_player_id, next_revision, p_state)
      on conflict (player_id) do update set revision = excluded.revision,
        state_json = excluded.state_json, saved_at = now();
  end if;
  return jsonb_build_object('replayed', false, 'revision', next_revision,
    'outcome', p_outcome, 'state', p_state, 'updated_at', now());
end;
$$;
revoke all on function public.commit_journey_command(uuid,text,text,bigint,jsonb,jsonb,boolean) from public;
grant execute on function public.commit_journey_command(uuid,text,text,bigint,jsonb,jsonb,boolean) to service_role;
