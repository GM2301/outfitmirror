"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = { onAdded?: () => void };

export default function AddItemForm({ onAdded }: Props) {
  const supabase = createClient();

  const [category, setCategory] = useState<"top" | "bottom" | "shoes">("top");
  const [type, setType] = useState("");
  const [colorFamily, setColorFamily] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setMsg("Not logged in.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("items").insert({
      user_id: user.id,     // për momentin si e keni
      category,
      type,
      color_family: colorFamily || null,
      image_url: imageUrl || null,
    });

    if (error) setMsg(error.message);
    else {
      setType("");
      setColorFamily("");
      setImageUrl("");
      setMsg("Saved ✅");
      onAdded?.();
    }

    setLoading(false);
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 space-y-3">
      <div>
        <label className="text-sm text-neutral-600">Category</label>
        <select
          className="mt-1 w-full rounded-xl border px-3 py-2"
          value={category}
          onChange={(e) => setCategory(e.target.value as any)}
        >
          <option value="top">top</option>
          <option value="bottom">bottom</option>
          <option value="shoes">shoes</option>
        </select>
      </div>

      <div>
        <label className="text-sm text-neutral-600">Type</label>
        <input
          className="mt-1 w-full rounded-xl border px-3 py-2"
          value={type}
          onChange={(e) => setType(e.target.value)}
          placeholder="e.g. polo, jeans, boots"
          required
        />
      </div>

      <div>
        <label className="text-sm text-neutral-600">Color family (optional)</label>
        <input
          className="mt-1 w-full rounded-xl border px-3 py-2"
          value={colorFamily}
          onChange={(e) => setColorFamily(e.target.value)}
          placeholder="neutral / blue / earth..."
        />
      </div>

      <div>
        <label className="text-sm text-neutral-600">Image URL (optional)</label>
        <input
          className="mt-1 w-full rounded-xl border px-3 py-2"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://..."
        />
      </div>

      <button
        disabled={loading}
        className="w-full rounded-xl bg-black px-4 py-2 text-white disabled:opacity-60"
      >
        {loading ? "Saving..." : "Save item"}
      </button>

      {msg && <p className="text-sm text-neutral-600">{msg}</p>}
    </form>
  );
}
