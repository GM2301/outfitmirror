import type { Outfit } from "@/lib/engine/types";
import { createClient } from "@/lib/supabase/client";

const KEY = "outfitmirror:saved:v1";

export type SavedOutfit = Outfit & { savedAt: number };

function isBrowser() {
  return typeof window !== "undefined";
}

export async function loadSavedOutfits(userId?: string): Promise<SavedOutfit[]> {
  if (!isBrowser()) return [];

  if (!userId) {
    return loadSavedOutfitsFromLocalStorage();
  }

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("feedback")
      .select("*")
      .eq("user_id", userId)
      .eq("vote", "saved")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error loading saved outfits from Supabase:", error);
      return loadSavedOutfitsFromLocalStorage();
    }

    if (!data) return [];

    return data
      .map((record) => {
        try {
          if (record.outfit_hash && record.outfit_hash.startsWith("{")) {
            const outfitData = JSON.parse(record.outfit_hash);
            return {
              ...outfitData,
              savedAt: new Date(record.created_at).getTime(),
            } as SavedOutfit;
          }
          return null;
        } catch {
          return null;
        }
      })
      .filter((outfit): outfit is SavedOutfit => outfit !== null);
  } catch (error) {
    console.error("Error loading saved outfits:", error);
    return loadSavedOutfitsFromLocalStorage();
  }
}

function loadSavedOutfitsFromLocalStorage(): SavedOutfit[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedOutfit[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveOutfit(
  outfit: Outfit,
  userId?: string
): Promise<SavedOutfit[]> {
  if (!isBrowser()) return [];

  // FIX: picks.top/bottom/shoes (jo items.top/bottom/shoes)
  const sig = `${outfit.occasion}:${outfit.label}:${outfit.picks.top.id}:${outfit.picks.bottom.id}:${outfit.picks.shoes.id}`;
  const savedAt = Date.now();

  if (!userId) {
    const existing = loadSavedOutfitsFromLocalStorage();
    const next: SavedOutfit[] = [
      { ...outfit, savedAt },
      ...existing.filter((o) => {
        const s = `${o.occasion}:${o.label}:${o.picks.top.id}:${o.picks.bottom.id}:${o.picks.shoes.id}`;
        return s !== sig;
      }),
    ].slice(0, 50);
    window.localStorage.setItem(KEY, JSON.stringify(next));
    return next;
  }

  try {
    const supabase = createClient();

    const outfitHash = JSON.stringify({ ...outfit, savedAt });

    // FIX: picks.top/bottom/shoes
    const itemIds = [
      outfit.picks.top.id,
      outfit.picks.bottom.id,
      outfit.picks.shoes.id,
    ].join(",");

    const { data: existingRecords } = await supabase
      .from("feedback")
      .select("id, outfit_hash")
      .eq("user_id", userId)
      .eq("occasion", outfit.occasion)
      .eq("vote", "saved");

    const existing = existingRecords?.find((record) => {
      try {
        if (record.outfit_hash && record.outfit_hash.startsWith("{")) {
          const parsed = JSON.parse(record.outfit_hash);
          // FIX: parsed.picks
          return (
            parsed.label === outfit.label &&
            parsed.picks?.top?.id === outfit.picks.top.id &&
            parsed.picks?.bottom?.id === outfit.picks.bottom.id &&
            parsed.picks?.shoes?.id === outfit.picks.shoes.id
          );
        }
        return false;
      } catch {
        return false;
      }
    });

    if (existing) {
      await supabase
        .from("feedback")
        .update({
          created_at: new Date().toISOString(),
          outfit_hash: outfitHash,
        })
        .eq("id", existing.id);
    } else {
      const { error } = await supabase.from("feedback").insert({
        user_id: userId,
        occasion: outfit.occasion,
        outfit_hash: outfitHash,
        top_id: outfit.picks.top.id,
        bottom_id: outfit.picks.bottom.id,
        shoes_id: outfit.picks.shoes.id,
        vote: "saved",
      });

      if (error) {
        console.error("Error saving outfit to Supabase:", error);
        return saveOutfitToLocalStorage(outfit);
      }
    }

    return await loadSavedOutfits(userId);
  } catch (error) {
    console.error("Error saving outfit:", error);
    return saveOutfitToLocalStorage(outfit);
  }
}

function saveOutfitToLocalStorage(outfit: Outfit): SavedOutfit[] {
  const existing = loadSavedOutfitsFromLocalStorage();
  // FIX: picks.top/bottom/shoes
  const sig = `${outfit.occasion}:${outfit.label}:${outfit.picks.top.id}:${outfit.picks.bottom.id}:${outfit.picks.shoes.id}`;
  const next: SavedOutfit[] = [
    { ...outfit, savedAt: Date.now() },
    ...existing.filter((o) => {
      const s = `${o.occasion}:${o.label}:${o.picks.top.id}:${o.picks.bottom.id}:${o.picks.shoes.id}`;
      return s !== sig;
    }),
  ].slice(0, 50);
  window.localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export async function clearSavedOutfits(userId?: string): Promise<void> {
  if (!isBrowser()) return;

  if (userId) {
    try {
      const supabase = createClient();
      await supabase
        .from("feedback")
        .delete()
        .eq("user_id", userId)
        .eq("vote", "saved");
    } catch (error) {
      console.error("Error clearing saved outfits from Supabase:", error);
    }
  }

  window.localStorage.removeItem(KEY);
}