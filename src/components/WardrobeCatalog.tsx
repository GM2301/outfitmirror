// src/components/WardrobeCatalog.tsx
import React, { useMemo, useState } from "react";
import type { Item } from "@/lib/engine/types";
import DemoItemCard from "./DemoItemCard";

export default function WardrobeCatalog({
  title,
  items,
  pinnedId,
  onPick,
}: {
  title: string;
  items: Item[];
  pinnedId: string | null;
  onPick: (it: Item) => void;
}) {
  const [filterType, setFilterType] = useState<string>("all");

  const types = useMemo(() => {
    const s = new Set(items.map((i) => i.type));
    return ["all", ...Array.from(s)];
  }, [items]);

  const filtered = useMemo(() => {
    if (filterType === "all") return items;
    return items.filter((i) => i.type === filterType);
  }, [items, filterType]);

  return (
    <div className="rounded-[28px] border bg-white p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xl font-semibold">{title}</div>
          <div className="text-sm text-neutral-500">{items.length} items • klik për PIN</div>
        </div>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="rounded-full border px-3 py-2 text-sm"
        >
          {types.map((t) => (
            <option key={t} value={t}>
              {t === "all" ? "auto" : t}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {filtered.map((it) => (
          <DemoItemCard
            key={it.id}
            item={it}
            selected={pinnedId === it.id}
            onClick={() => onPick(it)}
          />
        ))}
      </div>
    </div>
  );
}
