import type { Kpi6 } from "@/lib/types";
import { CountUp } from "@/components/rb";
import { cn, STATUS_LABEL } from "@/lib/utils";

/**
 * KpiCard 鈥?a single KPI tile. 116px min height, kpi-num uses mono big font.
 * Trend up/down uses unicode escapes to avoid CJK encoding mishaps via tooling.
 */
export function KpiCard({ tile, lg }: { tile: Kpi6; lg?: boolean }) {
  const tone = tile.tone ?? "default";
  const colorMap = { default: "var(--ink)", good: "var(--good)", warn: "var(--warn)", bad: "var(--bad)" };
  const trendChar =
    tile.trend === "up" ? "\u25B2" : tile.trend === "down" ? "\u25BC" : "\u2014";
  const trendColor =
    tile.trend === "up" ? "var(--good)" : tile.trend === "down" ? "var(--bad)" : "var(--ink-dim)";
  return (
    <div className="panel tv-screen flex flex-col justify-between p-4" style={{ minHeight: 116 }}>
      <span className="panel-corner tl" />
      <span className="panel-corner tr" />
      <span className="panel-corner bl" />
      <span className="panel-corner br" />
      <div className="text-xs uppercase tracking-[0.2em]" style={{ color: "var(--ink-dim)" }}>{tile.label}</div>
      <div className="flex items-baseline gap-2">
        <span className={cn("kpi-num", lg ? "text-[2.6rem]" : "text-[2.1rem]")} style={{ color: colorMap[tone] }}>
          {typeof tile.value === "number" ? <CountUp value={tile.value} duration={900} /> : tile.value}
        </span>
        {tile.unit ? <span className="text-sm" style={{ color: "var(--ink-dim)" }}>{tile.unit}</span> : null}
      </div>
      {tile.trend ? (
        <div className="flex items-center gap-1 text-xs" style={{ color: trendColor }}>
          <span>{trendChar}</span>
          <span>{STATUS_LABEL.live}</span>
        </div>
      ) : null}
    </div>
  );
}