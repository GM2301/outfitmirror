// src/lib/engine/mockWardrobe.ts
import type { Item } from "./types";

export const mockWardrobe: Item[] = [
  // TOPS
  { id: "top_tee_white",    category: "top", type: "tee",     color_family: "white" },
  { id: "top_tee_black",    category: "top", type: "tee",     color_family: "black" },
  { id: "top_polo_neutral", category: "top", type: "polo",    color_family: "neutral" },
  { id: "top_shirt_white",  category: "top", type: "shirt",   color_family: "white" },
  { id: "top_sweater_earth",category: "top", type: "sweater", color_family: "earth" },
  { id: "top_hoodie_black", category: "top", type: "hoodie",  color_family: "black" },
  { id: "top_blazer_navy",  category: "top", type: "blazer",  color_family: "blue" },

  // BOTTOMS
  { id: "bot_jeans_blue",     category: "bottom", type: "jeans",    color_family: "blue" },
  { id: "bot_jeans_black",    category: "bottom", type: "jeans",    color_family: "black" },
  { id: "bot_chinos_earth",   category: "bottom", type: "chinos",   color_family: "earth" },
  { id: "bot_trousers_black", category: "bottom", type: "trousers", color_family: "black" },
  { id: "bot_joggers_black",  category: "bottom", type: "joggers",  color_family: "black" },
  { id: "bot_shorts_neutral", category: "bottom", type: "shorts",   color_family: "neutral" },

  // SHOES
  { id: "shoe_sneakers_white",  category: "shoes", type: "sneakers",    color_family: "white" },
  { id: "shoe_sneakers_black",  category: "shoes", type: "sneakers",    color_family: "black" },
  { id: "shoe_running_neutral", category: "shoes", type: "running_shoes", color_family: "neutral" },
  { id: "shoe_dress_black",     category: "shoes", type: "dress_shoes", color_family: "black" },
  { id: "shoe_chelsea_black",   category: "shoes", type: "chelsea_boots", color_family: "black" },
  { id: "shoe_loafers_earth",   category: "shoes", type: "loafers",    color_family: "earth" },
];