import { TvStage } from "@/components/TvStage";
import { TvScreen } from "@/components/TvScreen";
import { KpiStrip } from "@/components/KpiStrip";
import { Panel } from "@/components/Panel";
import { RankList } from "@/components/RankList";
import { Sparkline } from "@/components/Sparkline";
import { getMeta, getScreen1, getOpenAlerts } from "@/lib/adapter";
import { fillOpsKpi } from "@/lib/fillKpi";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [meta, data, alertCount] = await Promise.all([getMeta(), getScreen1(), getOpenAlerts()]);
  const kpis = fillOpsKpi(data.rows);
  const trend = data.rows.slice(0, 12).map((r) => r.playsInc);

  return (
    <TvStage>
      <TvScreen
        meta={meta}
        title={"高层决策屏 · " + meta.totalAccounts + " 账号"}
        sub="EXEC OVERVIEW"
        alertCount={alertCount}
      >
        <div className="h-full flex flex-col gap-3">
          <KpiStrip items={kpis} />
          <div className="grid grid-cols-12 gap-3 flex-1 min-h-0">
            <div className="col-span-8 min-h-0">
              <Panel title="本周趋势" sub="TOP 12 PLAYS (spark)" height={520}>
                <div className="flex items-center justify-center h-full">
                  <Sparkline values={trend} width={1100} height={380} />
                </div>
              </Panel>
            </div>
            <div className="col-span-4 min-h-0">
              <Panel title="账号榜 · 本周播放" sub="TOP 8" height={520}>
                <RankList rows={data.rows} metric="playsInc" limit={8} />
              </Panel>
            </div>
          </div>
          <Panel title="趋势备注" sub="ANNOTATIONS" height={170}>
            <ul className="grid grid-cols-3 gap-x-6 gap-y-2 text-sm" style={{ color: "var(--ink)" }}>
              <li>· 头部账号<span style={{ color: "var(--ink-dim)" }}> 持续输出</span></li>
              <li>· 中部账号<span style={{ color: "var(--ink-dim)" }}> 加更可见</span></li>
              <li>· 尾部账号<span style={{ color: "var(--ink-dim)" }}> 亟待扶持</span></li>
            </ul>
          </Panel>
        </div>
      </TvScreen>
    </TvStage>
  );
}