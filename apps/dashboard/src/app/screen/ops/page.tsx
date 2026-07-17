import { TvStage } from "@/components/TvStage";
import { TvScreen } from "@/components/TvScreen";
import { KpiStrip } from "@/components/KpiStrip";
import { Panel } from "@/components/Panel";
import { getMeta, getScreen2, getOpenAlerts } from "@/lib/adapter";
import { fillOpsKpi } from "@/lib/fillKpi";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [meta, data, alertCount] = await Promise.all([getMeta(), getScreen2(), getOpenAlerts()]);
  if (!data?.rows) throw new Error("no data");
  const kpis = fillOpsKpi(data.rows);
  const top5 = data.rows.slice(0, 5);

  return (
    <TvStage>
      <TvScreen meta={meta} alertCount={alertCount} title="运营总览" sub="OPS DASHBOARD">
        <div className="h-full flex flex-col gap-3">
          <KpiStrip items={kpis} />
          <div className="flex flex-col gap-3 flex-1 min-h-0">
            <Panel alertCount={alertCount} title="播放增量 TOP 5" sub="PLAYS INC" height={420}>
              <ul className="space-y-2 text-sm">
                {top5.map((r, i) => (
                  <li key={r.accountName} className="flex items-center justify-between min-w-0">
                    <span className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-bold flex-shrink-0" style={{ color: "var(--ink-dim)" }}>#{i + 1}</span>
                      <span className="truncate max-w-[160px]">{r.accountName}</span>
                    </span>
                    <span className="kpi-num flex-shrink-0 w-[130px] text-right truncate">{r.playsInc.toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            </Panel>
            <Panel alertCount={alertCount} title="粉丝增量 TOP 5" sub="FANS INC" height={420}>
              <ul className="space-y-2 text-sm">
                {[...data.rows].sort((a, b) => b.fansInc - a.fansInc).slice(0, 5).map((r, i) => (
                  <li key={r.accountName} className="flex items-center justify-between min-w-0">
                    <span className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-bold flex-shrink-0" style={{ color: "var(--ink-dim)" }}>#{i + 1}</span>
                      <span className="truncate max-w-[160px]">{r.accountName}</span>
                    </span>
                    <span className="kpi-num flex-shrink-0 w-[130px] text-right truncate">{r.fansInc.toLocaleString()}</span>
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
