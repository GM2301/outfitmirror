-- Couple Mode: only signed-in users may look up a partner code.
--
-- Verified live on 2026-09-25: both functions answered requests made with
-- only the public (anon) key, i.e. from someone with no account at all.
-- `revoke ... from public` in the original script does not cover Supabase's
-- `anon` role, which gets EXECUTE on new functions by default - so anyone
-- could try codes and read a wardrobe without signing up.
--
-- Run once in Supabase Dashboard -> SQL Editor. Safe to re-run.

revoke execute on function public.lookup_couple_by_code(text) from anon, public;
revoke execute on function public.get_partner_items(text) from anon, public;

grant execute on function public.lookup_couple_by_code(text) to authenticated;
grant execute on function public.get_partner_items(text) to authenticated;
