"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type ItemRow = {
  id: any;
  category: string;
  type: string;
  color_family: string | null;
  image_url: string | null;
};

export default function ItemsList({ refreshKey }: { refreshKey: number }) {
  const supabase = createClient();
  const [items, setItems] = useState<ItemRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("items")
        .select("id, category, type, color_family, image_url")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (mounted) {
        setItems((data as any) ?? []);
        setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [refreshKey]);

  if (loading) return <p className="mt-3 text-sm text-neutral-600">Loading...</p>;
  if (!items.length) return <p className="mt-3 text-sm text-neutral-600">No items yet.</p>;

  return (
    <ul className="mt-4 space-y-2">
      {items.map((it) => (
        <li key={it.id} className="flex items-center justify-between rounded-xl border px-3 py-2">
          <div>
            <div className="font-medium">{it.type}</div>
            <div className="text-xs text-neutral-600">
              {it.category}{it.color_family ? ` • ${it.color_family}` : ""}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
