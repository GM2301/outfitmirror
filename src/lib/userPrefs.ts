// src/lib/userPrefs.ts
// Shared localStorage-backed user preferences that MUST behave identically
// wherever outfits get generated (main app, Trip Planner, Instant Swap).
// Previously each caller had its own copy (or no copy at all) of this logic,
// which is exactly how "liked/disliked ignored in Trip Planner" and similar
// cross-feature inconsistencies happened - one file gets updated, the other
// silently doesn't.

import type { VotedItemIds } from "@/lib/engine/types";

export function loadVotedItemIds(): VotedItemIds {
  if (typeof window === "undefined") return { liked: [], disliked: [] };
  try {
    const raw = localStorage.getItem("om_voted_items");
    if (!raw) return { liked: [], disliked: [] };
    const parsed = JSON.parse(raw);
    return {
      liked: Array.isArray(parsed.liked) ? parsed.liked : [],
      disliked: Array.isArray(parsed.disliked) ? parsed.disliked : [],
    };
  } catch {
    return { liked: [], disliked: [] };
  }
}

export function saveVotedItemIds(v: VotedItemIds) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem("om_voted_items", JSON.stringify(v)); } catch {}
}

export function loadRecentItemIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("om_recent_items");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, 30) : [];
  } catch {
    return [];
  }
}

export function pushRecentItemIds(itemIds: string[]) {
  if (typeof window === "undefined") return;
  try {
    const existing = loadRecentItemIds();
    const merged = [...itemIds, ...existing.filter(id => !itemIds.includes(id))].slice(0, 30);
    localStorage.setItem("om_recent_items", JSON.stringify(merged));
  } catch {}
}
