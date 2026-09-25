-- Couple Mode v2: invite -> accept -> connected -> either side can end.
--
-- Replaces "whoever knows your 6-character code can read your wardrobe
-- forever". A code is only an invitation: it expires after 7 days, works
-- once, and the wardrobes become visible to each other only after the other
-- person accepts it. Either person can end the connection at any time.
--
-- All changes go through the SECURITY DEFINER functions below; the table
-- itself is read-only for its two members and invisible to everyone else.
-- Rows are deleted automatically when either account is deleted.
-- Run in Supabase -> SQL Editor. Safe to re-run.

create table if not exists public.couple_links (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  inviter_id uuid not null references auth.users(id) on delete cascade,
  inviter_gender text not null default 'male' check (inviter_gender in ('male', 'female')),
  invitee_id uuid references auth.users(id) on delete cascade,
  invitee_gender text check (invitee_gender in ('male', 'female')),
  status text not null default 'pending' check (status in ('pending', 'active', 'ended')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '7 days',
  accepted_at timestamptz,
  ended_at timestamptz
);
create index if not exists couple_links_inviter_idx on public.couple_links (inviter_id);
create index if not exists couple_links_invitee_idx on public.couple_links (invitee_id);

alter table public.couple_links enable row level security;
drop policy if exists couple_links_select_own on public.couple_links;
create policy couple_links_select_own on public.couple_links
  for select to authenticated
  using (auth.uid() = inviter_id or auth.uid() = invitee_id);
revoke all on public.couple_links from anon;
revoke insert, update, delete on public.couple_links from authenticated;

-- Display name for a partner: profile name, or the part of the email before
-- the @ when the profile has none (common - the signup trigger leaves it empty).
create or replace function public.couple_display_name(p_user uuid)
returns text
language sql stable security definer set search_path = public as $$
  select coalesce(
    nullif((select u.full_name from users u where u.id = p_user), ''),
    (select split_part(au.email, '@', 1) from auth.users au where au.id = p_user),
    ''
  );
$$;
revoke all on function public.couple_display_name(uuid) from public, anon, authenticated;

-- Create (or replace) my pending invitation.
create or replace function public.couple_create_invite(p_gender text)
returns table (invite_code text, invite_expires_at timestamptz)
language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  v_code text;
begin
  if me is null then raise exception 'not authenticated'; end if;
  if exists (select 1 from couple_links l where l.status = 'active' and (l.inviter_id = me or l.invitee_id = me)) then
    raise exception 'already connected';
  end if;
  delete from couple_links l where l.inviter_id = me and l.status = 'pending';
  loop
    v_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
    exit when not exists (select 1 from couple_links l where l.code = v_code);
  end loop;
  insert into couple_links (code, inviter_id, inviter_gender)
  values (v_code, me, case when p_gender = 'female' then 'female' else 'male' end);
  return query select v_code, now() + interval '7 days';
end $$;

-- Accept someone's invitation.
create or replace function public.couple_accept_invite(p_code text, p_gender text)
returns table (partner_name text)
language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  v_link couple_links%rowtype;
begin
  if me is null then raise exception 'not authenticated'; end if;
  select * into v_link from couple_links l
  where l.code = upper(trim(p_code)) and l.status = 'pending' and l.expires_at > now()
  for update;
  if not found then raise exception 'invalid code'; end if;
  if v_link.inviter_id = me then raise exception 'own code'; end if;
  if exists (
    select 1 from couple_links l
    where l.status = 'active'
      and (me in (l.inviter_id, l.invitee_id) or v_link.inviter_id in (l.inviter_id, l.invitee_id))
  ) then
    raise exception 'already connected';
  end if;
  update couple_links
  set invitee_id = me,
      invitee_gender = case when p_gender = 'female' then 'female' else 'male' end,
      status = 'active',
      accepted_at = now()
  where id = v_link.id;
  delete from couple_links l where l.inviter_id = me and l.status = 'pending';
  return query select couple_display_name(v_link.inviter_id);
end $$;

-- My current connection (active) or my open invitation (pending), if any.
create or replace function public.couple_status()
returns table (
  link_status text, invite_code text, invite_expires_at timestamptz,
  partner_id uuid, partner_name text, partner_gender text
)
language sql stable security definer set search_path = public as $$
  select
    l.status,
    case when l.status = 'pending' then l.code end,
    l.expires_at,
    case when l.status = 'active' then (case when l.inviter_id = auth.uid() then l.invitee_id else l.inviter_id end) end,
    case when l.status = 'active' then couple_display_name(case when l.inviter_id = auth.uid() then l.invitee_id else l.inviter_id end) end,
    case when l.status = 'active' then (case when l.inviter_id = auth.uid() then l.invitee_gender else l.inviter_gender end) end
  from couple_links l
  where (l.inviter_id = auth.uid() or l.invitee_id = auth.uid())
    and (l.status = 'active' or (l.status = 'pending' and l.expires_at > now()))
  order by (l.status = 'active') desc, l.created_at desc
  limit 1;
$$;

-- End my connection and cancel my open invitation.
create or replace function public.couple_end()
returns void
language sql security definer set search_path = public as $$
  update couple_links
  set status = 'ended', ended_at = now()
  where status in ('active', 'pending')
    and (inviter_id = auth.uid() or invitee_id = auth.uid());
$$;

-- My connected partner's wardrobe - nothing unless the connection is active.
create or replace function public.couple_partner_items()
returns setof public.items
language sql stable security definer set search_path = public as $$
  select i.*
  from items i
  join couple_links l
    on l.status = 'active'
   and ((l.inviter_id = auth.uid() and i.user_id = l.invitee_id)
     or (l.invitee_id = auth.uid() and i.user_id = l.inviter_id));
$$;

revoke all on function public.couple_create_invite(text) from public, anon;
revoke all on function public.couple_accept_invite(text, text) from public, anon;
revoke all on function public.couple_status() from public, anon;
revoke all on function public.couple_end() from public, anon;
revoke all on function public.couple_partner_items() from public, anon;
grant execute on function public.couple_create_invite(text) to authenticated;
grant execute on function public.couple_accept_invite(text, text) to authenticated;
grant execute on function public.couple_status() to authenticated;
grant execute on function public.couple_end() to authenticated;
grant execute on function public.couple_partner_items() to authenticated;
