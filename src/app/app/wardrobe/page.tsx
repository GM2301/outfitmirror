import { redirect } from "next/navigation";
import AppPageClient from "@/components/AppPageClient";
import { createClient } from "@/lib/supabase/server";
import { prefsFromMetadata } from "@/lib/savedLooks";

import type { Item, Category, ItemType, ColorFamily } from "@/lib/engine/types";

type DbItem = {
  id: string;
  category: string;
  type: string;
  color_family: string | null;
  image_url: string | null;
  formality_tier: number | null;
  is_layer: boolean | null;
  is_inner: boolean | null;
  min_temp: number | null;
  max_temp: number | null;
  style_tags: string[] | null;
};

export default async function Page() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Same fix as app/page.tsx: was dropping formality_tier/is_layer/is_inner/
  // min_temp/max_temp/style_tags for every item, forcing the engine to fall
  // back to generic type-based inference instead of the AI's actual values.
  const { data, error } = await supabase
    .from("items")
    .select("id, category, type, color_family, image_url, formality_tier, is_layer, is_inner, min_temp, max_temp, style_tags")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("items fetch error:", error.message);
  }

  const rows = (data ?? []) as DbItem[];

  const initialItems: Item[] = rows.map((r) => ({
    id: String(r.id),
    category: r.category as Category,
    type: r.type as ItemType,
    color_family: (r.color_family ?? "neutral") as ColorFamily,
    image_url: r.image_url ?? undefined,
    formality_tier: r.formality_tier,
    is_layer: r.is_layer,
    is_inner: r.is_inner,
    min_temp: r.min_temp,
    max_temp: r.max_temp,
    style_tags: r.style_tags,
  }));

  // Gender/style/onboarding come from the account, so the first render is
  // already right (no Menswear flash for Womenswear users, no onboarding again
  // on a new phone).
  return <AppPageClient initialItems={initialItems} initialPrefs={prefsFromMetadata(user.user_metadata)} />;
}