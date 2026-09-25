-- Saved looks (♥): kept on the server so they survive a new phone or a
-- reinstall - they used to live only in the browser's localStorage.
-- Each row is one look: the item ids as worn, plus the occasion.
-- Rows disappear with the account (on delete cascade). Safe to re-run.

create table if not exists public.saved_looks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  occasion text not null default 'casual',
  item_ids uuid[] not null,
  created_at timestamptz not null default now()
);
create index if not exists saved_looks_user_idx on public.saved_looks (user_id, created_at desc);

alter table public.saved_looks enable row level security;

drop policy if exists saved_looks_select_own on public.saved_looks;
drop policy if exists saved_looks_insert_own on public.saved_looks;
drop policy if exists saved_looks_delete_own on public.saved_looks;

create policy saved_looks_select_own on public.saved_looks
  for select to authenticated using (auth.uid() = user_id);
create policy saved_looks_insert_own on public.saved_looks
  for insert to authenticated with check (auth.uid() = user_id and cardinality(item_ids) between 2 and 8);
create policy saved_looks_delete_own on public.saved_looks
  for delete to authenticated using (auth.uid() = user_id);

revoke all on public.saved_looks from anon;
