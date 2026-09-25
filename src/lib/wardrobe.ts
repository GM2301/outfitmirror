// src/lib/wardrobe.ts
// Small wardrobe helpers shared by the main screen and bulk upload.

import type { Item } from "@/lib/engine/types";

// Same category + type + color as something already in the wardrobe. Used to
// warn before saving - duplicate uploads (e.g. the same vest four times)
// otherwise clutter the wardrobe and the outfit alternatives.
export function findDuplicate(items: Item[], category: string, type: string, color: string): Item | undefined {
  const t = type.toLowerCase(), c = color.toLowerCase();
  return items.find(i => i.category === category && String(i.type).toLowerCase() === t && String(i.color_family).toLowerCase() === c);
}

// "In the wash" is per device on purpose (it changes daily and isn't worth a
// round-trip); items in it are left out of new looks.
const WASH_KEY = "om_unavailable";

export function loadInWash(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(WASH_KEY) ?? "[]");
    return Array.isArray(v) ? v : [];
  } catch { return []; }
}

export function toggleInWash(id: string): string[] {
  const cur = loadInWash();
  const next = cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id];
  try { localStorage.setItem(WASH_KEY, JSON.stringify(next)); } catch {}
  return next;
}
