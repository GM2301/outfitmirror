// src/lib/savedLooks.ts
// Looks the user saved with ♥, stored in Supabase (table saved_looks) so they
// survive a new phone or a reinstall. See supabase/2026-09-26_saved_looks.sql.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Gender, OutfitPicks } from "@/lib/engine/types";

export type SavedLook = { id: string; occasion: string; item_ids: string[]; created_at: string };

export function pickIds(p: OutfitPicks): string[] {
  return [p.outer, p.top, p.inner, p.bottom, p.shoes].filter(Boolean).map(it => it!.id);
}

export async function loadSavedLooks(supabase: SupabaseClient): Promise<SavedLook[]> {
  const { data, error } = await supabase
    .from("saved_looks")
    .select("id, occasion, item_ids, created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) { console.error("[savedLooks] load failed:", error.message); return []; }
  return (data ?? []) as SavedLook[];
}

export async function saveLook(supabase: SupabaseClient, occasion: string, picks: OutfitPicks): Promise<SavedLook | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from("saved_looks")
    .insert({ user_id: user.id, occasion, item_ids: pickIds(picks) })
    .select("id, occasion, item_ids, created_at")
    .single();
  if (error) { console.error("[savedLooks] save failed:", error.message); return null; }
  return data as SavedLook;
}

export async function deleteSavedLook(supabase: SupabaseClient, id: string): Promise<boolean> {
  const { error } = await supabase.from("saved_looks").delete().eq("id", id);
  return !error;
}

// ─── Preferences ─────────────────────────────────────────────────────────────
// Gender, style and "onboarding done" live in the account (auth user_metadata)
// so a new phone doesn't restart onboarding or switch Womenswear to Menswear.
// localStorage keeps a copy because other screens read it synchronously.

export type Prefs = { gender?: Gender; style?: string; onboarding_done?: boolean };

export function prefsFromMetadata(meta: Record<string, unknown> | null | undefined): Prefs {
  const m = meta ?? {};
  return {
    gender: m.gender === "female" ? "female" : m.gender === "male" ? "male" : undefined,
    style: typeof m.style === "string" ? m.style : undefined,
    onboarding_done: m.onboarding_done === true,
  };
}

export function mirrorPrefsLocally(p: Prefs) {
  try {
    if (p.gender) localStorage.setItem("om_gender", p.gender);
    if (p.style) localStorage.setItem("om_style", p.style);
    if (p.onboarding_done) localStorage.setItem("om_onboarding_done", "1");
  } catch {}
}

export async function savePrefs(supabase: SupabaseClient, p: Prefs): Promise<void> {
  mirrorPrefsLocally(p);
  const data: Record<string, unknown> = {};
  if (p.gender) data.gender = p.gender;
  if (p.style) data.style = p.style;
  if (p.onboarding_done !== undefined) data.onboarding_done = p.onboarding_done;
  const { error } = await supabase.auth.updateUser({ data });
  if (error) console.error("[prefs] save failed:", error.message);
}
