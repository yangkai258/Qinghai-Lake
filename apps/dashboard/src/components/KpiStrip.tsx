import { KpiCard } from "./KpiCard";
import type { Kpi6 } from "@/lib/types";

/**
 * KpiStrip — ALWAYS renders 6 tiles, padding with neutral zeros so the
 * layout never collapses. Use small/lg to control tile text size.
 */
export function KpiStrip({ items, lg = false }: { items: Kpi6[]; lg?: boolean }) {
  const tiles: Kpi6[] = items.slice(0, 6);
  while (tiles.length < 6) tiles.push({ label: "—", value: "—" });
  return (
    <div className="grid grid-cols-6 gap-3" style={{ height: 132 }}>
      {tiles.map((t, i) => <KpiCard key={i} tile={t} lg={lg} />)}
    </div>
  );
}