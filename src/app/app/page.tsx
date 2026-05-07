import AppPageClient from "@/components/AppPageClient";
import { createClient } from "@/lib/supabase/server";

import type { Item, Category, ItemType, ColorFamily } from "@/lib/engine/types";

type DbItem = {
  id: string;
  category: string;
  type: string;
  color_family: string | null;
  image_url: string | null;
};

export default async function Page() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Nëse nuk ka login, shfaq app-in bosh (pa redirect)
  if (!user) {
    return <AppPageClient initialItems={[]} />;
  }

  const { data, error } = await supabase
    .from("items")
    .select("id, category, type, color_family, image_url")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) console.error("items fetch error:", error.message);

  const rows = (data ?? []) as DbItem[];

  const initialItems: Item[] = rows.map((r) => ({
    id: String(r.id),
    category: r.category as Category,
    type: r.type as ItemType,
    color_family: (r.color_family ?? "neutral") as ColorFamily,
    image_url: r.image_url ?? undefined,
  }));

  return <AppPageClient initialItems={initialItems} />;
}