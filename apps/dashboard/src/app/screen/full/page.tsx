import { TvStage } from "@/components/TvStage";
import { TvScreen } from "@/components/TvScreen";
import { KpiStrip } from "@/components/KpiStrip";
import { Panel } from "@/components/Panel";
import { getMeta, getScreen4, getOpenAlerts } from "@/lib/adapter";
import { fillFullKpi } from "@/lib/fillKpi";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [meta, data, alertCount] = await Promise.all([getMeta(), getScreen4(), getOpenAlerts()]);
  if (!data?.rows) throw new Error("no data");
  const kpis = fillFullKpi(data.rows);
  const totalFans = data.rows.reduce((a, r) => a + r.fansTotal, 0);
  const top5 = [...data.rows].sort((a, b) => b.fansTotal - a.fansTotal).slice(0, 5);
  const maxF = Math.max(1, ...top5.map((r) => r.fansTotal));

  return (
    <TvStage>
      <TvScreen meta={meta} alertCount={alertCount} title={"全域看板 · 共 " + totalFans.toLocaleString() + " 粉丝"} sub="FULL OVERVIEW">
        <div className="h-full flex flex-col gap-3">
          <KpiStrip items={kpis} />
          <div className="flex flex-col gap-3 flex-1 min-h-0">
            <Panel alertCount={alertCount} title="粉丝总量 TOP 5" sub="TOP 5 FANS" height={420}>
              <ul className="space-y-3">
                {top5.map((r, i) => {
                  const pct = Math.max(2, Math.round((r.fansTotal / maxF) * 100));
                  return (
                    <li key={r.accountName} className="flex items-center gap-3 text-sm min-w-0">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-md text-sm font-bold flex-shrink-0" style={{ background: i < 3 ? "rgba(58,160,255,0.30)" : "rgba(58,160,255,0.10)", color: "var(--ink)" }}>{i + 1}</span>
                      <span className="w-44 truncate flex-shrink-0">{r.accountName}</span>
                      <div className="flex-1 h-3 rounded min-w-0" style={{ background: "rgba(56,132,255,0.10)" }}>
                        <div className="h-3 rounded flex-shrink-0" style={{ width: `${pct}%`, background: "linear-gradient(90deg, var(--accent), var(--accent-2))" }} />
                      </div>
                      <span className="kpi-num flex-shrink-0 w-[140px] text-right truncate">{r.fansTotal.toLocaleString()}</span>
                    </li>
                  );
                })}
              </ul>
            </Panel>
            <Panel alertCount={alertCount} title="完播率 TOP 5" sub="TOP 5 RATE" height={420}>
              <ul className="space-y-2 text-sm">
                {[...data.rows].sort((a, b) => b.rate - a.rate).slice(0, 5).map((r) => (
                  <li key={r.accountName} className="flex items-center justify-between min-w-0">
                    <span className="truncate max-w-[300px]">{r.accountName}</span>
                    <span className="kpi-num flex-shrink-0 w-[80px] text-right truncate">{(r.rate * 100).toFixed(1)}%</span>
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
