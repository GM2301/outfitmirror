-- Remove Couple Mode v1, replaced by couple_links (2026-09-25_couple_links.sql).
-- v1 "codes" gave permanent wardrobe access to whoever held them; nothing in
-- the app uses these objects any more.
drop function if exists public.lookup_couple_by_code(text);
drop function if exists public.get_partner_items(text);
drop table if exists public.couples;
