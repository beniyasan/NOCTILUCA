-- 直近の生成失敗の理由。ダッシュボードのログを見なくても原因を確認できるようにする。
alter table public.passenger_talk_days add column if not exists last_error text;
