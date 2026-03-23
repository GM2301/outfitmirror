// src/components/DemoItemCard.tsx
import React from "react";
import type { Item } from "@/lib/engine/types";

function cap(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// color_family tash vjen si ColorFamily (union), po ne e trajtojmë si string për UI
function pillBg(color: Item["color_family"]) {
  if (color === "black") return "bg-black text-white";
  if (color === "white") return "bg-white text-neutral-900 border";
  if (color === "blue") return "bg-blue-500 text-white";
  if (color === "earth") return "bg-amber-200 text-neutral-900";
  return "bg-neutral-200 text-neutral-900";
}

function cardBg(color: Item["color_family"]) {
  if (color === "black") return "bg-gradient-to-br from-neutral-900 to-neutral-700 text-white";
  if (color === "white") return "bg-gradient-to-br from-white to-neutral-100 text-neutral-900 border";
  if (color === "blue") return "bg-gradient-to-br from-blue-200 to-blue-100 text-neutral-900";
  if (color === "earth") return "bg-gradient-to-br from-amber-200 to-amber-100 text-neutral-900";
  return "bg-gradient-to-br from-neutral-100 to-neutral-50 text-neutral-900 border";
}

function Icon({ category }: { category: Item["category"] }) {
  if (category === "top") return <span className="text-xl">👕</span>;
  if (category === "bottom") return <span className="text-xl">👖</span>;
  return <span className="text-xl">👟</span>;
}

export default function DemoItemCard({
  item,
  selected,
  onClick,
  small,
}: {
  item: Item;
  selected: boolean;
  onClick: () => void;
  small?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left rounded-[22px] border bg-white p-4 transition shadow-sm hover:shadow-md ${
        selected ? "ring-2 ring-neutral-900" : ""
      }`}
    >
      <div className={`rounded-2xl p-4 ${cardBg(item.color_family)} ${small ? "h-[90px]" : "h-[110px]"}`}>
        <div className="text-sm opacity-80">{cap(item.category)}</div>
        <div className={`mt-1 font-semibold ${small ? "text-lg" : "text-2xl"}`}>{cap(item.type)}</div>
        <div className="opacity-80">{cap(String(item.color_family))}</div>
        <div className="mt-2 flex justify-end">
          <Icon category={item.category} />
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <div className="text-sm text-neutral-600 truncate">{item.id}</div>
        <span className={`ml-auto rounded-full px-2 py-1 text-xs ${pillBg(item.color_family)}`}>
          {String(item.color_family)}
        </span>
      </div>
    </button>
  );
}
