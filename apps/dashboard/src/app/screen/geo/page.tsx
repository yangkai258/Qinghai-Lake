import { TvStage } from "@/components/TvStage";
import { TvScreen } from "@/components/TvScreen";
import { KpiStrip } from "@/components/KpiStrip";
import { Panel } from "@/components/Panel";
import { getMeta, getScreen6, getOpenAlerts } from "@/lib/adapter";
import { fillGeoKpi } from "@/lib/fillKpi";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [meta, data, alertCount] = await Promise.all([getMeta(), getScreen6(), getOpenAlerts()]);
  if (!data?.rows) throw new Error("no data");
  const kpis = fillGeoKpi(data.rows);

  // Region aggregation (treats dept as the geographic region)
  const regions = new Map<string, { fans: number; plays: number; count: number }>();
  data.rows.forEach((r) => {
    const dept = (r as any).dept ?? "未知";
    const existing = regions.get(dept) ?? { fans: 0, plays: 0, count: 0 };
    regions.set(dept, {
      fans: existing.fans + r.fansInc,
      plays: existing.plays + r.playsInc,
      count: existing.count + 1,
    });
  });

  const regionList = [...regions.entries()]
    .map(([dept, v]) => ({ dept, ...v }))
    .sort((a, b) => b.fans - a.fans);

  return (
    <TvStage>
      <TvScreen meta={meta} alertCount={alertCount} title="地域分布" sub="GEOGRAPHIC">
        <div className="h-full flex flex-col gap-3">
          <KpiStrip items={kpis} />
          <div className="flex flex-col gap-3 flex-1 min-h-0">
            <Panel alertCount={alertCount} title="部门粉丝增量排行" sub="FANS BY DEPT" height={500}>
              <ul className="space-y-2">
                {regionList.map((r) => (
                  <li key={r.dept} className="flex items-center gap-4 text-sm min-w-0">
                    <span className="tag muted flex-shrink-0">{r.dept}</span>
                    <span className="kpi-num flex-shrink-0 w-[140px] text-right truncate">+{r.fans.toLocaleString()}</span>
                    <span className="text-xs flex-shrink-0" style={{ color: "var(--ink-dim)" }}>{r.count} 账号</span>
                  </li>
                ))}
              </ul>
            </Panel>
            <Panel alertCount={alertCount} title="地域播放增量 TOP 5" sub="PLAYS BY REGION" height={340}>
              <ul className="space-y-2 text-sm">
                {[...regionList].sort((a, b) => b.plays - a.plays).slice(0, 5).map((r, i) => (
                  <li key={r.dept} className="flex items-center justify-between min-w-0">
                    <span className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs font-bold" style={{ color: "var(--ink-dim)" }}>#{i + 1}</span>
                      <span className="tag muted">{r.dept}</span>
                    </span>
                    <span className="kpi-num flex-shrink-0 w-[140px] text-right truncate">{r.plays.toLocaleString()}</span>
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
