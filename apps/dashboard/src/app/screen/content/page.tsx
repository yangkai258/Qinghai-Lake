import { TvStage } from "@/components/TvStage";
import { TvScreen } from "@/components/TvScreen";
import { KpiStrip } from "@/components/KpiStrip";
import { Panel } from "@/components/Panel";
import { getMeta, getScreen3, getOpenAlerts } from "@/lib/adapter";
import { fillContentKpi } from "@/lib/fillKpi";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [meta, data, alertCount] = await Promise.all([getMeta(), getScreen3(), getOpenAlerts()]);
  if (!data?.rows) throw new Error("no data");
  const kpis = fillContentKpi(data.rows);
  const totalWorks = data.rows.reduce((a, r) => a + r.worksTotal, 0);
  const top10 = [...data.rows].sort((a, b) => b.worksTotal - a.worksTotal).slice(0, 10);
  const maxW = Math.max(1, ...top10.map((r) => r.worksTotal));

  return (
    <TvStage>
      <TvScreen meta={meta} alertCount={alertCount} title={"内容运营 · 共 " + totalWorks + " 个作品"} sub="CONTENT OPS">
        <div className="h-full flex flex-col gap-3">
          <KpiStrip items={kpis} />
          <div className="grid grid-cols-12 gap-3 flex-1 min-h-0">
            <div className="col-span-7 min-h-0">
              <Panel alertCount={alertCount} title="作品数 TOP 10" sub="TOP 10 WORKS" height={870}>
                <ol className="space-y-3">
                  {top10.map((r, i) => {
                    const pct = Math.max(2, Math.round((r.worksTotal / maxW) * 100));
                    return (
                      <li key={r.accountName} className="flex items-center gap-3 text-sm min-w-0">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-md text-sm font-bold flex-shrink-0" style={{ background: i < 3 ? "rgba(58,160,255,0.30)" : "rgba(58,160,255,0.10)", color: "var(--ink)" }}>{i + 1}</span>
                        <span className="w-44 truncate flex-shrink-0">{r.accountName}</span>
                        <div className="flex-1 h-3 rounded min-w-0" style={{ background: "rgba(56,132,255,0.10)" }}>
                          <div className="h-3 rounded flex-shrink-0" style={{ width: `${pct}%`, background: "linear-gradient(90deg, var(--accent), var(--accent-2))" }} />
                        </div>
                        <span className="kpi-num flex-shrink-0 w-[100px] text-right truncate">{r.worksTotal}</span>
                      </li>
                    );
                  })}
                </ol>
              </Panel>
            </div>
            <div className="col-span-5 flex flex-col gap-3 min-h-0">
              <Panel alertCount={alertCount} title="完播率 TOP 5" sub="TOP 5 RATE" height={420}>
                <ul className="space-y-2 text-sm">
                  {[...data.rows].sort((a, b) => b.rate - a.rate).slice(0, 5).map((r) => (
                    <li key={r.accountName} className="flex items-center justify-between min-w-0">
                      <span className="truncate max-w-[200px]">{r.accountName}</span>
                      <span className="kpi-num flex-shrink-0 w-[80px] text-right truncate">{(r.rate * 100).toFixed(1)}%</span>
                    </li>
                  ))}
                </ul>
              </Panel>
              <Panel alertCount={alertCount} title="播放增量 TOP 5" sub="PLAYS INC" height={420}>
                <ul className="space-y-2 text-sm">
                  {[...data.rows].sort((a, b) => b.playsInc - a.playsInc).slice(0, 5).map((r) => (
                    <li key={r.accountName} className="flex items-center justify-between min-w-0">
                      <span className="truncate max-w-[200px]">{r.accountName}</span>
                      <span className="kpi-num flex-shrink-0 w-[120px] text-right truncate">{r.playsInc.toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
              </Panel>
            </div>
          </div>
        </div>
      </TvScreen>
    </TvStage>
  );
}
