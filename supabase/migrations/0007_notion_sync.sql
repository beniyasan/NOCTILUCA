-- Notionとのタスク同期の控え。どちらも Edge Function (service_role) だけが読み書きする。
-- notion_task_pages: NOCTILUCAのタスクから作ったNotionのページ。作成の再送で同じページを二重に作らないため。
--   page_id が null の行は「作成中」の印。
-- notion_outbox: Notionに届かなかった「完了」。Notionが戻ったら送り直し、届いたら消す。
create table if not exists public.notion_task_pages (
  player_id uuid not null references public.players(id) on delete cascade,
  task_id text not null check (char_length(task_id) between 1 and 80),
  page_id text,
  created_at timestamptz not null default now(),
  primary key (player_id, task_id)
);

create table if not exists public.notion_outbox (
  player_id uuid not null references public.players(id) on delete cascade,
  page_id text not null check (char_length(page_id) between 32 and 36),
  attempts integer not null default 0 check (attempts >= 0),
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (player_id, page_id)
);

alter table public.notion_task_pages enable row level security;
alter table public.notion_outbox enable row level security;
drop policy if exists notion_task_pages_no_direct_access on public.notion_task_pages;
create policy notion_task_pages_no_direct_access on public.notion_task_pages for all using (false) with check (false);
drop policy if exists notion_outbox_no_direct_access on public.notion_outbox;
create policy notion_outbox_no_direct_access on public.notion_outbox for all using (false) with check (false);
