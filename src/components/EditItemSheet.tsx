"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import type { Category, Gender, Item } from "@/lib/engine/types";

// Fix what the photo AI got wrong (category, type, color) or delete the item.
// Previously the only option was deleting and re-uploading.

const CATEGORIES: { id: Category; label: string; emoji: string }[] = [
  { id: "top", label: "Top", emoji: "👕" },
  { id: "bottom", label: "Bottom", emoji: "👖" },
  { id: "shoes", label: "Shoes", emoji: "👟" },
  { id: "outerwear", label: "Outerwear", emoji: "🧥" },
  { id: "accessory", label: "Accessory", emoji: "💍" },
];

const TYPES: Record<Gender, Record<string, string[]>> = {
  male: {
    top: ["tee", "polo", "shirt", "sweater", "hoodie", "sweatshirt", "tank", "henley", "crewneck"],
    bottom: ["jeans", "chinos", "trousers", "shorts", "joggers", "sweatpants", "cargo"],
    shoes: ["sneakers", "running_shoes", "boots", "dress_shoes", "loafers", "sandals", "chelsea_boots"],
    outerwear: ["jacket", "blazer", "coat", "bomber", "denim_jacket", "puffer", "trench", "windbreaker", "vest"],
    accessory: ["watch", "belt", "cap", "sunglasses", "bag", "scarf", "bracelet"],
  },
  female: {
    top: ["blouse", "tee", "crop_top", "shirt", "knit", "tank", "cardigan", "bodysuit", "sweater", "dress", "midi_dress", "maxi_dress", "jumpsuit"],
    bottom: ["jeans", "trousers", "midi_skirt", "mini_skirt", "leggings", "shorts", "wide_leg_pants"],
    shoes: ["sneakers", "heels", "boots", "ankle_boots", "ballet_flats", "loafers", "mules", "sandals"],
    outerwear: ["jacket", "blazer", "coat", "trench", "denim_jacket", "puffer", "leather_jacket"],
    accessory: ["bag", "tote", "clutch", "sunglasses", "scarf", "hat", "jewelry", "belt"],
  },
};

const COLORS = ["black", "white", "grey", "beige", "brown", "navy", "blue", "green", "red", "burgundy", "orange", "yellow", "pink", "purple", "neutral"];

function pretty(s: string) { return s.replace(/_/g, " "); }

export default function EditItemSheet({ item, gender, onClose, onSave, onDelete }: {
  item: Item;
  gender: Gender;
  onClose: () => void;
  onSave: (changes: Partial<Item>) => Promise<string | null>;
  onDelete: () => void;
}) {
  const [category, setCategory] = React.useState<Category>(item.category);
  const [type, setType] = React.useState(String(item.type));
  const [color, setColor] = React.useState(String(item.color_family ?? "neutral"));
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const typeOptions = TYPES[gender][category] ?? [];
  const types = typeOptions.includes(type) ? typeOptions : [type, ...typeOptions];
  const colors = COLORS.includes(color) ? COLORS : [color, ...COLORS];
  const changed = category !== item.category || type !== item.type || color !== item.color_family;

  async function save() {
    setSaving(true); setError(null);
    const changes: Partial<Item> = { category, type, color_family: color };
    // The AI's warmth/formality belonged to the old type (a "tee" corrected
    // to "hoodie" kept 16-35°C). Clear them so the engine infers from the new type.
    if (category !== item.category || type !== item.type) {
      Object.assign(changes, { min_temp: null, max_temp: null, formality_tier: null, is_layer: null, is_inner: null });
    }
    const err = await onSave(changes);
    if (err) { setError(err); setSaving(false); }
  }

  if (typeof document === "undefined") return null;
  return createPortal(
    <>
      <div className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm overlay-enter" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl max-h-[88vh] overflow-y-auto drawer-enter"
        style={{ background: "#FAF8F5", boxShadow: "0 -8px 40px rgba(0,0,0,0.15)" }}>
        <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-neutral-200" /></div>
        <div className="px-5 pb-8 pt-2 max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 style={{ fontFamily: "'Cormorant', Georgia, serif", fontSize: "24px", fontWeight: 400, color: "#1A1A1A" }}>Edit item</h2>
            <button type="button" onClick={onClose} aria-label="Close"
              className="w-8 h-8 rounded-full border border-black/10 flex items-center justify-center text-neutral-400 hover:bg-neutral-50 transition">✕</button>
          </div>

          <div className="flex gap-4 mb-5">
            <div className="w-24 h-24 rounded-2xl bg-white overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
              {item.image_url
                ? <img src={item.image_url} alt={pretty(String(item.type))} className="w-full h-full object-contain p-1.5" />
                : <span className="text-3xl opacity-50">{CATEGORIES.find(c => c.id === category)?.emoji}</span>}
            </div>
            <p className="text-xs text-neutral-500 leading-relaxed self-center">
              Correct anything the photo AI got wrong. Outfits use these details, so a wrong category or color gives wrong looks.
            </p>
          </div>

          <label className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-400 mb-2 block">Category</label>
          <div className="grid grid-cols-3 gap-2 mb-5">
            {CATEGORIES.map(c => (
              <button key={c.id} type="button" onClick={() => { setCategory(c.id); if (c.id !== item.category) setType(TYPES[gender][c.id][0]); else setType(String(item.type)); }}
                className={"rounded-xl border-2 py-3 text-xs font-bold transition " + (category === c.id ? "bg-black text-white border-black" : "border-black/10 bg-white")}>
                {c.emoji} {c.label}
              </button>
            ))}
          </div>

          <label className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-400 mb-2 block">Type</label>
          <select value={type} onChange={e => setType(e.target.value)}
            className="w-full rounded-xl border-2 border-black/10 px-4 py-3 bg-white text-sm mb-5 focus:outline-none focus:border-black/25">
            {types.map(t => <option key={t} value={t}>{pretty(t)}</option>)}
          </select>

          <label className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-400 mb-2 block">Color</label>
          <div className="flex flex-wrap gap-2 mb-6">
            {colors.map(c => (
              <button key={c} type="button" onClick={() => setColor(c)}
                className={"rounded-full border-2 px-3 py-1.5 text-xs font-medium capitalize transition " + (color === c ? "bg-black text-white border-black" : "border-black/10 bg-white")}>
                {c}
              </button>
            ))}
          </div>

          {error && <p className="mb-3 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">{error}</p>}

          <button type="button" onClick={save} disabled={!changed || saving}
            className="w-full rounded-xl bg-black text-white py-3.5 text-sm font-bold disabled:opacity-40 hover:bg-black/85 transition">
            {saving ? "Saving…" : "Save changes"}
          </button>
          <button type="button" onClick={onDelete}
            className="w-full mt-3 rounded-xl border border-red-200 py-3 text-sm font-medium text-red-500 hover:bg-red-50 transition">
            Delete item
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}
