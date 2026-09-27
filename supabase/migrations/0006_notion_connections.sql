-- Notion連携。ログインユーザーごとに1行。
-- トークンは Edge Function が NOTION_TOKEN_KEY で暗号化してから保存し、平文では持たない。
-- data_source_id 以降は、ユーザーが選んだタスク用データベースと列の対応づけ。
create table if not exists public.notion_connections (
  player_id uuid primary key references public.players(id) on delete cascade,
  tokens text not null,
  bot_id text not null,
  workspace_id text not null,
  workspace_name text not null default '',
  data_source_id text,
  data_source_name text,
  title_property text,
  done_property text,
  done_property_name text,
  done_type text check (done_type in ('checkbox', 'status')),
  done_option text,
  done_option_name text,
  last_error text,
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.notion_connections enable row level security;
drop policy if exists notion_connections_no_direct_access on public.notion_connections;
create policy notion_connections_no_direct_access on public.notion_connections for all using (false) with check (false);
