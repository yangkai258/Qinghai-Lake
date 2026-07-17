import { TvStage } from "@/components/TvStage";
import { TvScreen } from "@/components/TvScreen";
import { KpiStrip } from "@/components/KpiStrip";
import { Panel } from "@/components/Panel";
import { getMeta, getScreen5, getOpenAlerts } from "@/lib/adapter";
import { fillTrendKpi } from "@/lib/fillKpi";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [meta, data, alertCount] = await Promise.all([getMeta(), getScreen5(), getOpenAlerts()]);
  if (!data?.rows) throw new Error("no data");
  const kpis = fillTrendKpi(data.rows);

  // Aggregate by department
  const byDept = new Map<string, { plays: number; works: number; n: number; rate: number }>();
  data.rows.forEach((r) => {
    const dept = (r as any).dept ?? "未知";
    const existing = byDept.get(dept) ?? { plays: 0, works: 0, n: 0, rate: 0 };
    byDept.set(dept, {
      plays: existing.plays + r.playsInc,
      works: existing.works + r.worksTotal,
      n: existing.n + 1,
      rate: existing.n > 0 ? (existing.rate * existing.n + r.rate) / (existing.n + 1) : r.rate,
    });
  });

  const deptList = [...byDept.entries()].map(([dept, v]) => ({ dept, ...v })).sort((a, b) => b.rate - a.rate);

  return (
    <TvStage>
      <TvScreen meta={meta} alertCount={alertCount} title="趋势分析" sub="TREND ANALYSIS">
        <div className="h-full flex flex-col gap-3">
          <KpiStrip items={kpis} />
          <div className="flex flex-col gap-3 flex-1 min-h-0">
            <Panel alertCount={alertCount} title="完播率趋势 TOP 5" sub="RATE TREND" height={500}>
              <ul className="space-y-2 text-sm">
                {[...data.rows].sort((a, b) => b.rate - a.rate).slice(0, 5).map((r, i) => (
                  <li key={r.accountName} className="flex items-center justify-between min-w-0">
                    <span className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-bold flex-shrink-0" style={{ color: "var(--ink-dim)" }}>#{i + 1}</span>
                      <span className="truncate max-w-[300px]">{r.accountName}</span>
                    </span>
                    <span className="kpi-num flex-shrink-0 w-[80px] text-right truncate">{(r.rate * 100).toFixed(1)}%</span>
                  </li>
                ))}
              </ul>
            </Panel>
            <Panel alertCount={alertCount} title="部门完播率对比" sub="RATE BY DEPT" height={340}>
              <ul className="space-y-2 text-sm">
                {deptList.slice(0, 6).map((d) => (
                  <li key={d.dept} className="flex items-center justify-between min-w-0">
                    <span className="tag muted truncate max-w-[120px]">{d.dept}</span>
                    <span className="kpi-num flex-shrink-0 w-[80px] text-right truncate">{(d.rate * 100).toFixed(1)}%</span>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>
        </div>
      </TvScreen>
    </TvStage>
  );
}
