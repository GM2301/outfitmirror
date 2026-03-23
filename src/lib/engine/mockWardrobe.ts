import type { Item } from "./types";

export const mockWardrobe: Item[] = [
  // TOPS
  { id: "top_tee_white", category: "top", type: "tee", color_family: "neutral" },
  { id: "top_tee_black", category: "top", type: "tee", color_family: "neutral" },
  { id: "top_polo_neutral", category: "top", type: "polo", color_family: "neutral" },
  { id: "top_shirt_blue", category: "top", type: "shirt", color_family: "bright" },
  { id: "top_sweater_earth", category: "top", type: "sweater", color_family: "earth" },
  { id: "top_hoodie_black", category: "top", type: "hoodie", color_family: "neutral" },
  { id: "top_jacket_black", category: "top", type: "jacket", color_family: "neutral" },

  // BOTTOMS
  { id: "bot_jeans_blue", category: "bottom", type: "jeans", color_family: "bright" },
  { id: "bot_jeans_black", category: "bottom", type: "jeans", color_family: "neutral" },
  { id: "bot_chinos_earth", category: "bottom", type: "chinos", color_family: "earth" },
  { id: "bot_trousers_neutral", category: "bottom", type: "trousers", color_family: "neutral" },
  { id: "bot_joggers_black", category: "bottom", type: "joggers", color_family: "neutral" },
  { id: "bot_shorts_black", category: "bottom", type: "shorts", color_family: "neutral" },

  // SHOES
  { id: "shoe_white_sneakers_white", category: "shoes", type: "sneakers", color_family: "neutral" },
  { id: "shoe_black_sneakers_black", category: "shoes", type: "sneakers", color_family: "neutral" },
  { id: "shoe_running_shoes", category: "shoes", type: "running_shoes", color_family: "bright" },
  { id: "shoe_dress_shoes_black", category: "shoes", type: "dress_shoes", color_family: "neutral" },
  { id: "shoe_boots_black", category: "shoes", type: "boots", color_family: "neutral" },
  { id: "shoe_loafers_brown", category: "shoes", type: "loafers", color_family: "earth" },
];
