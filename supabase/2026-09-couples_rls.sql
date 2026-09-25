-- Fix: `couples` table is fully readable by anyone, even without logging in
-- (confirmed live: an unauthenticated request returned every couple's code
-- and user_id). Run this in Supabase Dashboard -> SQL Editor.
--
-- The couples feature needs two things that are in tension:
--   1. A user must be able to look up ONE specific row by the code their
--      partner gave them, even though they don't own that row.
--   2. Nobody should be able to list/enumerate every row in the table.
-- Plain row-level SELECT policies can't express "only if you already know
-- the code" - they gate whole rows, not query parameters. The standard fix
-- is: lock the table down to "you can only see your own row", then add a
-- SECURITY DEFINER function for the one legitimate cross-user lookup.

alter table public.couples enable row level security;

-- Remove any existing policies so this is safe to re-run / doesn't leave a
-- forgotten permissive policy in place alongside the new restrictive ones.
drop policy if exists "couples_select_own" on public.couples;
drop policy if exists "couples_insert_own" on public.couples;
drop policy if exists "couples_update_own" on public.couples;
drop policy if exists "Enable read access for all users" on public.couples;

-- Owners can see and manage only their own row.
create policy "couples_select_own"
  on public.couples for select
  using (auth.uid() = user_id);

create policy "couples_insert_own"
  on public.couples for insert
  with check (auth.uid() = user_id);

create policy "couples_update_own"
  on public.couples for update
  using (auth.uid() = user_id);

-- The one legitimate cross-user read: look up a partner's user_id + gender
-- by the exact code they shared with you. SECURITY DEFINER runs as the
-- function owner (bypassing the RLS above) but only ever returns the single
-- matching row, never the whole table.
create or replace function public.lookup_couple_by_code(p_code text)
returns table (user_id uuid, gender text)
language sql
security definer
set search_path = public
as $$
  select user_id, gender
  from public.couples
  where code = upper(p_code)
  limit 1;
$$;

revoke all on function public.lookup_couple_by_code(text) from public;
grant execute on function public.lookup_couple_by_code(text) to authenticated;

-- Second problem this same design creates: once you know a partner's
-- user_id, CoupleMode fetches their wardrobe with a plain
-- items.select(...).eq("user_id", partnerId) - which only works if `items`
-- lets one user read another's rows. A blanket "any authenticated user can
-- read anyone's items" policy would defeat the point of a personal wardrobe
-- app (anyone with an account could browse anyone else's closet, not just a
-- connected partner). This app's `couples` design has no persisted "these
-- two are connected" relationship - it's just "whoever holds the code can
-- look you up" - so the correct gate for items is the same one: knowing the
-- code. This function joins items to couples on the code internally, so
-- calling it without a valid code returns nothing, and no separate items
-- policy needs to be loosened at all.
create or replace function public.get_partner_items(p_code text)
returns setof public.items
language sql
security definer
set search_path = public
as $$
  select i.*
  from public.items i
  join public.couples c on c.user_id = i.user_id
  where c.code = upper(p_code);
$$;

revoke all on function public.get_partner_items(text) from public;
grant execute on function public.get_partner_items(text) to authenticated;
